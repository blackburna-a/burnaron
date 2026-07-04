# Entry Screen and Cases Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a refresh-visible entry screen and a first-class `cases.html` selection page while preserving the current burnaron.com styling.

**Architecture:** Reuse the existing boot/preloader overlay as the entry screen, extend the existing header/page-menu markup with one `Cases` nav item, and add a standalone `cases.html` page that follows the existing `projects.html`/case-card visual language. JavaScript remains in `script.js` and CSS remains scoped to existing stylesheets.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, existing kinetic-grid canvas system, existing GitHub Pages-compatible assets and Cloudflare beacon.

---

## File Structure

- Modify `index.html`: update boot overlay markup, update page navigation to `Projects`/`Cases`, keep homepage content untouched.
- Modify `projects.html`: add entry overlay, add `booting is-preloading` classes, replace Fraud/RG header links with `Cases`.
- Create `cases.html`: new case-selection page with entry overlay, current header system, two centered case cards, footer and Cloudflare beacon.
- Modify `fraud-case.html`: add entry overlay, add `booting is-preloading` classes, replace Fraud/RG header links with `Cases`.
- Modify `rg-case.html`: add entry overlay, add `booting is-preloading` classes, replace Fraud/RG header links with `Cases`.
- Modify `script.js`: replace old timed logo preloader behavior with entry-screen dismissal/routing and refresh-aware suppression.
- Modify `css/boot.css`: convert logo preloader into entry-screen vertical feature map and button animation.
- Modify `css/base.css`: add `cases.html` page/card styles and update narrow nav widths from Fraud/RG to Cases.
- Modify `css/theme-light.css`: add only light-mode rules needed for new entry/case selectors.
- Modify `css/reduced-motion.css`: reduce new entry/card animations if not fully covered in local media queries.
- Modify `styles.css` and user-facing HTML stylesheet links: bump CSS cache key after CSS changes.
- Modify `sitemap.xml`: include `cases.html`.
- Modify `README.md`: mention `cases.html` in file structure/features only if current README already lists page structure.

## Task 1: Static Contract Tests

**Files:**
- Test with a temporary Node script executed from PowerShell; do not keep a permanent test artifact unless useful after implementation.

- [ ] **Step 1: Write and run a failing contract check before implementation**

Run this from the project root:

```powershell
$script = @'
const fs = require("fs");
const pages = ["index.html", "projects.html", "fraud-case.html", "rg-case.html"];
const mustContainEntry = [
  'id="bootScreen"',
  'entry-screen',
  'data-entry-action="profile"',
  'data-entry-action="projects"',
  'data-entry-action="cases"'
];

for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  for (const needle of mustContainEntry) {
    if (!html.includes(needle)) {
      throw new Error(`${page} missing ${needle}`);
    }
  }
  if (!html.includes('nav-utility--cases')) {
    throw new Error(`${page} missing Cases nav item`);
  }
  if (html.includes('nav-utility--fraud') || html.includes('nav-utility--rg')) {
    throw new Error(`${page} still has split case nav buttons`);
  }
}

const cases = fs.readFileSync("cases.html", "utf8");
for (const needle of [
  'class="cases-page',
  'case-choice-card',
  'case-choice-card__button',
  'href="fraud-case.html"',
  'href="rg-case.html"',
  'Cloudflare Web Analytics'
]) {
  if (!cases.includes(needle)) throw new Error(`cases.html missing ${needle}`);
}

const js = fs.readFileSync("script.js", "utf8");
for (const needle of [
  'entryDismissStorageKey',
  'data-entry-action',
  'dismissEntryScreen',
  'navigateFromEntry'
]) {
  if (!js.includes(needle)) throw new Error(`script.js missing ${needle}`);
}

console.log("entry/cases contract passed");
'@
Set-Content -LiteralPath "$env:TEMP\burnaron-entry-cases-contract.cjs" -Value $script -Encoding UTF8
& "C:\Users\black\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "$env:TEMP\burnaron-entry-cases-contract.cjs"
```

