# Laocoön — Bronze and Time

A cinematic, scroll-driven landing page: the camera flies a full 360° orbit around a glowing
bronze horse as you scroll, forge sparks rise around it, and a slow liquid-bronze wave shader
shifts from molten bronze to deep sapphire.

Plain HTML, CSS and ES modules — no build step. three.js loads from unpkg through the
import map in `index.html`; the model and image load from `ASSET_BASE_URL` in `js/config.js`.

## Requirements

- Python 3 (only to serve the files — nothing to install, no build step)
- A modern browser with WebGL (Chrome, Edge, Firefox, Safari)
- An internet connection: fonts, three.js and the bronze horse model (about 3.5 MB) load from CDNs

## Run it

The page uses ES modules, which browsers refuse to load from `file://` — so
double-clicking `index.html` shows a blank page. Serve the folder instead.

1. Open a terminal in the project folder.
2. Start a static server:

   ```bash
   python -m http.server 5180
   ```

   On Windows, if `python` isn't found, use the launcher:

   ```bash
   py -m http.server 5180
   ```

3. Open http://localhost:5180 in your browser.
4. Stop the server with `Ctrl+C`.

Any free port works, and any other static server does too (`npx serve`, VS Code Live Server,
GitHub Pages).

## What to try

- **Scroll** — the page is 900vh tall. The camera orbits the statue, the background shifts from
  bronze to blue, and four slides fade in at their milestones: *Bronze and Time*,
  *Marble Emotion*, *Liquid Metal*, *Eternal Moment*.
- **Move the mouse** — the statue tilts toward the cursor; the custom double-ring cursor follows.
- **Click the nav** (Bronze · Marble · Fluid · Digital) — smooth-scrolls to that slide.
- The five-line grid on the left has a stories-style progress bar that fills slide by slide.

## Layout

```
index.html           markup: cursor, header, four slides, grid overlay, canvas
css/styles.css       reset, cursor, header, slides, grid
js/main.js           scene, lighting, pointer, animation loop
js/background.js     liquid-bronze wave shader (camera-parented plane)
js/sparks.js         450 forge-spark particles
js/model.js          bronze horse: load, material, scale, centre
js/ui.js             per-letter titles, slides + progress, grid dots, nav
js/config.js         ASSET_BASE_URL and the failed-asset banner
notes/               the original build spec
```
