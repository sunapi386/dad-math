# Advanced Math Explained in Half an Hour

Short, hands-on math workshops for curious kids — a father–son series done at the
kitchen table. Each lesson starts from a simple question and *derives* a big idea in
about thirty minutes, with formulas rendered like LaTeX and interactive widgets you
can play with in the browser.

**Live:** https://jasonsun.org/dad-math

## Lessons

- **01 — The Gauss Formula.** Add 1…100 in one line. Summation notation, the pairing
  trick, a living multiplication table, and a "sum sprint" puzzle. → `01-gauss.html`
- **02 — Odd Numbers Make Squares.** Why 1+3+5+7… always lands on a perfect square,
  built dot-by-dot with a gnomon (L-shape) builder. → `02-squares.html`
- **03 — Triangular Numbers.** Bowling pins, the two-triangles-make-a-rectangle picture
  proof, and the handshake problem. → `03-triangles.html`
- **04 — Evens & the Parity Trick.** Odd or even without adding; sum of evens = n(n+1);
  finally proves Lesson 1's "why is it always whole" challenge. → `04-evens.html`
- **05 — Fibonacci & the Golden Ratio.** The rabbit puzzle, ratio convergence to φ, and a
  spiral builder with tangent-continuous quarter arcs. → `05-fib.html`

## 📓 Homework checks & parent assignments

`homework.html` validates each math lesson: 5 randomized questions (fresh numbers every
attempt), pass with 4+. Passing marks the lesson ✅ (persisted in localStorage), awards
stars, and passing all five unlocks the 🎓 Homework Hero badge. Index cards show ticks.

**Assign → verify → game time.** A grown-up can assign specific homework (the 5 math
lessons + the GL·6 Deep Rock check) behind a 4-digit **Parent PIN** (🔒 Parents button).
An assignment counts as *done* only if it was **passed after it was assigned** — so old
credit doesn't count and the kid has to do today's work — and each completion shows a
timestamp. The chore chart (PIN + assignments + pass-times) is stored at a **fixed device
key** in `game.js` (not the per-account namespace) so it survives the kid logging in/out
to sync badges; it's designed for one kid per device. Note: the timestamps are
client-side, so this is a trust-and-verify aid for a present parent, not tamper-proof.

## Beyond math

- **💻 CS·1 Binary** — bit flipper, finger binary, and the six-questions mind reader
  (one bit of information per answer). → `cs01-binary.html`
- **💻 CS·2 Secret Codes** — Caesar cipher machine, brute-force code breaker, keyspace.
  → `cs02-secret-codes.html`
- **💻 CS·3 How Logins Keep Secrets** — hashing as a one-way street (live SHA-256 blender +
  avalanche), why it's the opposite of a cipher, salt, and why a drawn pattern is guessable.
  The behind-the-scenes lesson for the account system below. → `cs03-logins.html`
- **💻 CS·4 How to Sort a Messy Bookshelf** — algorithms: derive bubble sort live, discover its
  worst case is the handshake formula `n(n−1)/2`, then split-sort-merge (divide and conquer,
  `n·log₂n`, ~25,000× faster on a million items) and binary search as the payoff. Three
  replayable games: **Sort Sprint** (sort in the fewest swaps — par = inversion count — with a
  persistent level ladder and the 📚 Shelf Master badge), **Merge Master** (be the merge step,
  combo scoring), and **The Mind Reader's Revenge** (find its number in ≤10 guesses, then it
  finds yours — always). → `cs04-sorting.html`
- **💻 CS·5 Qubits: How Quantum Computers Count** (quantum series, part 1) — the qubit as an
  arrow on a circle: superposition as lean, **probability = amplitude²** (Lesson 2's squares;
  Pythagoras keeps P(0)+P(1)=100%), measurement collapse with live tallies, X/H gates, and the
  showstopper: **H,H un-flips the coin** (interference — with the X,H "same chances, different
  arrow" mystery). Games: **Circuit Par** (steer onto targets in the fewest gates — par computed
  by BFS, up to 6; 🌀 Qubit Wrangler badge for 3 pars in a row) and **Spy Qubit** (identify a
  mystery lean from up to 15 one-bit measurements — statistics, the way real quantum computers
  are read out). Ends honestly: what 2ⁿ superposition does and doesn't mean. → `cs05-qubits.html`
