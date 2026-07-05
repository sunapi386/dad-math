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

## 📓 Homework checks

`homework.html` validates each math lesson: 5 randomized questions (fresh numbers every
attempt), pass with 4+. Passing marks the lesson ✅ (persisted in localStorage), awards
stars, and passing all five unlocks the 🎓 Homework Hero badge. Index cards show ticks.

## Beyond math

- **💻 CS·1 Binary** — bit flipper, finger binary, and the six-questions mind reader
  (one bit of information per answer). → `cs01-binary.html`
- **💻 CS·2 Secret Codes** — Caesar cipher machine, brute-force code breaker, keyspace.
  → `cs02-secret-codes.html`
- **🕸️ G·1 The Seven Bridges** — playable Königsberg + envelope trace + Euler's degree
  rule. → `gt01-bridges.html`
- **📖 Story mode: The Cat in the Box** — quantum mechanics as a read-aloud story with a
  collapsing coin, a double-slit toy, and entangled gloves. → `qm01-quantum-story.html`

## 🎮 Game Lab

The games the kid already loves (Factorio, StarCraft, Deep Rock Galactic), taken apart and rebuilt
from scratch — each page derives one building block of how games actually work.

- **🎮 GL·1 Make a Game from Scratch** — the game loop (update→draw→repeat), position + velocity,
  collision, and a state machine, ending in a real playable *Cave Dodge*. → `gl01-game-loop.html`
- **🧭 GL·2 How Units Find Their Way** — pathfinding by breadth-first search: build walls and watch
  the map flood to find the shortest route (the StarCraft thread; sibling of the Seven Bridges).
  → `gl02-pathfinding.html`
- **⚙️ GL·3 Factory Logic** — production ratios and a bottleneck balancer, then real logic gates
  (AND/OR/XOR) wired into a half adder that adds two bits. → `gl03-factory.html`
- **🗺️ GL·4 Random Worlds** — procedural generation: a random-walk cave grower plus seeds and
  determinism (why a Minecraft seed rebuilds the same world). → `gl04-worlds.html`

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
- **DB:** `/var/www/jasonsun.org/dad-math-feedback.db` — kept in the *parent* webroot
  (www-data-writable, outside the git tree, off the public GitHub mirror). Stores each
  note's text, timestamp, page, IP, user-agent, and an `actioned` flag.
- **Admin:** `https://jasonsun.org/feedback/admin` — behind nginx basic-auth
  (`.htpasswd`, user `jason`). Lists every note newest-and-unactioned-first; a
  **✓ Mark actioned** button ticks each one off when the feedback has been implemented.

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