Expected before implementation: FAIL, with the first missing entry-screen or `cases.html` error.

- [ ] **Step 2: Keep the contract check for the final verification pass**

After implementation, rerun the same script. Expected after implementation:

```text
entry/cases contract passed
```

## Task 2: HTML Entry Markup and Header Navigation

**Files:**
- Modify `index.html`
- Modify `projects.html`
- Modify `fraud-case.html`
- Modify `rg-case.html`
- Create `cases.html`

- [ ] **Step 1: Replace the old index boot overlay with entry-screen markup**

Use this structure in `index.html` and reuse it on `projects.html`, `cases.html`, `fraud-case.html`, and `rg-case.html` immediately after `<body ...>`:

```html
<section class="logo-preloader boot-screen entry-screen" id="bootScreen" aria-labelledby="preloaderTitle" aria-live="polite">
  <div class="logo-preloader__grid entry-screen__grid kinetic-grid" data-kinetic-grid aria-hidden="true">
    <canvas class="kinetic-grid__canvas" data-kinetic-grid-canvas></canvas>
  </div>

  <div class="logo-preloader__inner entry-screen__inner">
    <div class="logo-preloader__mark entry-screen__logo" aria-hidden="true">
      <img src="assets/favicon-48x48.png" alt="" decoding="async" />
    </div>
    <p class="entry-screen__eyebrow">Choose your route</p>
    <h1 class="logo-preloader__title entry-screen__title" id="preloaderTitle">burnaron.com</h1>

    <nav class="entry-screen__map" aria-label="Entry navigation">
      <button class="entry-screen__button" type="button" data-entry-action="profile">
        <span class="entry-screen__button-index">01</span>
        <span>Profile</span>
      </button>
      <span class="entry-screen__connector" aria-hidden="true"></span>
      <button class="entry-screen__button" type="button" data-entry-action="projects">
        <span class="entry-screen__button-index">02</span>
        <span>Projects</span>
      </button>
      <span class="entry-screen__connector" aria-hidden="true"></span>
      <button class="entry-screen__button" type="button" data-entry-action="cases">
        <span class="entry-screen__button-index">03</span>
        <span>Cases</span>
      </button>
    </nav>
  </div>

  <button class="logo-preloader__skip boot-screen__skip entry-screen__skip" id="bootSkip" type="button">Enter site</button>
</section>
```

- [ ] **Step 2: Add boot classes to pages that did not previously use the overlay**

Change these body tags:

```html
<body class="projects-page-body booting is-preloading">
<body class="case-page-body fraud-case-page booting is-preloading">
<body class="case-page-body rg-case-page booting is-preloading">
```

For `cases.html`, use:

```html
<body class="cases-page-body booting is-preloading">
```

- [ ] **Step 3: Replace split case header links with one Cases link**

Use this page-menu shape on `index.html`:

```html
<div class="page-nav-links" id="page-menu" aria-label="Page navigation">
  <a class="button secondary nav-utility nav-utility--projects" href="projects.html">Projects</a>
  <a class="button secondary nav-utility nav-utility--cases" href="cases.html">Cases</a>
</div>
```

Use this on `projects.html`:

```html
<div class="page-nav-links" id="page-menu" aria-label="Page navigation">
  <a class="button secondary nav-utility nav-utility--projects is-current" href="projects.html" aria-current="page" aria-disabled="true" tabindex="-1">Projects</a>
  <a class="button secondary nav-utility nav-utility--cases" href="cases.html">Cases</a>
  <a class="button secondary nav-utility nav-utility--home" href="index.html">Home</a>
</div>
```

Use this on `cases.html`:

```html
<div class="page-nav-links" id="page-menu" aria-label="Page navigation">
  <a class="button secondary nav-utility nav-utility--projects" href="projects.html">Projects</a>
  <a class="button secondary nav-utility nav-utility--cases is-current" href="cases.html" aria-current="page" aria-disabled="true" tabindex="-1">Cases</a>
  <a class="button secondary nav-utility nav-utility--home" href="index.html">Home</a>
</div>
```

