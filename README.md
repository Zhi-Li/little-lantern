# Little Lantern 🏮

A cozy browser maze game about a small child, a little light, and finding the way home.

Start at the **top-left** of the board and reach the warm little house at the **bottom-right**. Your lantern reveals only nearby tiles, and walls block the light. Everything outside its glow disappears again, including places you have already visited. Remember your turns.

## Play locally

**No installation or server is needed.** Open `play.html` in your browser by double-clicking it.

If you already cloned the repository, update it and launch the game on macOS:

```bash
git pull
open play.html
```

Or clone it for the first time:

```bash
git clone https://github.com/Zhi-Li/little-lantern.git
cd little-lantern
open play.html
```

On Windows or Linux, double-click `play.html` after downloading or cloning the repository. It includes the game code, styles, and artwork, works offline, and uses system fonts. You do not need Node.js, npm, Python, or internet access to play. Some browsers restrict saving progress for local files; the game remains playable if saving is blocked.

### Optional development server

With a Node.js version compatible with your operating system (20 or newer), run `npm start`, then open **http://localhost:3000**. No package dependencies need installing. Opening the source `index.html` directly as a `file:` URL will not load its JavaScript modules; use `play.html` for double-click play.

If `npm start` aborts with a macOS `dyld` error about `__libcpp_verbose_abort`, the installed Node executable requires a C++ library symbol unavailable on that macOS installation. Use `play.html` to play without Node. Reinstalling npm packages does not repair the Node executable.

## Controls

| Action | Control |
| --- | --- |
| Move one tile | Arrow keys or WASD |
| Move on a phone/tablet | Direction buttons or swipe on the maze |
| Place / pick up a pebble | B or the pebble button |
| Pause / resume | P, Escape, or the pause button |
| Sound effects | Sound toggle (off by default) |

## Eight chapters

| Chapter | Board | New challenge |
| --- | --- | --- |
| A light in the woods | 7 × 7 | Learn the lantern and remember the route |
| Something in the grass | 9 × 9 | Find a sword; avoid snakes until you have it |
| The winding woodland | 11 × 11 | More turns and snakes |
| The missing house key | 13 × 13 | Find the golden key before going home |
| Beneath the old pines | 15 × 15 | A larger forest to explore |
| A tangle of thorns | 17 × 17 | Use your sword to clear brambles |
| The very quiet forest | 19 × 19 | More hazards and longer paths |
| The long way home | 21 × 21 | The final woodland journey |

- Stepping on a **snake without a sword ends the attempt**. With a sword, stepping onto a snake defeats it automatically. The sword is reusable for the whole chapter.
- **Brambles** safely block movement until you have a sword.
- **Fireflies** are optional collectibles. You can finish without collecting them all.
- You have **five pebbles** to mark junctions. Pick them up and reuse them. They are only visible within lantern light.
- The lantern never runs out, and there is no time limit.
- Retry restarts the **same maze**, so learning the map helps. New journey resets progress and generates a fresh set of mazes.
- Unlocked chapters and the journey seed are saved in this browser's local storage. Current position, time, and inventory reset when the page reloads. The game still works when browser storage is unavailable.

## Publish on GitHub Pages

The repository includes a deployment workflow. To make the game playable at a public URL:

1. In this repository, open **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions → Publish game to GitHub Pages → Run workflow** on `main`.
4. Open the URL reported by the deployment (normally `https://zhi-li.github.io/little-lantern/`).

Publishing is manual. The separate **Game checks** workflow tests and builds every push and pull request. After changing the game, run the publishing workflow again to update the live version.

## Develop and check

```bash
npm run build  # Regenerate play.html and produce a portable static site in dist/
npm test       # Rules, 200 solvable maps, and standalone bundle integrity
```

The build output works under a subdirectory, including GitHub Pages. Upload `dist/` to any static host. No account, backend, API key, or paid service is required to play.

### Project layout

- `src/engine.js` — seeded procedural mazes, inventory, movement, light visibility, and save validation; independent of the browser.
- `src/game.js` — canvas artwork, keyboard/touch controls, menus, sound effects, and game flow.
- `index.html` / `style.css` — responsive interface, field notes, inventory, and instructions.
- `play.html` — generated, self-contained game for direct browser play; committed so players do not need a build tool.
- `tests/engine.test.js` — deterministic game-rule and procedural solvability tests.
- `scripts/` — dependency-free development server and static build.

All character, house, and item artwork is drawn with Canvas and SVG. The served `index.html` requests DM Sans and Fraunces from Google Fonts and falls back to system/Georgia fonts when offline. The standalone `play.html` uses system fonts and requests no external assets. No analytics or tracking is included. After editing the source, run `npm run build` and commit the regenerated `play.html` alongside your changes.

### Adding a chapter

Add a configuration to `LEVELS` in `src/engine.js` and matching chapter copy in `src/game.js`. Use an odd board size. The generator places a sword before danger and a house key that can be reached without crossing the locked home tile. Run the solvability tests after changing generation rules. The current chapter selector and saved-progress validation are designed for the eight included chapters; extend their bounds alongside a longer campaign.
