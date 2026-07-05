#!/usr/bin/env python3
"""Dad-Math feedback box.

Stores visitor feedback (from the little 💬 tab on every page) in a SQLite DB.
Public endpoint takes submissions; an admin view (put behind nginx basic-auth)
lists them, shows timestamp + IP + page, and lets you tick each one as actioned.

Mirrors the house style of track.py: single stdlib file, run by systemd, no deps.
Run:  python3 feedback.py [PORT]     (default 9110)
DB:   $FEEDBACK_DB or /var/www/jasonsun.org/dad-math-data/feedback.db
      (its own www-data-owned dir in the parent webroot — so SQLite can create the
       db + journal/wal, it's outside the git tree, and off the public GitHub mirror.)
"""

import html
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs

DB_PATH = os.environ.get("FEEDBACK_DB", "/var/www/jasonsun.org/dad-math-data/feedback.db")
MAX_BODY = 16 * 1024          # reject request bodies larger than this
MAX_TEXT = 2000               # chars of feedback kept
MAX_PAGE = 200
MAX_UA = 500
MIN_SECONDS_BETWEEN = 5       # cheap per-IP throttle against spam / double-taps


def _db():
    conn = sqlite3.connect(DB_PATH, timeout=5)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    with _db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS feedback (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                ts          TEXT NOT NULL,
                page        TEXT,
                text        TEXT NOT NULL,
                ip          TEXT,
                ua          TEXT,
                actioned    INTEGER NOT NULL DEFAULT 0,
                actioned_ts TEXT
            )
            """
        )
        conn.commit()


def _now():
    return datetime.now(timezone.utc).isoformat()


class Handler(BaseHTTPRequestHandler):
    # ---- helpers ----
    def _client_ip(self):
        ip = self.headers.get(
            "X-Forwarded-For", self.headers.get("X-Real-IP", self.client_address[0])
        )
        if ip and "," in ip:
            ip = ip.split(",")[0].strip()
        return ip or ""

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length > MAX_BODY:
            return None
        return self.rfile.read(length) if length else b""

    # ---- routing ----
    def do_POST(self):
        if self.path == "/feedback/submit":
            self._submit()
        elif self.path == "/feedback/admin/action":
            self._action()
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path.rstrip("/") == "/feedback/admin":
            self._admin()
        elif self.path == "/feedback/health":
            self._json(200, {"ok": True})
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    # ---- public: submit feedback ----
    def _submit(self):
        body = self._read_body()
        if body is None:
            self._json(413, {"ok": False, "error": "too_big"})
            return
        try:
            data = json.loads(body or b"{}")
        except Exception:
            data = {}
        text = (data.get("text") or "").strip()[:MAX_TEXT]
        page = (data.get("page") or "")[:MAX_PAGE]
        if not text:
            self._json(400, {"ok": False, "error": "empty"})
            return
        ip = self._client_ip()
        ua = self.headers.get("User-Agent", "")[:MAX_UA]
        now = datetime.now(timezone.utc)
        with _db() as conn:
            row = conn.execute(
                "SELECT ts FROM feedback WHERE ip=? ORDER BY id DESC LIMIT 1", (ip,)
            ).fetchone()
            if row:
                try:
                    last = datetime.fromisoformat(row["ts"])
                    if (now - last).total_seconds() < MIN_SECONDS_BETWEEN:
                        self._json(429, {"ok": False, "error": "slow_down"})
                        return
                except Exception:
                    pass
            conn.execute(
                "INSERT INTO feedback (ts, page, text, ip, ua, actioned) VALUES (?,?,?,?,?,0)",
                (now.isoformat(), page, text, ip, ua),
            )
            conn.commit()
        self._json(200, {"ok": True})

    # ---- admin: toggle actioned (plain form POST → redirect back) ----
    def _action(self):
        body = self._read_body()
        if body is None:
            self.send_response(413)
            self.end_headers()
            return
        form = parse_qs((body or b"").decode("utf-8", "replace"))
        try:
            fid = int(form.get("id", ["0"])[0])
        except (ValueError, IndexError):
            fid = 0
        to = 1 if form.get("to", ["1"])[0] == "1" else 0
        ats = _now() if to else None
        with _db() as conn:
            conn.execute(
                "UPDATE feedback SET actioned=?, actioned_ts=? WHERE id=?", (to, ats, fid)
            )
            conn.commit()
        self.send_response(303)
        self.send_header("Location", "/feedback/admin")
        self.end_headers()

    # ---- admin: dashboard (nginx basic-auth protects this path) ----
    def _admin(self):
        with _db() as conn:
            rows = conn.execute(
                "SELECT * FROM feedback ORDER BY actioned ASC, id DESC"
            ).fetchall()
        open_n = sum(1 for r in rows if not r["actioned"])
        body = _render_admin(rows, open_n).encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass


def _render_admin(rows, open_n):
    e = html.escape
    cards = []
    for r in rows:
        actioned = bool(r["actioned"])
        ts = e((r["ts"] or "").replace("T", " ")[:19])
        page = e(r["page"] or "—")
        ip = e(r["ip"] or "—")
        ua = e(r["ua"] or "")
        text = e(r["text"] or "").replace("\n", "<br>")
        if actioned:
            done = e((r["actioned_ts"] or "").replace("T", " ")[:19])
            btn = (
                f'<form method="post" action="/feedback/admin/action">'
                f'<input type="hidden" name="id" value="{r["id"]}">'
                f'<input type="hidden" name="to" value="0">'
                f'<button class="reopen">↺ Reopen</button></form>'
            )
            badge = f'<span class="tag done">✓ actioned {done} UTC</span>'
        else:
            btn = (
                f'<form method="post" action="/feedback/admin/action">'
                f'<input type="hidden" name="id" value="{r["id"]}">'
                f'<input type="hidden" name="to" value="1">'
                f'<button class="mark">✓ Mark actioned</button></form>'
            )
            badge = '<span class="tag open">new</span>'
        cards.append(
            f'<article class="card {"is-done" if actioned else ""}">'
            f'<div class="txt">{text}</div>'
            f'<div class="meta"><b>#{r["id"]}</b> · {ts} UTC · '
            f'page <code>{page}</code> · ip <code>{ip}</code> {badge}</div>'
            f'<div class="ua" title="{ua}">{ua[:90]}</div>'
            f'<div class="act">{btn}</div>'
            f"</article>"
        )
    listing = "\n".join(cards) or '<p class="empty">No feedback yet.</p>'
    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Dad-Math feedback · {open_n} open</title>
<style>
  :root{{--bg:#14131a;--panel:#1d1b25;--ink:#ecebf2;--soft:#b3b1c0;--line:#2f2c3a;--primary:#9d90ff;--good:#55d29c;}}
  *{{box-sizing:border-box}}
  body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:24px}}
  h1{{font-size:1.4rem;margin:0 0 4px}}
  .sub{{color:var(--soft);margin:0 0 20px}}
  .card{{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;margin:0 0 14px;max-width:760px}}
  .card.is-done{{opacity:.6}}
  .txt{{font-size:1.1rem;white-space:pre-wrap;word-break:break-word}}
  .meta{{color:var(--soft);font-size:.82rem;margin-top:10px}}
  .ua{{color:var(--soft);font-size:.72rem;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
  code{{background:#0003;padding:1px 5px;border-radius:5px;font-family:ui-monospace,Menlo,monospace}}
  .tag{{padding:1px 8px;border-radius:20px;font-size:.72rem;font-weight:600;margin-left:4px}}
  .tag.open{{background:var(--primary);color:#14131a}}
  .tag.done{{background:#0000;color:var(--good)}}
  .act{{margin-top:12px}}
  button{{font:inherit;font-weight:600;border:0;border-radius:10px;padding:8px 14px;cursor:pointer}}
  .mark{{background:var(--good);color:#0a2016}}
  .reopen{{background:#0000;color:var(--soft);border:1px solid var(--line)}}
  .empty{{color:var(--soft)}}
</style></head><body>
<h1>💬 Dad-Math feedback</h1>
<p class="sub">{open_n} open · {len(rows)} total · newest &amp; unactioned first</p>
{listing}
</body></html>"""


if __name__ == "__main__":
    _init_db()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9110
    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"Feedback service listening on 127.0.0.1:{port}, db={DB_PATH}")
    server.serve_forever()