- **💻 CS·6 Entanglement: The Spooky Phone** (quantum series, part 2) — two qubits, one fate:
  twin dials whose answers match with probability **cos²(twist)** (real Φ+ photon statistics),
  Einstein's glove-factory objection as an **answer-sheet counting argument**, and a kid-runnable
  **Bell test**: sheets can't beat disagreement(0°,60°) ≤ d(0°,30°) + d(30°,60°), the universe
  scores 75% > 25% + 25%. Games: **Spooky or Gloves?** (inspect a crate by statistics — the fake
  sits exactly ON the Bell limit; 📞 badge for 3 in a row) and a **no-signaling** widget showing
  why the spooky phone can't text (your marginal stays 50/50 whatever the far dial does).
  → `cs06-entanglement.html`
- **💻 CS·7 Circuits: The Adding Machine** — truth tables as gate ID cards (n wires → 2ⁿ rows),
  NAND/NOR and universality (the Apollo computer was ~5,600 NOR chips), a **mystery-box detective
  game** (probe an unlabelled gate, watch the suspects fall — 🔌 badge for 3 unmaskings in a row),
  the **full adder** (sum = odd number of ones, carry = majority) with a live-highlighting 8-row
  table, and an operable **4-bit ripple-carry adder** with star challenges (show 21, light all four
  carries, ride the 15+1 domino ripple). → `cs07-circuits.html`
- **🕸️ G·1 The Seven Bridges** — playable Königsberg + envelope trace + Euler's degree
  rule. → `gt01-bridges.html`
- **🕸️ G·2 Six Handshakes to Anyone** — small-world networks: reach grows like **kᵈ**
  (44⁶ ≈ 7.3 billion), why clumping almost kills it (a 48-person ring world has average distance
  6.38), and the Watts–Strogatz fix: a few random shortcuts collapse distances for everyone.
  **World Shrinker** game (place 5 bridges to get average distance ≤ 3.9 — tuned so random
  placement usually fails; 🌍 badge) with a **meme/disease spread animation** on the same graph
  (same wires, same speed — the 2020 lesson). Milgram 1967 and Facebook's 3.57 as evidence.
  → `gt02-handshakes.html`
- **🕸️ G·3 The Map-Colouring War** — the four-colour theorem: maps → graphs, why 4 is necessary
  (K₄) and 5 mutual touchers are impossible, Kempe's 11-year false proof, and **Appel–Haken 1976**
  (1,936 configurations, 1,200 computer-hours — the first machine-proved theorem and the fight
  over whether it counts). Plus a provable consolation: greedy colouring needs ≤ d+1. **Map
  painter** game: random grid-grown maps, par = true chromatic number by backtracking (χ ∈ {3,4});
  3 pars in a row = 🎨 badge. → `gt03-map-coloring.html`
- **🎲 GT·1 How to Win Every Game (Sometimes)** — game theory: beat a perfect bot at the
  21-stick game via **backward induction** (cold numbers = multiples of 4; badge for winning),
  then a **pattern-sniffing rock-paper-scissors bot** (a Markov counter on your habits) that
  teaches why the only unbeatable plan in a mixing game is a **mixed strategy** — true
  randomness. → `gm01-winning-games.html`