Use this on `fraud-case.html` and `rg-case.html`:

```html
<div class="page-nav-links" id="page-menu" aria-label="Page navigation">
  <a class="button secondary nav-utility nav-utility--projects" href="projects.html">Projects</a>
  <a class="button secondary nav-utility nav-utility--cases" href="cases.html">Cases</a>
  <a class="button secondary nav-utility nav-utility--home" href="index.html">Home</a>
</div>
```

- [ ] **Step 4: Create `cases.html` by following `projects.html` page structure**

Create a new static page with the existing head pattern, background layers, header, footer, script include, and Cloudflare beacon. The main content should use this structure:

```html
<main id="main">
  <section class="cases-page section" id="top">
    <div class="container">
      <header class="cases-page__hero">
        <p class="eyebrow">Case studies</p>
        <h1>Choose a case study.</h1>
        <p>
          Two fictional operational scenarios showing how I think through risk,
          customer protection, evidence review and clear support decisions.
        </p>
      </header>

      <div class="case-choice-grid" aria-label="Case study choices">
        <article class="case-choice-card case-choice-card--fraud">
          <div class="case-choice-card__preview case-choice-card__preview--fraud" aria-hidden="true">
            <span class="case-choice-card__window case-choice-card__window--queue"></span>
            <span class="case-choice-card__window case-choice-card__window--account"></span>
            <span class="case-choice-card__window case-choice-card__window--query"></span>
            <span class="case-choice-card__scan"></span>
          </div>
          <span class="case-choice-card__index">01</span>
          <h2>Fraud/AML Case</h2>
          <p>
            A fictional fraud operations walkthrough covering alert triage,
            account context, evidence checks, payment review and escalation judgement.
          </p>
          <a class="button primary case-choice-card__button" href="fraud-case.html" data-interface-sound>Open Fraud/AML Case</a>
        </article>

        <article class="case-choice-card case-choice-card--rg">
          <div class="case-choice-card__preview case-choice-card__preview--rg" aria-hidden="true">
            <span class="case-choice-card__message case-choice-card__message--system"></span>
            <span class="case-choice-card__message case-choice-card__message--customer"></span>
            <span class="case-choice-card__message case-choice-card__message--agent"></span>
            <span class="case-choice-card__phone">RG</span>
          </div>
          <span class="case-choice-card__index">02</span>
          <h2>Responsible Gambling Case</h2>
          <p>
            A fictional customer protection walkthrough covering behavioural signals,
            interaction tone, safer gambling intervention and support escalation.
          </p>
          <a class="button primary case-choice-card__button" href="rg-case.html" data-interface-sound>Open RG Case</a>
        </article>
      </div>
    </div>
  </section>
</main>
```

## Task 3: Entry Screen and Cases CSS

**Files:**
- Modify `css/boot.css`
- Modify `css/base.css`
- Modify `css/theme-light.css`
- Modify `css/reduced-motion.css` if needed
- Modify `styles.css` cache imports after CSS edits

- [ ] **Step 1: Add entry-map CSS to `css/boot.css`**

Implement scoped selectors:

```css
.entry-screen__inner {
  width: min(100% - 2rem, 520px);
  align-content: center;
  gap: 0.72rem;
}

.entry-screen__eyebrow {
  margin: 0;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.entry-screen__map {
  width: min(100%, 340px);
  display: grid;
  justify-items: center;
  gap: 0.34rem;
  margin-top: 0.8rem;
}

.entry-screen__button {
  width: min(100%, 280px);
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  border: 1px solid rgba(72, 217, 255, 0.3);
  border-radius: 999px;
  background:
    radial-gradient(circle at 26% 20%, rgba(72, 217, 255, 0.18), transparent 60%),
    rgba(5, 18, 28, 0.84);
  color: #effcff;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.84rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(42px);
  animation: entry-button-rise 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.entry-screen__button:nth-of-type(1) { animation-delay: 520ms; }
.entry-screen__button:nth-of-type(2) { animation-delay: 700ms; }
.entry-screen__button:nth-of-type(3) { animation-delay: 880ms; }

.entry-screen__button:hover,
.entry-screen__button:focus-visible {
  border-color: rgba(72, 217, 255, 0.64);
  background:
    radial-gradient(circle at 26% 20%, rgba(72, 217, 255, 0.26), transparent 60%),
    rgba(7, 26, 40, 0.94);
  transform: translateY(-2px);
}

.entry-screen__button-index {
  color: var(--accent);
  font-size: 0.7rem;
}

.entry-screen__connector {
  width: 1px;
  height: 18px;
  background: linear-gradient(180deg, rgba(72, 217, 255, 0.58), rgba(52, 211, 153, 0.2));
  opacity: 0;
  animation: entry-connector-fade 300ms ease forwards;
}

.entry-screen__connector:nth-of-type(2) { animation-delay: 640ms; }
.entry-screen__connector:nth-of-type(4) { animation-delay: 820ms; }

.entry-screen.is-entry-dismissing {
  pointer-events: none;
  animation: logo-preloader-exit 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes entry-button-rise {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes entry-connector-fade {
  to { opacity: 1; }
}
```

- [ ] **Step 2: Add cases page/card CSS to `css/base.css`**

Add scoped selectors near the project/case page styles:

```css
.cases-page {
  min-height: calc(100svh - var(--site-header-current-height));
  display: grid;
  align-items: center;
  padding-block: clamp(4rem, 9vw, 7rem);
}

.cases-page__hero {
  max-width: 780px;
  margin-inline: auto;
  margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
  text-align: center;
}

.cases-page__hero h1 {
  margin-bottom: 0.85rem;
}

.cases-page__hero p:not(.eyebrow) {
  max-width: 680px;
  margin-inline: auto;
  color: var(--text-muted);
  font-size: clamp(1rem, 1.9vw, 1.18rem);
  line-height: 1.7;
}

.case-choice-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 390px));
  justify-content: center;
  gap: clamp(1rem, 3vw, 1.5rem);
}

.case-choice-card {
  position: relative;
  overflow: hidden;
  display: flex;
  min-height: 430px;
  flex-direction: column;
  padding: clamp(1rem, 2.4vw, 1.35rem);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, rgba(8, 25, 36, 0.92), rgba(5, 13, 22, 0.88)),
    rgba(5, 18, 28, 0.86);
  box-shadow: var(--shadow);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.case-choice-card:hover,
.case-choice-card:focus-within {
  border-color: rgba(72, 217, 255, 0.46);
  box-shadow: 0 24px 68px rgba(72, 217, 255, 0.12);
  transform: translateY(-6px);
}

.case-choice-card__preview {
  position: relative;
  min-height: 180px;
  margin-bottom: 1.1rem;
  overflow: hidden;
  border: 1px solid rgba(72, 217, 255, 0.18);
  border-radius: 20px;
  background:
    linear-gradient(rgba(72, 217, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(72, 217, 255, 0.08) 1px, transparent 1px),
    rgba(2, 8, 16, 0.78);
  background-size: 18px 18px, 18px 18px, auto;
}

.case-choice-card__index {
  align-self: flex-start;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(72, 217, 255, 0.28);
  border-radius: 999px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.36rem 0.58rem;
}

.case-choice-card h2 {
  margin: 0 0 0.65rem;
  font-size: clamp(1.35rem, 3vw, 1.75rem);
}

.case-choice-card p {
  margin: 0 0 1.1rem;
  color: var(--text-muted);
  line-height: 1.65;
}

.case-choice-card__button {
  align-self: flex-start;
  margin-top: auto;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.case-choice-card:hover .case-choice-card__button,
.case-choice-card:focus-within .case-choice-card__button {
  opacity: 1;
  transform: translateY(0);
}

@media (hover: none) {
  .case-choice-card__button {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 820px) {
  .case-choice-grid {
    grid-template-columns: minmax(0, 420px);
  }
}
```

