#!/usr/bin/env python3
"""Dad-Math kid accounts — persist stars/badges across devices.

A deliberately *low-stakes* login so a kid can keep collecting badges on any
device. Because the "password" is a drawn pattern (low entropy, guessable), the
real protection is data minimization: an account stores ONLY a self-chosen
handle and the game counters (stars / badges / best scores / homework flags).
No real name, no email, no age, no free text — a breach is just
"DragonKid has 12 stars", which is a shrug.

Secrets are pbkdf2-hashed with a per-user salt (never stored in plain text);
wrong-secret and unknown-handle return byte-identical errors; repeated failures
lock the handle briefly. Progress is merged (max stars/scores, union of
badges/homework) so syncing from two devices never loses anything.

Mirrors the house style of feedback.py / track.py: single stdlib file, run by
systemd, no deps.
Run:  python3 accounts.py [PORT]      (default 9120)
DB:   $ACCOUNTS_DB or /var/www/jasonsun.org/dad-math-data/accounts.db
"""

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler

DB_PATH = os.environ.get("ACCOUNTS_DB", "/var/www/jasonsun.org/dad-math-data/accounts.db")
MAX_BODY = 32 * 1024          # progress blobs are small; reject anything bigger
ITERS = 120_000              # pbkdf2 rounds
USER_RE = re.compile(r"^[A-Za-z0-9_-]{3,20}$")   # a handle, not a name (no spaces); 3–20 chars
MIN_SECRET, MAX_SECRET = 4, 128
MAX_KEY = 40                 # max length of a stars/badge/hw key
MAX_INT_KEYS = 200           # cap map sizes so a blob can't grow unbounded
MAX_FLAG_KEYS = 300
MAX_VAL = 10_000_000
FAIL_LIMIT = 5               # wrong secrets before a short lockout
LOCK_SECONDS = 60


