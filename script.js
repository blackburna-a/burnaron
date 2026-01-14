// script.js
// Minimal JavaScript for:
// - Smoothly animating <details> expansion/collapse
// - Setting the footer year
// - Small accessibility helpers
//
// Uses vanilla JS only. No external dependencies.

/* Utility: animate details open/close using max-height transition.
   Approach:
   - Wrap content in .case-body (already present in markup).
   - When a details element is toggled, measure content height and animate maxHeight.
   - This avoids layout jumps and gives a smooth transition while remaining accessible.
*/

(function () {
  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Find all <details> elements we'll animate
  const animatedDetails = Array.from(document.querySelectorAll('details.case'));

  animatedDetails.forEach((detail) => {
    // Ensure .case-body exists
    const body = detail.querySelector('.case-body');
    if (!body) return;

    // Prepare initial style for transitions
    body.style.overflow = 'hidden';
    body.style.transition = 'max-height 260ms cubic-bezier(.2,.9,.2,1), opacity 180ms linear';
    body.style.maxHeight = detail.open ? body.scrollHeight + 'px' : '0px';
    body.style.opacity = detail.open ? '1' : '0';

    // When details toggle (user click or keyboard), animate
    detail.addEventListener('toggle', (ev) => {
      if (detail.open) {
        // Opening: from 0 -> scrollHeight
        body.style.display = 'block';
        // Force reflow so transition runs
        void body.offsetHeight;
        body.style.maxHeight = body.scrollHeight + 'px';
        body.style.opacity = '1';

        // After transition, remove max-height so content can grow if needed
        const onOpenEnd = () => {
          // Remove explicit max-height to allow natural height (but keep overflow hidden off)
          body.style.maxHeight = 'none';
          body.removeEventListener('transitionend', onOpenEnd);
        };
        body.addEventListener('transitionend', onOpenEnd);
      } else {
        // Closing: from current height -> 0
        // Set maxHeight to current pixel height (in case it was 'none')
        const currentHeight = body.scrollHeight;
        body.style.maxHeight = currentHeight + 'px';
        // Force reflow then collapse
        void body.offsetHeight;
        body.style.maxHeight = '0px';
        body.style.opacity = '0';
      }
    });

    // Improve keyboard interaction: when user presses Enter/Space on summary, it toggles.
    // Browsers already toggle details with keyboard, but we ensure focus styles and no double-handling.
    const summary = detail.querySelector('summary');
    if (summary) {
      summary.setAttribute('role', 'button');
      summary.setAttribute('aria-expanded', detail.open ? 'true' : 'false');

      // Update aria-expanded whenever toggled
      detail.addEventListener('toggle', () => {
        summary.setAttribute('aria-expanded', detail.open ? 'true' : 'false');
      });
    }
  });

  // Optional: close other cases when one opens (accordion-like behavior).
  // This keeps the UI focused and avoids many open sections on small screens.
  animatedDetails.forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) return;
      animatedDetails.forEach((other) => {
        if (other === detail) return;
        if (other.open) other.open = false;
      });
    });
  });

  // Accessibility: ensure summary is keyboard focusable in all browsers
  document.querySelectorAll('details summary').forEach((s) => {
    s.tabIndex = 0;
  });
})();