Also add mini-preview selectors for `.case-choice-card__window`, `.case-choice-card__message`, `.case-choice-card__phone`, and `.case-choice-card__scan`, using absolute-positioned small HUD elements and simple scan/typing animations.

- [ ] **Step 3: Update light theme only for new selectors**

Add rules in `css/theme-light.css`:

```css
.theme-light .case-choice-card {
  border-color: rgba(8, 116, 153, 0.2);
  background:
    linear-gradient(135deg, rgba(250, 254, 255, 0.92), rgba(224, 244, 251, 0.78)),
    rgba(245, 252, 255, 0.84);
  box-shadow: var(--shadow);
}

.theme-light .case-choice-card__preview {
  border-color: rgba(8, 116, 153, 0.18);
  background:
    linear-gradient(rgba(8, 116, 153, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(8, 116, 153, 0.08) 1px, transparent 1px),
    rgba(240, 251, 255, 0.78);
}
```

- [ ] **Step 4: Respect reduced motion**

Add reduced-motion overrides in `css/boot.css` or `css/reduced-motion.css`:

```css
@media (prefers-reduced-motion: reduce) {
  .entry-screen__button,
  .entry-screen__connector,
  .case-choice-card,
  .case-choice-card__button,
  .case-choice-card__scan {
    animation-duration: 0.001ms !important;
    transition: none !important;
  }

  .entry-screen__button,
  .entry-screen__connector,
  .case-choice-card__button {
    opacity: 1;
    transform: none;
  }
}
```

## Task 4: JavaScript Entry Flow

**Files:**
- Modify `script.js`

- [ ] **Step 1: Replace old session suppression variables**

At the top of `script.js`, replace the old `siteEntryStorageKey` behavior with:

```js
const entryDismissStorageKey = "burnaronEntryDismissedForNavigation";
let entryDismissedForNavigation = false;

try {
  entryDismissedForNavigation = sessionStorage.getItem(entryDismissStorageKey) === "true";
  sessionStorage.removeItem(entryDismissStorageKey);
} catch {
  entryDismissedForNavigation = false;
}
```

Remove the old immediate `sessionStorage.setItem(siteEntryStorageKey, "true")` logic so refreshes can show the entry screen again.

- [ ] **Step 2: Add entry helpers**

Use guarded helpers:

```js
function markEntryDismissedForNavigation() {
  try {
    sessionStorage.setItem(entryDismissStorageKey, "true");
  } catch {}
}

function dismissEntryScreen({ immediate = false } = {}) {
  if (!bootScreen) return;

  document.documentElement.classList.add("boot-seen", "preloader-seen");
  document.body.classList.add("is-preloader-complete");
  bootScreen.classList.add("is-entry-dismissing", "is-preloader-complete", "is-complete");

  const finishDismissal = () => {
    unlockBootScroll();
    bootScreen.remove();
    dispatchPreloaderComplete();
  };

  if (immediate || reducedMotionPreference.matches) {
    finishDismissal();
    return;
  }

  window.setTimeout(finishDismissal, 440);
}

function navigateFromEntry(action) {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (action === "profile") {
    if (currentPage === "index.html" || currentPage === "") {
      dismissEntryScreen();
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: reducedMotionPreference.matches ? "auto" : "smooth" }), 120);
      return;
    }

    markEntryDismissedForNavigation();
    dismissEntryScreen({ immediate: true });
    window.location.href = "index.html";
    return;
  }

  const targetByAction = {
    projects: "projects.html",
    cases: "cases.html"
  };

  const target = targetByAction[action];
  if (!target) return;

  if (currentPage === target) {
    dismissEntryScreen();
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: reducedMotionPreference.matches ? "auto" : "smooth" }), 120);
    return;
  }

  markEntryDismissedForNavigation();
  dismissEntryScreen({ immediate: true });
  window.location.href = target;
}
```