def _db():
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    with _db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                username_lc  TEXT NOT NULL UNIQUE,
                username     TEXT NOT NULL,
                salt         BLOB NOT NULL,
                hash         BLOB NOT NULL,
                iters        INTEGER NOT NULL,
                progress     TEXT NOT NULL DEFAULT '{}',
                fails        INTEGER NOT NULL DEFAULT 0,
                lock_until   TEXT,
                created_ts   TEXT NOT NULL,
                updated_ts   TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token   TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                ts      TEXT NOT NULL
            )
            """
        )
        conn.commit()


def _now():
    return datetime.now(timezone.utc)


# ---- secret hashing ----
def _hash(secret, salt, iters=ITERS):
    return hashlib.pbkdf2_hmac("sha256", secret.encode("utf-8"), salt, iters)


# ---- progress cleaning / merging (all counters are monotonic) ----
def _clean_int_map(m):
    out = {}
    if isinstance(m, dict):
        for k, v in list(m.items())[:MAX_INT_KEYS]:
            if not isinstance(k, str) or len(k) > MAX_KEY:
                continue
            if isinstance(v, bool) or not isinstance(v, (int, float)):
                continue
            iv = int(v)
            if 0 <= iv <= MAX_VAL:
                out[k] = iv
    return out


def _clean_flag_map(m):
    out = {}
    if isinstance(m, dict):
        for k, v in list(m.items())[:MAX_FLAG_KEYS]:
            if isinstance(k, str) and len(k) <= MAX_KEY and v:
                out[k] = True
    return out


def _clean_progress(obj):
    if not isinstance(obj, dict):
        obj = {}
    return {
        "stars": _clean_int_map(obj.get("stars")),
        "best": _clean_int_map(obj.get("best")),
        "badges": _clean_flag_map(obj.get("badges")),
        "hw": _clean_flag_map(obj.get("hw")),
    }


def _merge(a, b):
    a, b = _clean_progress(a), _clean_progress(b)
    out = {"stars": {}, "best": {}, "badges": {}, "hw": {}}
    for key in ("stars", "best"):
        for src in (a, b):
            for k, v in src[key].items():
                if v > out[key].get(k, 0):
                    out[key][k] = v
    for key in ("badges", "hw"):
        for src in (a, b):
            for k in src[key]:
                out[key][k] = True
    return out


class Handler(BaseHTTPRequestHandler):
    # ---- helpers ----
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _bad_login(self):
        # identical response for unknown handle AND wrong secret (no enumeration)
        self._json(401, {"ok": False, "error": "bad_login"})

    def _read_json(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length > MAX_BODY:
            return None, "too_big"
        raw = self.rfile.read(length) if length else b""
        try:
            data = json.loads(raw or b"{}")
        except Exception:
            data = {}
        return (data if isinstance(data, dict) else {}), None

    def _creds(self, data):
        username = data.get("username")
        secret = data.get("secret")
        if not isinstance(username, str) or not isinstance(secret, str):
            return None, None
        return username.strip(), secret

    # ---- routing ----
    def do_POST(self):
        route = {
            "/account/signup": self._signup,
            "/account/login": self._login,
            "/account/sync": self._sync,
            "/account/logout": self._logout,
        }.get(self.path)
        if route:
            route()
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == "/account/health":
            self._json(200, {"ok": True})
        else:
            self.send_response(404)
            self.end_headers()

    # ---- signup ----
    def _signup(self):
        data, err = self._read_json()
        if err:
            self._json(413, {"ok": False, "error": err})
            return
        username, secret = self._creds(data)
        if not username or not USER_RE.match(username):
            self._json(400, {"ok": False, "error": "bad_handle"})
            return
        if not secret or not (MIN_SECRET <= len(secret) <= MAX_SECRET):
            self._json(400, {"ok": False, "error": "bad_secret"})
            return
        progress = _clean_progress(data.get("progress"))
        salt = os.urandom(16)
        h = _hash(secret, salt)
        now = _now().isoformat()
        try:
            with _db() as conn:
                cur = conn.execute(
                    "INSERT INTO users (username_lc, username, salt, hash, iters, progress, created_ts, updated_ts)"
                    " VALUES (?,?,?,?,?,?,?,?)",
                    (username.lower(), username, salt, h, ITERS, json.dumps(progress), now, now),
                )
                token = secrets.token_hex(16)
                conn.execute("INSERT INTO sessions (token, user_id, ts) VALUES (?,?,?)",
                             (token, cur.lastrowid, now))
                conn.commit()
        except sqlite3.IntegrityError:
            self._json(409, {"ok": False, "error": "taken"})
            return
        self._json(200, {"ok": True, "token": token, "username": username, "progress": progress})

    # ---- login ----
    def _login(self):
        data, err = self._read_json()
        if err:
            self._json(413, {"ok": False, "error": err})
            return
        username, secret = self._creds(data)
        if not username or not secret:
            self._bad_login()
            return
        with _db() as conn:
            row = conn.execute("SELECT * FROM users WHERE username_lc=?",
                               (username.lower(),)).fetchone()
            if row is None:
                _hash(secret, b"0" * 16)      # equalize timing vs a real verify
                self._bad_login()
                return
            now = _now()
            if row["lock_until"]:
                try:
                    if now < datetime.fromisoformat(row["lock_until"]):
                        self._bad_login()      # locked → same opaque error
                        return
                except Exception:
                    pass
            calc = _hash(secret, row["salt"], row["iters"])
            if hmac.compare_digest(calc, row["hash"]):
                conn.execute("UPDATE users SET fails=0, lock_until=NULL WHERE id=?", (row["id"],))
                token = secrets.token_hex(16)
                conn.execute("INSERT INTO sessions (token, user_id, ts) VALUES (?,?,?)",
                             (token, row["id"], now.isoformat()))
                conn.commit()
                progress = _clean_progress(json.loads(row["progress"] or "{}"))
                self._json(200, {"ok": True, "token": token,
                                 "username": row["username"], "progress": progress})
                return
            fails = row["fails"] + 1
            lock = (now + timedelta(seconds=LOCK_SECONDS)).isoformat() if fails >= FAIL_LIMIT else None
            conn.execute("UPDATE users SET fails=?, lock_until=? WHERE id=?",
                         (0 if lock else fails, lock, row["id"]))
            conn.commit()
        self._bad_login()

    # ---- sync (merge client + stored, persist, return merged) ----
    def _sync(self):
        data, err = self._read_json()
        if err:
            self._json(413, {"ok": False, "error": err})
            return
        token = data.get("token")
        if not isinstance(token, str) or not token:
            self._json(401, {"ok": False, "error": "no_session"})
            return
        with _db() as conn:
            sess = conn.execute("SELECT user_id FROM sessions WHERE token=?", (token,)).fetchone()
            if sess is None:
                self._json(401, {"ok": False, "error": "no_session"})
                return
            row = conn.execute("SELECT progress FROM users WHERE id=?", (sess["user_id"],)).fetchone()
            stored = json.loads(row["progress"] or "{}") if row else {}
            merged = _merge(stored, data.get("progress"))
            conn.execute("UPDATE users SET progress=?, updated_ts=? WHERE id=?",
                         (json.dumps(merged), _now().isoformat(), sess["user_id"]))
            conn.commit()
        self._json(200, {"ok": True, "progress": merged})

    # ---- logout ----
    def _logout(self):
        data, err = self._read_json()
        if err:
            self._json(413, {"ok": False, "error": err})
            return
        token = data.get("token")
        if isinstance(token, str) and token:
            with _db() as conn:
                conn.execute("DELETE FROM sessions WHERE token=?", (token,))
                conn.commit()
        self._json(200, {"ok": True})

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    _init_db()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9120
    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"Accounts service listening on 127.0.0.1:{port}, db={DB_PATH}")
    server.serve_forever()
