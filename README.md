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

## 🕹️ The Arcade (gamification)

`arcade.html` has five timed games, one per big idea: **Sum Sprint**, **Pair Pop**,
**Square or Not?**, **Triangle Trouble**, and **Odd or Even?**. Correct answers and
lesson-puzzle streaks earn ⭐ stars; stars climb a rank ladder (🐣 Rookie → 👑 Little
Gauss); feats unlock badges. Progress persists in `localStorage` on the device —
no accounts, no server, nothing leaves the browser (`assets/game.js`).

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