- [ ] **Step 3: Wire entry actions and skip**

Change the old preloader setup to:

```js
if (bootScreen && entryDismissedForNavigation) {
  bootScreen.remove();
  unlockBootScroll();
  document.documentElement.classList.add("boot-seen", "preloader-seen");
  dispatchPreloaderComplete();
} else if (bootScreen) {
  window.addEventListener("wheel", preventBootScroll, { passive: false });
  window.addEventListener("touchmove", preventBootScroll, { passive: false });
  window.addEventListener("keydown", preventBootKeyScroll);

  bootScreen.querySelectorAll("[data-entry-action]").forEach((button) => {
    button.addEventListener("click", () => {
      playInterfaceClickSound("default");
      navigateFromEntry(button.dataset.entryAction);
    });
  });

  if (bootSkip) {
    bootSkip.addEventListener("click", () => {
      playInterfaceClickSound("default");
      dismissEntryScreen({ immediate: reducedMotionPreference.matches });
    });
  }
} else {
  unlockBootScroll();
  document.documentElement.classList.add("boot-seen", "preloader-seen");
}
```

Keep `dispatchPreloaderComplete()` so progressive sections and existing animations that wait for preloader completion continue to work.

## Task 5: Cache Keys, Sitemap, and README

**Files:**
- Modify `styles.css`
- Modify `index.html`, `projects.html`, `cases.html`, `fraud-case.html`, `rg-case.html`, `404.html`, `email-handoff.html`
- Modify `sitemap.xml`
- Modify `README.md`

- [ ] **Step 1: Bump stylesheet/script cache keys**

Use a new cache key such as `20260704a` for changed CSS and JS references:

```html
<link rel="stylesheet" href="styles.css?v=20260704a" />
<link rel="stylesheet" href="css/theme-light.css?v=20260704a" />
<script src="script.js?v=20260704a"></script>
```

Update `styles.css` imports to the same CSS key.

- [ ] **Step 2: Add `cases.html` to `sitemap.xml`**

Add:

```xml
<url>
  <loc>https://burnaron.com/cases.html</loc>
</url>
```

- [ ] **Step 3: Update README if it lists features/file structure**

Add `cases.html` to the file structure and include the cases selection page as a current feature. Do not phrase this as a changelog entry.

## Task 6: Verification

**Files:**
- No additional source changes expected.

- [ ] **Step 1: Run syntax and contract checks**

Run:

```powershell
& "C:\Users\black\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" --check script.js
& "C:\Users\black\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "$env:TEMP\burnaron-entry-cases-contract.cjs"
```

Expected:

```text
entry/cases contract passed
```

`node --check` should exit with code 0 and no output.

- [ ] **Step 2: Browser QA**

Use a local static server and verify:

- Refreshing `index.html`, `projects.html`, `cases.html`, `fraud-case.html`, and `rg-case.html` shows the entry screen.
- Entry buttons animate upward and route correctly.
- Normal entry-button navigation does not show entry again on the target page.
- Browser refresh on the target page shows entry again.
- Header nav uses `Projects`, `Cases`, and `Home` where specified.
- `cases.html` cards are centered and side by side on desktop.
- `cases.html` cards stack on mobile.
- Case card buttons reveal on hover/focus on desktop.
- Case card buttons are visible on mobile/touch.
- Existing project carousel/modal, CV modal, email modal, audio controls, theme toggle, hamburger/page menu, fraud case interactions, and RG case interactions still work.
- No console errors.

---

## Self-Review Notes

- Spec coverage: entry screen, cases page, nav consolidation, hover/focus reveal, touch fallback, reduced motion, routing, and verification are covered.
- Completion-marker scan: no unfinished markers are intentionally left.
- Scope control: existing pages are preserved; only entry overlay, header case nav, new `cases.html`, scoped CSS and entry JS are changed.
