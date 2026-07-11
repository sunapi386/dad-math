/*! Core Keep — the Tower Lab game engine.
 * Pure, deterministic, DOM-free: the whole game is math, so the same file
 * powers the playable game (td00) AND the headless strategy lab (td04),
 * and every rule in it is machine-verified in node before deploy.
 * No randomness anywhere: same build + same buttons = same battle, always. */
var TD = (function () {
  var T = {};

  /* ---------- the map ---------- */
  T.COLS = 13; T.ROWS = 9;
  // the bug road: axis-aligned waypoints in cell coordinates (centres at +0.5)
  T.WAYPTS = [[-1, 1], [9, 1], [9, 4], [3, 4], [3, 7], [13, 7]];
  var segs = [], total = 0;
  (function () {
    for (var i = 0; i < T.WAYPTS.length - 1; i++) {
      var a = T.WAYPTS[i], b = T.WAYPTS[i + 1];
      var len = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
      segs.push({ a: a, b: b, len: len, start: total });
      total += len;
    }
  })();
  T.LENGTH = total;   // path length in cells (32)

  // where is a bug that has walked s cells? (cell coords of its centre)
  T.posAt = function (s) {
    if (s <= 0) { var a = T.WAYPTS[0]; return [a[0] + 0.5, a[1] + 0.5]; }
    for (var i = 0; i < segs.length; i++) {
      var g = segs[i];
      if (s <= g.start + g.len || i === segs.length - 1) {
        var f = Math.min(1, (s - g.start) / g.len);
        return [g.a[0] + (g.b[0] - g.a[0]) * f + 0.5, g.a[1] + (g.b[1] - g.a[1]) * f + 0.5];
      }
    }
  };

  // cells the road runs through — you can't build on the road
  T.PATHCELLS = (function () {
    var set = {};
    for (var s = 0; s <= total; s += 0.2) {
      var p = T.posAt(s), c = Math.floor(p[0]), r = Math.floor(p[1]);
      if (c >= 0 && c < T.COLS && r >= 0 && r < T.ROWS) set[c + "," + r] = true;
    }
    return set;
  })();

  /* ---------- the shop (every number on the card is used by the math) ---------- */
  T.TOWERS = {
    gunner: { icon: "🔫", name: "Gunner", cost: 20, range: 2.6, dmg: 3,  rate: 2,   splash: 0,   slow: 0 },
    mortar: { icon: "💣", name: "Mortar", cost: 45, range: 3.2, dmg: 14, rate: 0.5, splash: 1.1, slow: 0 },
    cryo:   { icon: "❄️", name: "Cryo",   cost: 30, range: 2.2, dmg: 1,  rate: 1,   splash: 0,   slow: 0.5, slowDur: 1.5 }
  };
  T.SELLBACK = 0.75;  // sell a tower for 75% of what you paid (rounded down)

  T.ENEMIES = {
    grunt:  { icon: "🐛", name: "grunt",  speed: 1.0,  hpMul: 1,   bounty: 1 },
    runner: { icon: "🦗", name: "runner", speed: 1.9,  hpMul: 0.5, bounty: 1 },
    brute:  { icon: "🪲", name: "brute",  speed: 0.55, hpMul: 4,   bounty: 10 }
  };

  /* ---------- the doom curve (TD·3 is about exactly this line) ---------- */
  T.BASEHP = 14; T.GROWTH = 1.25; T.WAVES = 10;
  T.hpAt = function (n) { return Math.round(T.BASEHP * Math.pow(T.GROWTH, n - 1)); };

  // deterministic wave recipe: what marches in wave n, and when
  T.waveSpec = function (n) {
    var list = [], t = 0, i;
    var grunts = 5 + 2 * n;
    for (i = 0; i < grunts; i++) { list.push({ type: "grunt", at: t }); t += 0.9; }
    if (n >= 3) { t += 1.2; for (i = 0; i < n - 1; i++) { list.push({ type: "runner", at: t }); t += 0.45; } }
    if (n === 5 || n === 8) { t += 1.5; list.push({ type: "brute", at: t }); }
    if (n === 10) { t += 1.5; for (i = 0; i < 3; i++) { list.push({ type: "brute", at: t }); t += 2; } }
    return list;
  };

  /* ---------- game state ---------- */
  T.newGame = function () {
    return { money: 50, lives: 10, wave: 0, phase: "build",
             towers: [], enemies: [], queue: [], tclock: 0,
             kills: 0, leaked: 0, shots: [], over: false, won: false };
  };

  T.canPlace = function (g, c, r) {
    if (c < 0 || r < 0 || c >= T.COLS || r >= T.ROWS) return false;
    if (T.PATHCELLS[c + "," + r]) return false;
    for (var i = 0; i < g.towers.length; i++) if (g.towers[i].c === c && g.towers[i].r === r) return false;
    return true;
  };

  T.place = function (g, type, c, r) {
    var spec = T.TOWERS[type];
    if (!spec || g.money < spec.cost || !T.canPlace(g, c, r)) return false;
    g.money -= spec.cost;
    g.towers.push({ type: type, c: c, r: r, cool: 0, mode: "first", spent: spec.cost });
    return true;
  };

  T.sell = function (g, idx) {
    var t = g.towers[idx];
    if (!t) return 0;
    var back = Math.floor(t.spent * T.SELLBACK);
    g.money += back;
    g.towers.splice(idx, 1);
    return back;
  };

  T.startWave = function (g) {
    if (g.phase !== "build" || g.over) return false;
    var n = g.wave + 1;
    g.queue = T.waveSpec(n).map(function (sp) {
      var e = T.ENEMIES[sp.type];
      return { type: sp.type, at: sp.at, hp: Math.max(1, Math.round(T.hpAt(n) * e.hpMul)) };
    });
    g.phase = "wave"; g.tclock = 0;
    return true;
  };

  /* ---------- targeting: a strategy is ONE comparison, applied to everyone in range ---------- */
  T.MODES = ["first", "last", "strong", "close"];
  T.pick = function (mode, inRange) {
    if (!inRange.length) return null;
    var best = inRange[0];
    for (var i = 1; i < inRange.length; i++) {
      var e = inRange[i];
      if (mode === "first"  && e.s  > best.s)  best = e;
      else if (mode === "last"   && e.s  < best.s)  best = e;
      else if (mode === "strong" && e.hp > best.hp) best = e;
      else if (mode === "close"  && e.d2 < best.d2) best = e;
    }
    return best;
  };

  /* ---------- one tick of the world (TD·1's in-range test lives here) ---------- */
  T.step = function (g, dt) {
    if (g.over || g.phase !== "wave") return;
    g.tclock += dt;

    // spawn bugs whose time has come
    while (g.queue.length && g.queue[0].at <= g.tclock) {
      var q = g.queue.shift(), spec = T.ENEMIES[q.type];
      g.enemies.push({ type: q.type, s: 0, hp: q.hp, maxhp: q.hp,
                       speed: spec.speed, bounty: spec.bounty, slowUntil: 0, slowMult: 1 });
    }

    // march (cryo-slowed bugs walk at half speed until the chill wears off)
    for (var i = g.enemies.length - 1; i >= 0; i--) {
      var e = g.enemies[i];
      e.s += e.speed * (g.tclock < e.slowUntil ? e.slowMult : 1) * dt;
      if (e.s >= T.LENGTH) { g.enemies.splice(i, 1); g.lives--; g.leaked++; }
    }
    if (g.lives <= 0) { g.lives = 0; g.over = true; g.phase = "lost"; return; }

    // towers fire: in-range test is squared distance — no square root, ever
    g.towers.forEach(function (tw) {
      tw.cool -= dt;
      if (tw.cool > 0) return;
      var spec = T.TOWERS[tw.type], r2 = spec.range * spec.range, inR = [];
      g.enemies.forEach(function (e) {
        var p = T.posAt(e.s), dx = p[0] - (tw.c + 0.5), dy = p[1] - (tw.r + 0.5);
        var d2 = dx * dx + dy * dy;
        if (d2 <= r2) { e.d2 = d2; inR.push(e); }
      });
      var tgt = T.pick(tw.mode, inR);
      if (!tgt) return;
      tw.cool = 1 / spec.rate;
      g.shots.push({ from: [tw.c + 0.5, tw.r + 0.5], to: T.posAt(tgt.s), type: tw.type, ttl: 0.12 });
      if (spec.splash > 0) {
        var c = T.posAt(tgt.s), s2 = spec.splash * spec.splash;
        g.enemies.forEach(function (e) {
          var p = T.posAt(e.s), dx = p[0] - c[0], dy = p[1] - c[1];
          if (dx * dx + dy * dy <= s2) e.hp -= spec.dmg;
        });
      } else {
        tgt.hp -= spec.dmg;
        if (spec.slow) { tgt.slowUntil = g.tclock + spec.slowDur; tgt.slowMult = spec.slow; }
      }
    });

    // fallen bugs pay their bounty
    for (i = g.enemies.length - 1; i >= 0; i--) {
      if (g.enemies[i].hp <= 0) { g.money += g.enemies[i].bounty; g.kills++; g.enemies.splice(i, 1); }
    }

    // fade tracer lines (renderer housekeeping; harmless headless)
    for (i = g.shots.length - 1; i >= 0; i--) { g.shots[i].ttl -= dt; if (g.shots[i].ttl <= 0) g.shots.splice(i, 1); }

    // wave cleared → paycheck, back to build phase
    if (!g.queue.length && !g.enemies.length) {
      g.wave++;
      g.money += 10 + g.wave;
      g.phase = "build";
      if (g.wave >= T.WAVES) g.won = true;   // endless mode keeps going after the win
    }
  };

  /* ---------- headless helper: run a whole wave instantly (the strategy lab uses this) ---------- */
  T.runWave = function (g, dt) {
    var livesBefore = g.lives, kills0 = g.kills;
    if (!T.startWave(g)) return null;
    var guard = 0;
    while (g.phase === "wave" && guard++ < 60000) T.step(g, dt || 0.05);
    return { leaked: livesBefore - g.lives, kills: g.kills - kills0, time: Math.round(g.tclock * 10) / 10, lives: g.lives };
  };

  // how much road does a tower at (c,r) with range r cover? (used for build hints + tests)
  T.coverage = function (c, r, range) {
    var r2 = range * range, n = 0, steps = Math.round(T.LENGTH / 0.1);
    for (var i = 0; i <= steps; i++) {
      var p = T.posAt(i * 0.1), dx = p[0] - (c + 0.5), dy = p[1] - (r + 0.5);
      if (dx * dx + dy * dy <= r2) n++;
    }
    return Math.round(n * 0.1 * 10) / 10;   // cells of road in range
  };

  return T;
})();
if (typeof module !== "undefined") module.exports = TD;
