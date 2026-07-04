# Floating Theme Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the header theme toggle and entry-screen `Enter site` button with one persistent floating theme dock.

**Architecture:** Keep the existing theme storage and `applySiteTheme()` behavior in `script.js`, but move the control to shared page markup outside the header and entry overlay. Add a dock collapse state saved in `localStorage`, with desktop arrow toggle and mobile drag/tap behavior handled by small vanilla JavaScript helpers.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, current GitHub Pages-compatible site.

---

## File Structure

- Modify `index.html`, `projects.html`, `cases.html`, `fraud-case.html`, `rg-case.html`: remove header theme button, remove entry skip button, add floating theme dock after the entry screen.
- Modify `script.js`: target the new dock toggle, remove skip-button dismissal wiring, add dock collapsed/expanded state and mobile swipe handling.
- Modify `css/base.css`: add floating dock positioning, circular button styling, desktop arrow tab, mobile collapsed offset, and header spacing adjustments.
- Modify `css/theme-light.css`: add light-theme overrides for the floating dock.
- Modify `css/boot.css`: remove skip button styling that is no longer used.
- Modify `styles.css` and HTML cache keys if CSS/JS cache busting is needed.

## Task 1: Contract Test

- [ ] **Step 1: Write a temporary failing Node contract**

Create `%TEMP%\burnaron-floating-theme-dock-contract.cjs` that asserts each main page has one `.floating-theme-dock`, one `#gridThemeToggle`, no `#bootSkip`, no header `.grid-theme-toggle`, and that `script.js` contains `themeDockStorageKey`, `setThemeDockCollapsed`, and pointer handling.

- [ ] **Step 2: Run the contract before implementation**

Run the temp script and expect failure because the current pages still have the header toggle and `Enter site` button.

## Task 2: Markup

- [ ] **Step 1: Replace entry skip/header toggle markup**

On every main page, remove:

```html
<button class="logo-preloader__skip boot-screen__skip entry-screen__skip" id="bootSkip" type="button">Enter site</button>
```

Remove the header `button.grid-theme-toggle`.

Add after the entry screen:

```html
<div class="floating-theme-dock" data-theme-dock>
  <button class="grid-theme-toggle floating-theme-dock__toggle" id="gridThemeToggle" type="button" aria-pressed="false" aria-label="Toggle light theme" data-grid-theme-toggle>
    <span class="grid-theme-toggle__icon" aria-hidden="true"></span>
    <span class="sr-only">Toggle light theme</span>
  </button>
  <button class="floating-theme-dock__tab" type="button" aria-label="Hide theme toggle" aria-expanded="true" data-theme-dock-tab>
    <span aria-hidden="true"></span>
  </button>
</div>
```

## Task 3: CSS

- [ ] **Step 1: Add dock layout and collapse styling**

Add fixed bottom-right dock styles in `css/base.css`. Use safe-area-aware offsets, `z-index: var(--site-popover-z-index)`, `transform: translateX(calc(75% + var(--theme-dock-offset)))` when collapsed, and a pulsing arrow tab on desktop.

- [ ] **Step 2: Add mobile/touch styling**

On small/touch viewports, keep the dock visible at the bottom-right, make the tab compact, and keep the collapsed state leaving about 25% of the circular button visible.

- [ ] **Step 3: Remove obsolete skip button styling**

Remove `.logo-preloader__skip` and `.boot-screen__skip` rules that only styled the old `Enter site` button.

## Task 4: JavaScript

- [ ] **Step 1: Replace skip handling**

Remove `bootSkip` query and click handler.

- [ ] **Step 2: Add dock state**

Add:

```js
const themeDock = document.querySelector("[data-theme-dock]");
const themeDockTab = document.querySelector("[data-theme-dock-tab]");
const themeDockStorageKey = "burnaronThemeDockCollapsed";
```

Add helpers to read, persist, and apply collapsed state.

- [ ] **Step 3: Add interactions**

Clicking the tab toggles collapsed state. Clicking a collapsed dock expands it without toggling theme. Dragging/swiping the dock to the right on touch collapses it; tapping the exposed collapsed dock expands it.

## Task 5: Verification

- [ ] **Step 1: Run syntax and contract checks**

Run:

```powershell
C:\Users\black\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --check script.js
C:\Users\black\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe "$env:TEMP\burnaron-floating-theme-dock-contract.cjs"
```

- [ ] **Step 2: Browser smoke test**

Verify entry screen shows the floating dock, theme toggles before and after entering, desktop tab collapses/expands, and mobile-sized layout leaves the dock partially visible when collapsed.
