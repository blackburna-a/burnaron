// Render the single public PDF locally, including browsers without a PDF plugin.
import {getDocument, GlobalWorkerOptions} from '../vendor/pdfjs/pdf.min.mjs';
GlobalWorkerOptions.workerSrc = new URL('../vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
let viewer;

function createViewer(dialog) {
  const viewport = dialog.querySelector('[data-cv-document]');
  const pages = dialog.querySelector('[data-cv-pages]');
  const status = dialog.querySelector('[data-cv-status]');
  const zoomLabel = dialog.querySelector('[data-cv-scale]');
  const buttons = [...dialog.querySelectorAll('[data-cv-zoom]')];
  let documentPromise, pdf, zoom = 1, rendering = false, pending = false, task, resizeTimer;
  let width = 0;

  function controls() {
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    for (const button of buttons) {
      button.disabled = !pdf || (button.dataset.cvZoom === 'out' && zoom <= 1) || (button.dataset.cvZoom === 'in' && zoom >= 2.5);
    }
  }
  function failed() {
    status.hidden = false;
    status.textContent = 'The preview could not load. You can open the PDF or use the text version above.';
    viewport.removeAttribute('aria-busy');
  }
  async function render() {
    pending = true;
    if (rendering || !pdf || !dialog.open) return;
    rendering = true;
    try {
      while (pending && dialog.open) {
        pending = false;
        viewport.setAttribute('aria-busy', 'true');
        const content = document.createDocumentFragment();
        const available = Math.max(100, viewport.clientWidth - 24);
        for (let number = 1; number <= pdf.numPages; number++) {
          const page = await pdf.getPage(number);
          if (!dialog.open) break;
          const natural = page.getViewport({scale: 1});
          const view = page.getViewport({scale: available / natural.width * zoom});
          // Bound the bitmap cost when zooming on a high-density screen.
          const density = Math.min(devicePixelRatio || 1, 2, Math.sqrt(12000000 / (view.width * view.height)));
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(view.width * density);
          canvas.height = Math.ceil(view.height * density);
          canvas.style.width = `${view.width}px`;
          canvas.style.height = `${view.height}px`;
          canvas.setAttribute('role', 'img');
          canvas.setAttribute('aria-label', `CV document, page ${number} of ${pdf.numPages}. A text version is linked above.`);
          task = page.render({canvasContext: canvas.getContext('2d'), viewport: view, transform: [density, 0, 0, density, 0, 0]});
          await task.promise;
          task = null;
          content.append(canvas);
        }
        if (dialog.open && !pending) {
          pages.replaceChildren(content);
          viewport.dataset.rendered = 'true';
          status.hidden = true;
          viewport.removeAttribute('aria-busy');
        }
      }
    } catch (error) {
      if (error.name !== 'RenderingCancelledException') failed();
    } finally {
      rendering = false;
      if (pending && dialog.open) void render();
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    zoom = button.dataset.cvZoom === 'fit' ? 1 : Math.max(1, Math.min(2.5, zoom + (button.dataset.cvZoom === 'in' ? .25 : -.25)));
    controls(); void render();
  }));
  const observer = new ResizeObserver(() => {
    const next = viewport.clientWidth;
    if (!dialog.open || next === width) return;
    width = next;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { void render(); }, 100);
  });
  observer.observe(viewport);
  dialog.addEventListener('close', () => {
    clearTimeout(resizeTimer);
    pending = false;
    task?.cancel();
  });
  window.addEventListener('pagehide', () => { clearTimeout(resizeTimer); task?.cancel(); });
  return async () => {
    status.hidden = Boolean(pdf);
    if (!pdf) status.textContent = 'Loading document…';
    try {
      documentPromise ||= getDocument({url: '/assets/aron-blackburn-cv.pdf', isEvalSupported: false}).promise;
      pdf = await documentPromise;
      controls();
      await render();
    } catch {
      documentPromise = null;
      failed();
    }
  };
}

export function showCVDocument(dialog) {
  viewer ||= createViewer(dialog);
  return viewer();
}
