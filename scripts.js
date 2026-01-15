// script.js
// Minimal JavaScript for:
// - Splash intro timing and animation (burnaron.com stays visible >= 1.5s, then slower transition to "igniting ideas")
// - Smoothly animating <details> expansion/collapse
// - Setting the footer year
// - Small accessibility helpers
//
// Uses vanilla JS only. No external dependencies.

(function () {
  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // SPLASH: ensure burnaron.com is visible for at least 1.5s,
  // then reveal "igniting ideas" with a slightly slower fade, then hide splash.
  const splash = document.getElementById('splash');
  if (splash) {
    // Timing constants (ms)
    const VISIBLE_MIN = 1500;       // Minimum time splash main text is visible
    const IGNITE_FADE_DURATION = 1000; // CSS fade duration used for subtext
    const AFTER_IGNITE = 900;       // How long to wait after showing subtext before hiding splash

    // Start: ensure splash is present (already), wait VISIBLE_MIN then ignite
    setTimeout(() => {
      // Add class to fade in subtext (CSS handles a slower transition)
      splash.classList.add('ignited');

      // Wait a bit after ignite so the effect is noticeable, then hide
      setTimeout(() => {
        splash.classList.add('hide');

        // Remove element after hide transition completes
        // We allow a small extra buffer beyond the CSS transition
        setTimeout(() => {
          if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
        }, 700);
      }, AFTER_IGNITE);
    }, VISIBLE_MIN);
  }

  // DETAILS animation: animate details open/close using max-height transition.
  const animatedDetails = Array.from(document.querySelectorAll('details.case'));

  animatedDetails.forEach((detail) => {
    const body = detail.querySelector('.case-body');
    if (!body) return;

    // Prepare transitions
    body.style.overflow = 'hidden';
    body.style.transition = 'max-height 320ms cubic-bezier(.2,.9,.2,1), opacity 240ms linear';
    body.style.maxHeight = detail.open ? body.scrollHeight + 'px' : '0px';
    body.style.opacity = detail.open ? '1' : '0';

    detail.addEventListener('toggle', () => {
      if (detail.open) {
        body.style.display = 'block';
        // Force reflow
        void body.offsetHeight;
        body.style.maxHeight = body.scrollHeight + 'px';
        body.style.opacity = '1';
        const onOpenEnd = () => {
          body.style.maxHeight = 'none';
          body.removeEventListener('transitionend', onOpenEnd);
        };
        body.addEventListener('transitionend', onOpenEnd);
      } else {
        // Closing
        const currentHeight = body.scrollHeight;
        body.style.maxHeight = currentHeight + 'px';
        void body.offsetHeight;
        body.style.maxHeight = '0px';
        body.style.opacity = '0';
      }
    });

    // Accessibility: ensure summary shows state
    const summary = detail.querySelector('summary');
    if (summary) {
      summary.setAttribute('role', 'button');
      summary.setAttribute('aria-expanded', detail.open ? 'true' : 'false');
      detail.addEventListener('toggle', () => {
        summary.setAttribute('aria-expanded', detail.open ? 'true' : 'false');
      });
    }
  });

  // Accordion behavior: close others when one opens
  animatedDetails.forEach((detail) => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) return;
      animatedDetails.forEach((other) => {
        if (other === detail) return;
        if (other.open) other.open = false;
      });
    });
  });

  // Ensure summary elements are keyboard focusable in all browsers
  document.querySelectorAll('details summary').forEach((s) => { s.tabIndex = 0; });

})();
