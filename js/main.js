import {initTheme} from './theme.js?v=20261021-controls2';
import {openDialog} from './dialogs.js?v=20261021-controls2';
import {initPalette} from './palette.js?v=20261021-controls2';
import {initVisualEffects} from './visual-effects.js?v=20261021-day-scene';

let toastTimer;
const status = document.querySelector('#site-status');
export function announce(message) {
  clearTimeout(toastTimer);
  status.textContent = message;
  status.classList.add('is-visible');
  toastTimer = setTimeout(() => status.classList.remove('is-visible'), 5000);
}

const cvDialog = document.querySelector('#cv-dialog');
let loadingCV;
function openCV(trigger) {
  if (!openDialog(cvDialog, trigger)) { window.location.assign('/assets/aron-blackburn-cv.pdf'); return; }
  loadingCV ||= import('./cv-viewer.js?v=20261021-controls2');
  loadingCV.then(({showCVDocument}) => showCVDocument(cvDialog)).catch(() => {
    loadingCV = null;
    const note = cvDialog.querySelector('[data-cv-status]');
    note.hidden = false;
    note.textContent = 'The preview could not load. You can open the PDF or use the text version above.';
  });
}
document.addEventListener('click', async event => {
  const cv = event.target.closest('[data-cv]');
  if (cv && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0 && typeof cvDialog.showModal === 'function') {
    event.preventDefault(); openCV(cv); return;
  }
  const copy = event.target.closest('[data-copy-email]');
  if (copy) {
    try { await navigator.clipboard.writeText('black@burnaron.com'); announce('Email copied: black@burnaron.com'); }
    catch { announce('Copy is unavailable. Select black@burnaron.com or use the email link.'); }
  }
});
document.querySelectorAll('[data-copy-email]').forEach(el => { el.hidden = false; });

let loadingTerminal;
async function openTerminal(trigger) {
  try {
    loadingTerminal ||= import('./terminal.js?v=20261021-controls2');
    const {showTerminal} = await loadingTerminal;
    showTerminal(trigger, announce);
  } catch { loadingTerminal = null; announce('The hidden detail could not load. The rest of the site is ready to explore.'); }
}
let taps = 0, lastTap = 0;
const secret = document.querySelector('[data-secret]');
secret.hidden = false;
secret.addEventListener('click', () => {
  const now = performance.now();
  taps = now - lastTap < 900 ? taps + 1 : 1; lastTap = now;
  if (taps >= 5) { taps = 0; openTerminal(secret); }
});

initTheme();
initPalette({openCV, openTerminal});
initVisualEffects();
const casePlayer = document.querySelector('[data-case-player]');
if (casePlayer) {
  import('./case-player.js?v=20261021-controls2').then(({initCasePlayer}) => initCasePlayer(casePlayer)).catch(() => {
    // Keep a complete readable case even if the optional enhancement fails.
    casePlayer.querySelectorAll('[data-scene]').forEach(scene => { scene.hidden = false; });
    casePlayer.querySelectorAll('[data-case-controls],[data-case-steps],[data-case-progress]').forEach(el => { el.hidden = true; });
    delete casePlayer.dataset.enhanced;
    const reading = document.querySelector('[data-case-reading]');
    if (reading) reading.open = true;
  });
}
window.addEventListener('pagehide', () => clearTimeout(toastTimer));
