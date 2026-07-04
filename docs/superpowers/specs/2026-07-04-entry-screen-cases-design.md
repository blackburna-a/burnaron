# Entry Screen and Cases Page Design

Date: 2026-07-04

## Goal

Replace the current passive logo-only entry experience with a short, polished entry screen that lets visitors choose between `Profile`, `Projects`, and `Cases`, while preserving the existing burnaron.com visual language.

Add a first-class `cases.html` page so the site header no longer needs separate `Fraud/AML Case` and `RG Case` buttons. The new `Cases` route presents both case studies as centered cards and lets the user choose which case to open.

## Scope

This work includes:

- Adapting the existing boot/preloader overlay into an entry screen.
- Adding three entry actions: `Profile`, `Projects`, and `Cases`.
- Adding a new `cases.html` page.
- Replacing the existing header buttons `Fraud/AML Case` and `RG Case` with one `Cases` button.
- Adding two case-choice cards on `cases.html`.
- Keeping the existing `fraud-case.html` and `rg-case.html` pages visually intact.
- Preserving current styling, layout language, theme behavior, audio controls, sticky header behavior, modals, kinetic grid behavior, Cloudflare analytics, and reduced-motion support.

This work does not include:

- Redesigning existing homepage, project, fraud case, or RG case content.
- Changing the content or interaction flow inside the existing case walkthroughs.
- Reworking the project carousel or project modal system.
- Adding a backend, build system, framework, or dependency.

## Entry Screen Design

The entry screen uses the selected vertical feature-map layout:

1. AB/favicon/logo mark.
2. `Profile` button.
3. `Projects` button.
4. `Cases` button.

The existing kinetic grid remains visible behind the entry screen. The visual styling should reuse the current boot screen's cyber/HUD treatment, theme variables, glow, panel borders, typography, and reduced-motion behavior.

The buttons animate upward from the lower portion of the screen into a stacked vertical map:

- Logo fades/scales in gently.
- `Profile`, `Projects`, and `Cases` slide upward sequentially.
- Motion is concise, controlled, and disabled or reduced under `prefers-reduced-motion`.

The old passive boot-up sequence is replaced by this interactive entry. There should not be two separate intro systems.

## Entry Screen Behavior

The entry screen appears on true load or browser refresh for the main user-facing pages:

- `index.html`
- `projects.html`
- `cases.html`
- `fraud-case.html`
- `rg-case.html`

The entry screen does not reappear during normal navigation after dismissal within the same tab/session flow.

Implementation should avoid long-term `localStorage` suppression. If a suppression flag is needed, it should use `sessionStorage` and account for reloads so a real browser refresh shows the entry screen again.

Entry actions:

- `Profile`: dismiss entry screen and navigate to `index.html` if needed. If already on `index.html`, dismiss and scroll to the top/profile hero.
- `Projects`: dismiss entry screen, set same-flow suppression, and navigate to `projects.html`.
- `Cases`: dismiss entry screen, set same-flow suppression, and navigate to `cases.html`.
- Escape may dismiss the entry overlay and leave the user on the current page as an accessibility convenience, but visible buttons remain the primary path.

## Cases Page Design

`cases.html` should feel like it belongs beside `projects.html`.

The page uses the current site background layers, sticky header, audio control, theme toggle, kinetic grid, footer, Cloudflare analytics beacon, and CSS imports.

The page body should include:

- A centered hero/intro block.
- Two centered case cards side by side on desktop.
- A stacked layout on tablet/mobile.
- A clear card for `Fraud/AML Case`.
- A clear card for `Responsible Gambling Case`.

The cards should use the current project/card visual language: dark HUD panels, subtle borders, glow, grid texture, rounded panels, mono labels, and concise copy.

Each card includes a small computer-styled animated preview:

- Fraud/AML card: a mini workstation/window animation inspired by the existing `fraud-case__desktop` interaction.
- Responsible Gambling card: a mini interaction/chat/support animation inspired by the existing `rg-case__interaction` workspace.

The previews should be lightweight and should not duplicate the full case animations. They should suggest the relevant case visually while remaining small, performant, and readable.

## Case Card Interaction

Case cards hover slightly upward, matching the existing card hover motion used elsewhere on the site.

Navigation buttons are hidden by default on hover-capable desktop devices. When the user hovers the card or focuses within it by keyboard, the relevant button fades/slides into view:

- `Open Fraud/AML Case`
- `Open RG Case`

For touch/mobile contexts, the buttons remain visible because hover is not reliable. This avoids trapping mobile users without an obvious navigation path.

Keyboard accessibility must be preserved. If the button is hidden visually by default, it must become visible on focus/focus-within and remain reachable by keyboard.

## Header Navigation Design

The header keeps its existing structure and styling.

Replace only the two separate case buttons:

