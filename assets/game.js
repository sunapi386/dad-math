/* Shared gamification: stars, badges, ranks, toasts. Progress lives in localStorage. */
(function () {
  var KEY = "dadmath-progress";
  var activeUser = null;     // null = anonymous / this-device only; a handle when logged in
  var subs = [];             // save() subscribers (the account sync glue registers here)

  function keyFor(u) { return u ? KEY + ":" + u : KEY; }
  function normalize(p) {
    p = p || {};
    p.stars = p.stars || {};   // { sourceId: starCount }
    p.badges = p.badges || {}; // { badgeId: true }
    p.best = p.best || {};     // { gameId: bestScore }
    p.hw = p.hw || {};         // { lessonId: true } — homework checks passed
    return p;
  }
  function load() {
    try { return normalize(JSON.parse(localStorage.getItem(keyFor(activeUser)))); }
    catch (e) { return normalize({}); }
  }
  function persist() { try { localStorage.setItem(keyFor(activeUser), JSON.stringify(P)); } catch (e) {} }
  function save() { persist(); for (var i = 0; i < subs.length; i++) { try { subs[i](P); } catch (e) {} } }

  // merge a remote/other snapshot into P: counters take the MAX, flags UNION —
  // monotonic, so syncing from two devices never loses a badge or a best score.
  function mergeInto(remote) {
    if (!remote) return;
    ["stars", "best"].forEach(function (key) {
      var m = remote[key] || {};
      for (var k in m) if (typeof m[k] === "number" && m[k] > (P[key][k] || 0)) P[key][k] = m[k];
    });
    ["badges", "hw"].forEach(function (key) {
      var m = remote[key] || {};
      for (var k in m) if (m[k]) P[key][k] = true;
    });
  }

  // ---- chore chart: parent-assigned homework + a parent PIN + when each was passed ----
  // Stored at a FIXED device key, NOT the per-account namespace, so assignments survive the
  // kid logging in/out to save badges. (Designed for one kid per device.)
  var CHORE_KEY = "dadmath-chores";
  var chores = (function () {
    var c; try { c = JSON.parse(localStorage.getItem(CHORE_KEY)) || {}; } catch (e) { c = {}; }
    c.assign = c.assign || {};   // { id: assignedAtMs }
    c.passed = c.passed || {};   // { id: lastPassMs } — updated on every homework pass
    c.pin = c.pin || null;       // { salt, hash } hashed 4-digit parent PIN (not plain text)
    return c;
  })();
  function saveChores() { try { localStorage.setItem(CHORE_KEY, JSON.stringify(chores)); } catch (e) {} }
  function pinHash(pin, salt) {
    var h = (0x811c9dc5 ^ salt) >>> 0, s = salt + ":" + pin;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  var P = load();

  var BADGES = {
    "first-star":  { icon: "⭐", name: "First Star",       desc: "Earn your very first star." },
    "gauss-5":     { icon: "⚡", name: "Gauss Sprinter",   desc: "Get a 5 streak in Lesson 1's Sum Sprint." },
    "square-5":    { icon: "🟧", name: "Square Seer",      desc: "Get a 5 streak in Lesson 2's puzzle." },
    "tri-5":       { icon: "🔺", name: "Triangle Tamer",   desc: "Get a 5 streak in Lesson 3's puzzle." },
    "parity-5":    { icon: "⚖️", name: "Parity Prophet",   desc: "Get a 5 streak in Lesson 4's oracle." },
    "sprint-10":   { icon: "🏃", name: "Speed Demon",      desc: "10 correct in one arcade Sum Sprint round." },
    "squarenot-12":{ icon: "🎯", name: "Sharp Eye",        desc: "12 correct in one Square-or-Not round." },
    "pairs-clear": { icon: "🫧", name: "Pair Popper",      desc: "Clear the whole Pair Pop board." },
    "pairs-fast":  { icon: "💨", name: "Lightning Popper", desc: "Clear Pair Pop in under 25 seconds." },
    "tri-sprint-8":{ icon: "🎳", name: "Pin Counter",      desc: "8 correct in one Triangle Trouble round." },
    "oracle-10":   { icon: "🧿", name: "Odd Oracle",       desc: "10 correct in one Odd-or-Even round." },
    "star-10":     { icon: "🌟", name: "Star Collector",   desc: "Collect 10 stars in total." },
    "star-25":     { icon: "🌌", name: "Constellation",    desc: "Collect 25 stars in total." },
    "fib-5":       { icon: "🐰", name: "Rabbit Wrangler",  desc: "Get a 5 streak in Lesson 5's Fibonacci puzzle." },
    "hw-all":      { icon: "🎓", name: "Homework Hero",    desc: "Pass the homework check for all five math lessons." },
    "cs-bin":      { icon: "💡", name: "Bit Flipper",      desc: "Get a 5 streak in the binary puzzle." },
    "cs-crypto":   { icon: "🕵️", name: "Code Cracker",     desc: "Get a 5 streak decoding secret messages." },
    "cs-login":    { icon: "🔑", name: "Key Keeper",       desc: "Get a 5 streak in the login-safety quiz." },
    "gt-euler":    { icon: "🌉", name: "Bridge Master",    desc: "Get a 5 streak in the Euler path puzzle." },
    "qm-story":    { icon: "🐱", name: "Cat Whisperer",    desc: "Finish the quantum story to the very end." },
    "gl-loop":     { icon: "🎮", name: "Game Maker",       desc: "Score 25 in Cave Dodge — the game you built." },
    "gl-path":     { icon: "🧭", name: "Pathfinder",       desc: "Get a 5 streak counting shortest paths." },
    "gl-factory":  { icon: "⚙️", name: "Gate Keeper",      desc: "Get a 5 streak in the logic-gate quiz." },
    "gl-world":    { icon: "🗺️", name: "World Builder",    desc: "Get a 5 streak running the seed recipe." },
    "gl-physics":  { icon: "🐦", name: "Arc Angel",        desc: "Get a 5 streak reading the Angry Bird's arc." },
    "gl-aim":      { icon: "🐛", name: "Bug Buster",       desc: "Pass the Deep Rock aim & hitboxes check." },
    "gd-tree":     { icon: "🌳", name: "Master Builder",   desc: "Research the whole Builder's Tree — every module of your game installed." }
  };

  // [starsNeeded, icon, title]
  var RANKS = [
    [0,  "🐣", "Rookie"],
    [5,  "🎒", "Counting Cadet"],
    [12, "🔍", "Pattern Hunter"],
    [25, "🧙", "Formula Wizard"],
    [50, "👑", "Little Gauss"]
  ];

  function totalStars() { var t = 0; for (var k in P.stars) t += P.stars[k]; return t; }

  function rank() {
    var t = totalStars(), cur = RANKS[0], next = null;
    for (var i = 0; i < RANKS.length; i++) {
      if (t >= RANKS[i][0]) cur = RANKS[i];
      else { next = RANKS[i]; break; }
    }
    return { stars: t, icon: cur[1], title: cur[2], at: cur[0], next: next ? { at: next[0], icon: next[1], title: next[2] } : null };
  }

  // ---- toasts ----
  var wrap = null;
  function toast(html) {
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = html;
    wrap.appendChild(t);
    setTimeout(function () { t.classList.add("bye"); }, 2900);
    setTimeout(function () { t.remove(); }, 3400);
  }

  // ---- topbar star chip ----
  function chipUpdate() {
    var c = document.getElementById("starChip");
    if (c) c.innerHTML = "⭐ " + totalStars();
  }
  function chipMount() {
    var btn = document.getElementById("themeBtn");
    if (!btn || document.getElementById("starChip")) return;
    var a = document.createElement("a");
    a.id = "starChip";
    a.className = "star-chip";
    a.href = "arcade.html";
    a.title = "Your stars — visit the Arcade";
    btn.parentNode.insertBefore(a, btn);
    chipUpdate();
  }
  if (document.readyState !== "loading") chipMount();
  else document.addEventListener("DOMContentLoaded", chipMount);

  window.DadMath = {
    data: function () { return P; },
    BADGES: BADGES,
    totalStars: totalStars,
    rank: rank,

    /* award n stars from a source, with a toast explaining why */
    star: function (src, n, why) {
      n = n || 1;
      P.stars[src] = (P.stars[src] || 0) + n;
      save(); chipUpdate();
      toast("⭐ <b>+" + n + " star" + (n > 1 ? "s" : "") + "</b>" + (why ? " — " + why : ""));
      this.badge("first-star");
      if (totalStars() >= 10) this.badge("star-10");
      if (totalStars() >= 25) this.badge("star-25");
    },

    /* unlock a one-time badge (no-op if already earned) */
    badge: function (id) {
      if (P.badges[id] || !BADGES[id]) return false;
      P.badges[id] = true;
      save();
      var b = BADGES[id];
      toast("<b>" + b.icon + " Badge unlocked: " + b.name + "</b><br><span class='small'>" + b.desc + "</span>");
      return true;
    },

    /* homework checks: mark a lesson's homework as validated.
       Optional `why` customizes the first-pass toast (the Builder's Tree uses it). */
    hwPass: function (id, why) {
      var first = !P.hw[id];
      P.hw[id] = true;
      chores.passed[id] = Date.now(); saveChores();   // record WHEN, for the chore chart
      save();
      if (first) this.star("hw-" + id, 2, why || "Homework check passed!");
      else this.toast("✅ " + (why || "Homework re-checked — still got it!"));
      var all = ["l1", "l2", "l3", "l4", "l5"].every(function (k) { return P.hw[k]; });
      if (all) this.badge("hw-all");
    },
    hwDone: function (id) { return !!P.hw[id]; },

    // ---- homework assignments / parent chore chart (device-scoped) ----
    hwPassedAt: function (id) { return chores.passed[id] || 0; },
    parentPinSet: function () { return !!chores.pin; },
    setParentPin: function (pin) {
      var salt = 1 + Math.floor(Math.random() * 2000000000);
      chores.pin = { salt: salt, hash: pinHash(String(pin), salt) }; saveChores();
    },
    parentPinOk: function (pin) {
      return !!chores.pin && pinHash(String(pin), chores.pin.salt) === chores.pin.hash;
    },
    setAssigned: function (id, on) {
      if (on) chores.assign[id] = Date.now(); else delete chores.assign[id];
      saveChores();
    },
    isAssigned: function (id) { return !!chores.assign[id]; },
    assignedAt: function (id) { return chores.assign[id] || 0; },
    assignedIds: function () { return Object.keys(chores.assign); },
    /* an assignment is "done" only if it was PASSED AFTER it was assigned (real work, not old credit) */
    assignmentDone: function (id) {
      return !!chores.assign[id] && (chores.passed[id] || 0) >= chores.assign[id];
    },

    /* record a best score; returns true if it's a new record */
    best: function (game, score) {
      if (score > (P.best[game] || 0)) { P.best[game] = score; save(); return true; }
      return false;
    },
    getBest: function (game) { return P.best[game] || 0; },

    reset: function () {
      if (!confirm("Erase all stars, badges and best scores on this device?")) return;
      P = { stars: {}, badges: {}, best: {}, hw: {} };
      save(); location.reload();
    },

    // ---- account sync glue (used by account.js; no-ops if that isn't loaded) ----
    /* register a callback fired after every progress change (debounced sync lives there) */
    onSave: function (fn) { if (typeof fn === "function") subs.push(fn); },
    /* fold a server/other-device snapshot in (max/union), persist WITHOUT re-firing sync */
    mergeRemote: function (remote) { mergeInto(remote); persist(); chipUpdate(); return P; },
    /* switch the active localStorage namespace (handle when logged in, null when not) */
    setUser: function (u) { activeUser = u || null; P = load(); chipUpdate(); return P; },
    user: function () { return activeUser; },
    refresh: chipUpdate,

    toast: toast
  };
})();
