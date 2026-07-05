/* Dad-Math kid accounts — optional cloud save so badges follow you across devices.
 *
 * The "password" is a drawn pattern (see cs03-logins.html for how it's kept safe:
 * it's hashed on the server, never stored as-is). Login is entirely opt-in — every
 * game works logged out; signing in just syncs this device's progress up and merges
 * in whatever the account already has (nothing is ever overwritten, only maxed/unioned).
 *
 * Talks to /account/* (server/accounts.py). Pairs with game.js's setUser/mergeRemote/
 * onSave hooks. Self-contained: injects its own styles, reuses the site's theme tokens.
 */
(function () {
  if (window.__dadAccount) return;
  window.__dadAccount = true;

  var SESSION_KEY = "dadmath-session";    // { token, username }
  var PROFILES_KEY = "dadmath-profiles";  // [username] remembered on THIS device only
  var session = null;
  try { session = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) {}
  if (!session || !session.token || !session.username) session = null;

  function profiles() { try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || []; } catch (e) { return []; } }
  function rememberProfile(u) {
    var p = profiles().filter(function (x) { return x !== u; });
    p.unshift(u);
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(p.slice(0, 6))); } catch (e) {}
  }
  function forgetProfile(u) {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles().filter(function (x) { return x !== u; }))); } catch (e) {}
  }

  function api(path, body) {
    return fetch("/account" + path, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; });
    });
  }

  // ---------- sync glue ----------
  var syncTimer = null;
  function scheduleSync() { if (!session) return; clearTimeout(syncTimer); syncTimer = setTimeout(doSync, 1500); }
  function doSync() {
    if (!session || !window.DadMath) return;
    api("/sync", { token: session.token, progress: DadMath.data() }).then(function (res) {
      if (res.status === 200 && res.body.ok) DadMath.mergeRemote(res.body.progress);
      else if (res.status === 401) endSession(true);   // session gone server-side
    }).catch(function () {});
  }
  if (window.DadMath) DadMath.onSave(scheduleSync);

  function startSession(token, username, serverProgress) {
    var anon = window.DadMath ? JSON.parse(JSON.stringify(DadMath.data())) : null;  // progress earned logged-out
    session = { token: token, username: username };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
    rememberProfile(username);
    if (window.DadMath) {
      DadMath.setUser(username);           // switch to this handle's namespace
      DadMath.mergeRemote(serverProgress); // fold in the cloud copy
      if (anon) DadMath.mergeRemote(anon); // fold in anything earned while logged out
      doSync();                            // push the merge up; server returns canonical
    }
    renderChip();
  }
  function endSession(silent) {
    var tok = session && session.token;
    session = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    if (window.DadMath) DadMath.setUser(null);
    renderChip();
    if (tok && !silent) api("/logout", { token: tok }).catch(function () {});
  }

  // On page load with a saved session: adopt the namespace immediately, then reconcile.
  if (session && window.DadMath) { DadMath.setUser(session.username); doSync(); }

  // ---------- styles ----------
  var css = document.createElement("style");
  css.textContent =
    "#acct-chip{font:inherit;font-weight:600;font-size:.9rem;border:1px solid var(--line,#ccc);" +
    "background:var(--panel,#fff);color:var(--ink,#222);border-radius:20px;padding:5px 12px;cursor:pointer;" +
    "display:inline-flex;align-items:center;gap:5px;margin-right:8px;max-width:11rem}" +
    "#acct-chip .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
    "#acct-scrim{position:fixed;inset:0;background:rgba(0,0,0,.5);opacity:0;pointer-events:none;" +
    "transition:opacity .2s;z-index:998}" +
    "#acct-scrim.on{opacity:1;pointer-events:auto}" +
    "#acct-modal{position:fixed;z-index:999;left:50%;top:50%;transform:translate(-50%,-46%) scale(.96);" +
    "opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;width:min(94vw,380px);" +
    "background:var(--panel,#fff);color:var(--ink,#222);border:1px solid var(--line,#ddd);" +
    "border-radius:var(--radius,16px);box-shadow:var(--shadow,0 20px 60px rgba(0,0,0,.35));padding:20px}" +
    "#acct-modal.on{opacity:1;pointer-events:auto;transform:translate(-50%,-50%) scale(1)}" +
    "#acct-modal h3{margin:0 0 4px;font-size:1.2rem}" +
    "#acct-modal p.sub{margin:0 0 14px;color:var(--ink-soft,#666);font-size:.86rem}" +
    "#acct-modal .prof{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}" +
    "#acct-modal .prof button{font:inherit;font-size:.82rem;border:1px solid var(--line,#ccc);" +
    "background:var(--primary-soft,#eee);color:var(--ink,#222);border-radius:16px;padding:4px 10px;cursor:pointer}" +
    "#acct-handle{width:100%;font:inherit;padding:9px 11px;border:1px solid var(--line,#ccc);" +
    "border-radius:10px;background:var(--bg,#fff);color:var(--ink,#222);margin:0 0 6px}" +
    "#acct-pad{touch-action:none;display:block;margin:6px auto 4px;width:220px;height:220px;max-width:100%}" +
    "#acct-pad line.link{stroke:var(--primary,#7c6cff);stroke-width:6;stroke-linecap:round}" +
    "#acct-pad circle.dot{fill:var(--line,#bbb)}" +
    "#acct-pad circle.on{fill:var(--primary,#7c6cff)}" +
    "#acct-pad circle.hit{fill:transparent}" +
    "#acct-modal .padhint{text-align:center;color:var(--ink-soft,#666);font-size:.8rem;margin:0 0 12px}" +
    "#acct-modal .btns{display:flex;gap:8px}" +
    "#acct-modal .btns button{flex:1;font:inherit;font-weight:700;border:0;border-radius:11px;padding:11px;cursor:pointer}" +
    "#acct-login{background:var(--primary,#7c6cff);color:#fff}" +
    "#acct-signup{background:var(--primary-soft,#eee);color:var(--ink,#222);border:1px solid var(--line,#ccc)!important}" +
    "#acct-status{min-height:1.2em;margin-top:10px;font-size:.85rem;text-align:center}" +
    "#acct-status.err{color:var(--accent,#e0517a)}#acct-status.ok{color:var(--good,#37b47e)}" +
    "#acct-modal .foot{margin-top:12px;text-align:center;font-size:.8rem}" +
    "#acct-modal .foot a{color:var(--primary,#7c6cff)}" +
    "#acct-modal .clr{background:none;border:0;color:var(--ink-soft,#888);font:inherit;font-size:.8rem;cursor:pointer;float:right}";
  (document.head || document.documentElement).appendChild(css);

  // ---------- topbar chip ----------
  function renderChip() {
    var host = document.getElementById("themeBtn");
    if (!host || !host.parentNode) return;
    var chip = document.getElementById("acct-chip");
    if (!chip) {
      chip = document.createElement("button");
      chip.id = "acct-chip";
      chip.type = "button";
      chip.addEventListener("click", openModal);
      var star = document.getElementById("starChip");
      host.parentNode.insertBefore(chip, star || host);
    }
    chip.innerHTML = session
      ? "👤 <span class='nm'>" + escapeHtml(session.username) + "</span>"
      : "👤 <span class='nm'>Save progress</span>";
    chip.title = session ? "Logged in as " + session.username : "Log in to save your badges across devices";
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ---------- pattern pad ----------
  function buildPad(svg) {
    var seq = [], drawing = false, changeCb = null;
    var NS = "http://www.w3.org/2000/svg";
    var pts = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) pts.push({ x: 30 + c * 80, y: 30 + r * 80, r: r, c: c });
    var linkG = document.createElementNS(NS, "g");
    var live = document.createElementNS(NS, "line"); live.setAttribute("class", "link"); live.style.display = "none";
    svg.appendChild(linkG); svg.appendChild(live);
    var dotEls = [], hitEls = [];
    pts.forEach(function (p, i) {
      var hit = document.createElementNS(NS, "circle");
      hit.setAttribute("class", "hit"); hit.setAttribute("cx", p.x); hit.setAttribute("cy", p.y); hit.setAttribute("r", 33);
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("class", "dot"); dot.setAttribute("cx", p.x); dot.setAttribute("cy", p.y); dot.setAttribute("r", 11);
      svg.appendChild(hit); svg.appendChild(dot); dotEls.push(dot); hitEls.push(hit);
    });
    function toSvg(e) {
      var box = svg.getBoundingClientRect();
      var t = (e.touches && e.touches[0]) || e;
      return { x: (t.clientX - box.left) * (240 / box.width), y: (t.clientY - box.top) * (240 / box.height) };
    }
    function nearest(p) {
      for (var i = 0; i < pts.length; i++) {
        var dx = pts[i].x - p.x, dy = pts[i].y - p.y;
        if (dx * dx + dy * dy <= 30 * 30) return i;
      }
      return -1;
    }
    function midpoint(a, b) {            // Android-style: passing through a middle dot selects it
      var mr = (pts[a].r + pts[b].r), mc = (pts[a].c + pts[b].c);
      if (mr % 2 === 0 && mc % 2 === 0) { return (mr / 2) * 3 + (mc / 2); }
      return -1;
    }
    function add(i) {
      if (i < 0 || seq.indexOf(i) !== -1) return;
      if (seq.length) { var m = midpoint(seq[seq.length - 1], i); if (m >= 0 && seq.indexOf(m) === -1) push(m); }
      push(i);
    }
    function push(i) {
      seq.push(i); dotEls[i].setAttribute("class", "dot on");
      if (seq.length > 1) {
        var a = pts[seq[seq.length - 2]], b = pts[i];
        var ln = document.createElementNS(NS, "line"); ln.setAttribute("class", "link");
        ln.setAttribute("x1", a.x); ln.setAttribute("y1", a.y); ln.setAttribute("x2", b.x); ln.setAttribute("y2", b.y);
        linkG.appendChild(ln);
      }
      if (changeCb) changeCb(seq.length);
    }
    function start(e) { clear(); drawing = true; move(e); e.preventDefault(); }
    function move(e) {
      if (!drawing) return;
      var p = toSvg(e); add(nearest(p));
      if (seq.length) {
        var last = pts[seq[seq.length - 1]];
        live.setAttribute("x1", last.x); live.setAttribute("y1", last.y);
        live.setAttribute("x2", p.x); live.setAttribute("y2", p.y); live.style.display = "";
      }
      e.preventDefault();
    }
    function end() { drawing = false; live.style.display = "none"; }
    function clear() {
      seq = []; linkG.innerHTML = ""; live.style.display = "none";
      dotEls.forEach(function (d) { d.setAttribute("class", "dot"); });
      if (changeCb) changeCb(0);
    }
    svg.addEventListener("mousedown", start); window.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
    svg.addEventListener("touchstart", start, { passive: false });
    svg.addEventListener("touchmove", move, { passive: false });
    svg.addEventListener("touchend", end);
    return { secret: function () { return seq.join("-"); }, len: function () { return seq.length; }, clear: clear,
             onChange: function (fn) { changeCb = fn; } };
  }

  // ---------- modal ----------
  var scrim, modal, pad, handleEl, statusEl, padHintEl;
  function buildModal() {
    scrim = document.createElement("div"); scrim.id = "acct-scrim"; scrim.addEventListener("click", closeModal);
    modal = document.createElement("div"); modal.id = "acct-modal";
    modal.innerHTML =
      "<button class='clr' id='acct-x' title='Close'>✕</button>" +
      "<h3>Save your badges ⭐</h3>" +
      "<p class='sub'>Pick a nickname and draw a secret shape. Then your stars and badges " +
      "follow you to any device — phone, tablet, laptop.</p>" +
      "<div class='prof' id='acct-prof'></div>" +
      "<input id='acct-handle' maxlength='20' autocomplete='off' autocapitalize='off' spellcheck='false' " +
      "placeholder='Nickname (e.g. DragonKid)'>" +
      "<svg id='acct-pad' viewBox='0 0 240 240' aria-label='draw your secret pattern'></svg>" +
      "<div class='padhint' id='acct-padhint'>Draw a shape through at least 4 dots</div>" +
      "<div class='btns'><button id='acct-login'>Log in</button><button id='acct-signup'>Create</button></div>" +
      "<div id='acct-status'></div>" +
      "<div class='foot'><a href='cs03-logins.html'>How does this keep my pattern safe? →</a></div>";
    document.body.appendChild(scrim); document.body.appendChild(modal);
    handleEl = modal.querySelector("#acct-handle");
    statusEl = modal.querySelector("#acct-status");
    padHintEl = modal.querySelector("#acct-padhint");
    pad = buildPad(modal.querySelector("#acct-pad"));
    pad.onChange(function (n) { padHintEl.textContent = n === 0 ? "Draw a shape through at least 4 dots"
      : n < 4 ? "Keep going — " + (4 - n) + " more dot" + (4 - n > 1 ? "s" : "") : "Nice shape! ✔"; });
    modal.querySelector("#acct-x").addEventListener("click", closeModal);
    modal.querySelector("#acct-login").addEventListener("click", function () { submit("/login", "Log in"); });
    modal.querySelector("#acct-signup").addEventListener("click", function () { submit("/signup", "Create"); });
  }
  function renderProfiles() {
    var box = modal.querySelector("#acct-prof"); box.innerHTML = "";
    if (session) {
      box.innerHTML = "<span style='font-size:.85rem;color:var(--ink-soft,#666)'>Logged in as <b>" +
        escapeHtml(session.username) + "</b></span>";
      var out = document.createElement("button"); out.textContent = "Log out";
      out.addEventListener("click", function () { endSession(); closeModal(); });
      box.appendChild(out);
      return;
    }
    profiles().forEach(function (u) {
      var b = document.createElement("button"); b.textContent = "👤 " + u;
      b.addEventListener("click", function () { handleEl.value = u; pad.clear(); handleEl.blur(); });
      box.appendChild(b);
    });
  }
  function openModal() {
    if (!modal) buildModal();
    renderProfiles();
    setStatus(""); if (!session) { handleEl.value = ""; pad.clear(); }
    scrim.classList.add("on"); modal.classList.add("on");
  }
  function closeModal() { if (modal) { scrim.classList.remove("on"); modal.classList.remove("on"); } }
  function setStatus(msg, kind) { statusEl.textContent = msg || ""; statusEl.className = kind || ""; }

  function submit(path, label) {
    var username = (handleEl.value || "").trim();
    var secret = pad.secret();
    if (!/^[A-Za-z0-9_-]{2,20}$/.test(username)) { setStatus("Nickname: 2–20 letters/numbers, no spaces.", "err"); return; }
    if (pad.len() < 4) { setStatus("Draw a shape through at least 4 dots.", "err"); return; }
    setStatus("…", "");
    api(path, { username: username, secret: secret, progress: window.DadMath ? DadMath.data() : {} })
      .then(function (res) {
        var b = res.body || {};
        if (res.status === 200 && b.ok) {
          startSession(b.token, b.username, b.progress);
          setStatus("Saved! Logged in as " + b.username + " ✔", "ok");
          setTimeout(closeModal, 800);
        } else if (b.error === "taken") {
          setStatus("That nickname is taken — try “Log in”, or pick another.", "err");
        } else if (b.error === "bad_login") {
          setStatus("Nickname or pattern didn’t match. Try again.", "err");
        } else if (b.error === "bad_handle") { setStatus("Nickname: 2–20 letters/numbers, no spaces.", "err"); }
        else if (b.error === "bad_secret") { setStatus("Draw a longer shape.", "err"); }
        else { setStatus("Saving isn’t available right now — your progress is still safe on this device.", "err"); }
      })
      .catch(function () { setStatus("Couldn’t reach the save server — progress stays on this device for now.", "err"); });
  }

  if (document.readyState !== "loading") renderChip();
  else document.addEventListener("DOMContentLoaded", renderChip);
})();