- Remove `Fraud/AML Case` from the header nav.
- Remove `RG Case` from the header nav.
- Add one `Cases` button linking to `cases.html`.

Header behavior by page:

- `index.html`: `Projects`, `Cases`.
- `projects.html`: `Projects` current, `Cases`, `Home`.
- `cases.html`: `Projects`, `Cases` current, `Home`.
- `fraud-case.html`: `Projects`, `Cases`, `Home`.
- `rg-case.html`: `Projects`, `Cases`, `Home`.

On `fraud-case.html` and `rg-case.html`, the `Cases` button stays clickable so users can return to the case-selection page.

The existing mobile page menu pattern remains intact, only with the updated `Cases` item.

## JavaScript Design

The current preloader logic should be adapted instead of duplicated.

Responsibilities:

- Detect whether the entry screen should show on this page load.
- Lock scrolling only while the entry screen is active.
- Dismiss the entry screen cleanly.
- Set same-flow suppression before navigating from entry buttons.
- Preserve existing `burnaron:preloader-complete` event behavior for systems that wait for the old preloader.
- Keep audio/theme/menu/project/case modal listeners guarded and unaffected.

The existing `siteEntryStorageKey` logic needs adjustment because the current behavior permanently suppresses the boot screen within the session, including refresh. The new logic must distinguish true refresh/load behavior from normal in-site navigation.

Implementation should use guarded helpers rather than scattered conditionals.

## CSS Design

CSS should be additive and scoped.

Likely areas:

- `css/boot.css`: entry screen layout, entry map, entry button animation, dismissal animation.
- `css/base.css` or a focused existing section: cases page/card layout if no better existing file owns it.
- `css/theme-light.css`: only light-mode overrides required for new entry/case card selectors.
- `css/reduced-motion.css`: reduced-motion treatment for new entry and card animations if not covered by local media queries.

Existing page styling should not be rewritten. New selectors should be specific to the new entry screen and cases page.

## Accessibility

Requirements:

- Entry buttons are real buttons or links.
- Case navigation buttons are real links.
- Keyboard navigation reaches all entry actions and case card buttons.
- Hidden case buttons appear on `:focus-within`.
- Focus states remain visible.
- Touch/mobile users can see the case buttons without hover.
- Reduced-motion users receive minimal or no slide animation.
- Entry overlay does not trap focus after dismissal.
- Entry overlay does not block interaction once dismissed.

## Data and Routing

No backend data is needed.

Routes:

- `Profile` -> `index.html` or current index top.
- `Projects` -> `projects.html`.
- `Cases` -> `cases.html`.
- `Open Fraud/AML Case` -> `fraud-case.html`.
- `Open RG Case` -> `rg-case.html`.

## Testing and Verification

Run:

```bash
node --check script.js
```

Manual/browser verification:

- Refreshing `index.html` shows the entry screen.
- Refreshing `projects.html`, `cases.html`, `fraud-case.html`, and `rg-case.html` shows the entry screen.
- Normal navigation after entry dismissal does not show the entry screen again until a browser refresh.
- `Profile` opens/dismisses to the homepage profile/hero.
- `Projects` opens `projects.html`.
- `Cases` opens `cases.html`.
- `cases.html` displays two centered cards side by side on desktop.
- `cases.html` stacks cards cleanly on mobile.
- Case card buttons are hidden until hover/focus on desktop.
- Case card buttons remain usable on touch/mobile.
- `Open Fraud/AML Case` opens `fraud-case.html`.
- `Open RG Case` opens `rg-case.html`.
- Header nav has one `Cases` button instead of separate Fraud/RG buttons.
- Existing fraud and RG pages retain their current styling and interaction.
- Dark mode and light mode remain readable.
- Kinetic grid remains active on entry screen and main pages.
- Sticky header remains visible and usable.
- Audio controls remain functional.
- Hamburger/page menu behavior remains functional.
- Project carousel/modal remains functional.
- CV/email/copy email behavior remains functional.
- Reduced-motion behavior is acceptable.
- No console errors.

## Acceptance Criteria

- The entry screen appears on true page load/refresh.
- The entry screen does not reappear during normal in-site navigation after dismissal.
- The entry screen uses the existing cyber/HUD style and kinetic grid.
- `Profile`, `Projects`, and `Cases` buttons slide upward sequentially.
- A new `cases.html` page exists.
- Header nav uses one `Cases` button instead of separate `Fraud/AML Case` and `RG Case` buttons.
- `cases.html` presents the two case cards centered in the screen.
- Case cards include small computer-styled previews inspired by their case pages.
- Case cards hover upward.
- Case card navigation buttons reveal on hover/focus and remain usable on touch/mobile.
- Existing case pages and project page are not visually redesigned.
- `node --check script.js` passes.