- **🎲 GT·3 Rock, Paper, Scissors… SCV!** — a kid-invented game, balanced with real math.
  Dominance graphs; a two-line **impossibility proof** that no deterministic 4-move RPS can be
  fair (parity: 6 arrows ÷ 4 moves = 1.5 — and each old move's score becomes ±1); the coin-flip
  patch and its **uniqueness** (every SCV matchup must be 50/50) plus the "quit button" design
  trap it creates; then the odd-number **circle construction** — Rock→SCV→Scissors→Paper→Zergling,
  each beating the next two, which preserves *every* rule the kid proposed with zero coin flips.
  Two playable arenas vs the GT·1 pattern sniffer (4-move and 5-move; badge for beating it at
  the 5-move game). → `gm03-rps-scv.html`
- **🎲 GT·2 The Prisoner's Dilemma** — the most famous game in game theory: why cheating is a
  **dominant strategy** yet everyone-cheats is the worst outcome (Nash equilibrium), the escape
  hatch of **repeated games** (play 15 rounds vs a tit-for-tat bot; get rich *together* for a
  badge), a guess-the-personality detective game, and an Axelrod-style tournament + **evolution
  simulator** where the cheaters boom, starve, and go extinct. → `gm02-prisoners-dilemma.html`
- **📖 Story mode: The Cat in the Box** — quantum mechanics as a read-aloud story with a
  collapsing coin, a double-slit toy, and entangled gloves. → `qm01-quantum-story.html`
- **📖 Story mode: The Pirate Split** — game theory as a story: 5 pirates, 100 coins, and
  **backward induction** built chapter by chapter (2 pirates → 3 → 4 → 5) with an honest **vote
  machine** in every chapter — propose any split and watch perfectly greedy, logical, bloodthirsty
  pirates vote with reasons. The 98·0·1·0·1 answer, verified; ends with the ultimatum-game twist
  (real humans pay to punish greed). Finish = 🏴‍☠️ badge. → `st01-pirates.html`
- **📖 Story mode: Twenty Questions vs. the Universe** — information theory as a story: a
  million-number mind reader (binary search, always ≤ 20 questions since 2²⁰ = 1,048,576), the
  halving meter, and **monster detective school** — 16 monsters = all 4-bit feature combos, so
  every feature question splits any remaining set exactly in half and a perfect game is exactly 4
  questions (splits shown on every button; gambling is called out). Shannon, the bit, and why
  compression = asking better questions. Finish = ❓ badge. → `st02-twenty-questions.html`

## ✏️ Sketch Lab

How a machine draws like an artist — a four-lesson series built around
[Krbn](https://github.com/vpalos/krbn) (Valeriu Paloș, MIT), a real open-source engine for
pencil-style SVG rendering, which is **vendored and embedded live** in the final page
(`assets/krbn.js`, ~100 KB, built from source with esbuild).

- **📐 SK·1 Flattening Space** — the picture plane, size = f·S ÷ d (divide by distance!),
  similar triangles, perspective vs orthographic, a spinnable wireframe cube whose near/far edges
  you can measure. Badge: Flatlander. → `sk01-flatten.html`
- **🌒 SK·2 Where Outlines Live** — a silhouette is where the gaze *grazes*: tangent rays,
  t = √(d²−r²) (Pythagorean-triple drills), and the counterintuitive rim: it's NOT the equator —
  it sits r²/d in front of the centre and you see (1−r/d)/2 of a ball, never half. Why the engine
  solves outlines as exact conics/quartics (plotter food, not pixels). Badge: Rim Finder.
  → `sk02-silhouettes.html`
- **🩻 SK·3 The Art of Leaving Out** — hidden-line removal as interval arithmetic: eye-rays,
  bites that merge, pieces that survive (k separated blockers → k+1 pieces), drop vs ghost
  (x-ray) modes. Piece-counting game with overlapping/end-swallowing cases. Badge: X-Ray Eyes.
  → `sk03-hidden-lines.html`
- **✏️ SK·4 Shading with Lines** — tone = width ÷ spacing (gray is a fraction), cross-hatch
  layers stack, strokes follow the surface's grain, and the *genesis imperfecta* idea: wobble
  added on purpose, from **seeded noise** (same seed → same wiggle, no boiling — ties back to the
  Minecraft seeds lesson). Tone-mixer game. Badge: Tone Master. → `sk04-hatching.html`
- **🖋️ SK·5 The Sketch Studio** — the engine itself, live: five preset scenes (snowman, sphere &
  pipe, donut/torus, trefoil knot, gravity well), knobs for wobble / hatch mode / grain
  (curved vs flat) / hidden-line style / camera orbit, live stroke counts, and **download as
  SVG**. Render all five = Studio Artist badge + the homework check. → `sk05-studio.html`

## 🏰 Tower Lab

A full tower defense game, plus a four-lesson series that pries the game open and shows the
arithmetic running underneath. Everything is built on a single shared, DOM-free engine
(`assets/td.js`) — pure functions and state, node-testable in isolation, that also power TD·4's
headless strategy races. The game itself, `td00-core-keep.html`, is a real playable defense: three
turret types with real DPS economics, ten waves growing at +25% HP each, four targeting modes, sell
at 75% refund, and a fixed-timestep deterministic simulation (same seed, same run, every time).

- **🏰 TD·0 Core Keep** — the game. Hold the crystal core through all ten waves with zero luck
  involved. Badge: Keep Holder. Also self-checks the homework bank (`td0`) the moment you win.
  → `td00-core-keep.html`
- **📡 TD·1 The Range Ring** — how a turret knows a bug is in range, thirty times a second:
  Pythagoras, and the classic trick of comparing squared distance to squared radius so the game
  never takes a square root. Touches the Gauss circle problem along the way. Badge: Ring Ranger.
  → `td01-range.html`
- **⚔️ TD·2 The Damage Budget** — DPS, ⌈HP ÷ damage⌉ shots to kill, why kill time counts the *gaps*
  between shots, overkill waste, the escape window 2√(r²−b²), and value-per-coin — the arithmetic
  behind every shop screen ever made. Badge: Damage Accountant. → `td02-dps.html`
- **📈 TD·3 The Doom Curve** — bug HP follows hp = 14 × 1.25^(wave−1) while your income only adds;
  an exponential crosses any straight line eventually, and the rule of 72 predicts exactly which
  wave breaks any fixed defense. Badge: Doom Prophet. → `td03-waves.html`
- **🎯 TD·4 Who to Shoot?** — First, Last, Strongest, Closest: each targeting mode is a one-line
  comparison or argmax. Race all four head-to-head on the real game engine, headless, and watch
  the "obvious" answer lose to measurement. Ends in a snapshot quiz. Badge: Target Master.
  → `td04-targeting.html`

Tower Lab adds homework banks `td1`–`td4` (checked the normal way) plus `td0`, a self-passing
Core Keep check that marks itself off the moment you hold all ten waves in the game.

## 🎮 Game Lab

The games the kid already loves (Factorio, StarCraft, Deep Rock Galactic), taken apart and rebuilt
from scratch — each page derives one building block of how games actually work.

- **🌳 The Builder's Tree** — the Game Lab as a **game-development course shaped like a tech tree**
  (`gamedev.html`). Six nodes (loop → hitboxes → arcs; loop → pathfinding → random worlds; both
  branches → the sentry), each gated by a **3-question principles test** (all correct to pass, fresh
  randomized questions per attempt, one wrong ends the attempt). Passing a node **installs that
  mechanic into a real game on the page** — *Crystal Caves*, which grows from a bare movable miner
  into a cave shooter with weak-point hitboxes, parabolic grenades, BFS-hunting bugs, seeded
  procedural levels, and an AND-gate sentry turret. Unlocks are stored as homework flags
  (`gd1`–`gd6`), so they cloud-sync with accounts and are parent-assignable; finishing the whole
  tree awards the 🌳 Master Builder badge.

- **🎮 GL·1 Make a Game from Scratch** — the game loop (update→draw→repeat), position + velocity,
  collision, and a state machine, ending in a real playable *Cave Dodge*. → `gl01-game-loop.html`
- **🧭 GL·2 How Units Find Their Way** — pathfinding by breadth-first search: build walls and watch
  the map flood to find the shortest route (the StarCraft thread; sibling of the Seven Bridges).
  → `gl02-pathfinding.html`
- **⚙️ GL·3 Factory Logic** — production ratios and a bottleneck balancer, then real logic gates
  (AND/OR/XOR) wired into a half adder that adds two bits. → `gl03-factory.html`
- **🗺️ GL·4 Random Worlds** — procedural generation: a random-walk cave grower plus seeds and
  determinism (why a Minecraft seed rebuilds the same world). → `gl04-worlds.html`
- **🐦 GL·5 Why the Angry Bird Flies in an Arc** — projectile motion: an aim-and-launch slingshot
  (exact closed-form parabola), the two independent motions, and why 45° maximizes range while
  30°/60° tie. → `gl05-projectiles.html`
- **🐛 GL·6 Aiming & Hitboxes (Deep Rock)** — hit detection: circular hitboxes + the
  point-in-circle test, hitscan-ray vs. arcing-projectile guns, and glowing weak-points. Its
  homework check is a **skill challenge** (land 5 weak-point hits) so it can't be luck-passed.
  → `gl06-hitboxes.html`
- **🧱 GL·7 Minecraft Worlds** — beyond GL·4's caves: smooth terrain from **noise** (dice at
  anchors + linear interpolation with cosine easing), infinite worlds sliced into **chunks**
  rebuilt on demand from `f(seed, chunk)` (walk away and back — pixel-identical, nothing stored),
  and **biomes** from a second temperature noise salted off the same seed. Includes a walkable
  infinite-world explorer. → `gl07-minecraft-worlds.html`

## 🕹️ The Arcade (gamification)

`arcade.html` has five timed games, one per big idea: **Sum Sprint**, **Pair Pop**,
**Square or Not?**, **Triangle Trouble**, and **Odd or Even?**. Correct answers and
lesson-puzzle streaks earn ⭐ stars; stars climb a rank ladder (🐣 Rookie → 👑 Little
Gauss); feats unlock badges. Progress persists in `localStorage` on the device —
no accounts, no server, nothing leaves the browser (`assets/game.js`).

## 💬 Feedback box

Every page has a little **💬 Feedback** tab on the left edge. It opens a slide-in
drawer where a visitor can type — or, since these are kids who don't type fast,
press a big **🎤 mic** button and just talk (Web Speech API voice-to-text; the mic
hides itself on browsers that don't support it, e.g. Firefox). Submissions POST to
`/feedback/submit` and land in a SQLite DB.

- **Frontend:** `assets/feedback.js` (self-contained; injects its own styles, reuses
  the site's theme tokens so light/dark just works). Loaded on every page.
- **Backend:** `server/feedback.py` — a single stdlib file (mirrors the analytics
  `track.py` house style), run by systemd as `dad-math-feedback.service` on
  `127.0.0.1:9110`. Caps body/text size, HTML-escapes untrusted text, and throttles
  repeat posts per-IP.
- **DB:** `/var/www/jasonsun.org/dad-math-data/feedback.db` — its own www-data-owned
  directory in the *parent* webroot (so SQLite can write the db + journal, it's outside
  the git tree, and off the public GitHub mirror). Stores each note's text, timestamp,
  page, IP, user-agent, and an `actioned` flag. Path is set by the service's
  `FEEDBACK_DB` env var (see `dad-math-feedback.service`).
- **Admin:** `https://jasonsun.org/feedback/admin` — behind nginx basic-auth
  (`.htpasswd`, user `jason`). Lists every note newest-and-unactioned-first; a
  **✓ Mark actioned** button ticks each one off when the feedback has been implemented.

## 🔑 Save progress (optional accounts)

Stars and badges live in `localStorage` (below), so by default they're stuck on one
device. An **optional** login syncs them to the cloud so they follow a kid across
phone/tablet/laptop. It's opt-in — every game works logged out; signing in only ever
*merges* (max stars, union of badges — no device can wipe another).

- **Login = a drawn pattern.** Kids pick a nickname and draw a shape on a 3×3 grid
  (like a phone unlock), so no fast typing needed. `assets/account.js` (self-contained
  UI + sync glue; injects its own styles, reuses theme tokens). Loaded on every page.
- **Deliberately low-stakes by design.** A drawn pattern is low-entropy (guessable), so
  the security comes from *data minimization*: an account stores **only a self-chosen
  handle + the game counters** (stars/badges/best scores/homework flags). No real name,
  email, age, or free text — a breach is just "DragonKid has 12 stars".
- **Backend:** `server/accounts.py` — a single stdlib file (same house style as
  `feedback.py`/`track.py`), run by systemd as `dad-math-accounts.service` on
  `127.0.0.1:9120`. Secrets are **pbkdf2-hashed with a per-user salt** (never stored in
  plain text); wrong-secret and unknown-handle return byte-identical errors (no
  enumeration); repeated wrong tries briefly lock the handle; bodies and progress blobs
  are size-capped and shape-sanitized.
- **DB:** `/var/www/jasonsun.org/dad-math-data/accounts.db` (same www-data-owned dir as
  the feedback DB; off the public GitHub mirror). Path set by the service's `ACCOUNTS_DB`
  env var (see `dad-math-accounts.service`).
- **How it works** is itself a lesson: **`cs03-logins.html`** teaches the hashing/salt
  behind it (and honestly warns kids never to reuse a real password on a toy login).

## 📈 Analytics

Every page loads a lightweight [Umami](https://umami.is) tracking snippet (in
`<head>`) pointing at the self-hosted instance at **https://analytics.jasonsun.org**.
Umami is cookieless and privacy-friendly (no personal data, no cross-site tracking —
appropriate for a kids' site) and records pageviews, sessions, referrers,
device/browser/OS/country, and **visit duration** (time on page). dad-math is its own
website entry in the dashboard (`data-website-id`), separate from the other sites on
that instance. `data-domains="jasonsun.org,www.jasonsun.org"` keeps the public GitHub
Pages mirror and localhost from polluting the stats.

## Structure

```
index.html          landing / series hub
01-gauss.html       lesson 1 (self-contained page + inline widget JS)
02-squares.html     lesson 2
03-triangles.html   lesson 3
04-evens.html       lesson 4
arcade.html         the games + rank + badge wall
assets/style.css    shared design system (light + dark, theme toggle)
assets/site.js      theme toggle + KaTeX auto-render bootstrap
assets/game.js      stars / badges / ranks engine (localStorage)
```

Formulas render with [KaTeX](https://katex.org/) loaded from the jsDelivr CDN.
Everything else is plain HTML/CSS/vanilla JS — no build step, no framework.

## Running locally

It's a static site; just serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to jasonsun.org/dad-math (nginx)

`jasonsun.org` is a self-hosted nginx box. Copy this repo to the web root under a
`dad-math/` directory (or symlink it) and it works — all internal links are
relative. For example:

```nginx
location /dad-math/ {
    alias /var/www/dad-math/;   # trailing slashes matter
    index index.html;
}
```

Then `git pull` in `/var/www/dad-math` to update. (KaTeX comes from the CDN, so the
box needs outbound HTTPS, or vendor KaTeX locally if you prefer no external calls.)

## License

CC BY 4.0 — remix it for your own kitchen table.
