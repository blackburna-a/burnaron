import {openDialog} from './dialogs.js?v=20261022-terminal';

const wired = new WeakSet();
const recipient = 'black@burnaron.com';

export function makeEmailDraft({name, email, subject, message}) {
  const singleLine = value => value.trim().replace(/[\r\n]+/g, ' ');
  const heading = singleLine(subject);
  const body = `${message.trim().replace(/\r\n?|\n/g, '\r\n')}\r\n\r\nFrom: ${singleLine(name)}\r\nEmail: ${singleLine(email)}`;
  return {
    href: `mailto:${recipient}?subject=${encodeURIComponent(heading)}&body=${encodeURIComponent(body)}`,
    text: `To: ${recipient}\r\nSubject: ${heading}\r\n\r\n${body}`
  };
}

export function showContact(dialog, trigger) {
  if (!dialog) return false;
  const form = dialog.querySelector('form');
  const fields = [...form.querySelectorAll('[required]')];
  const status = dialog.querySelector('[data-contact-status]');
  const fallback = dialog.querySelector('[data-contact-copy-fallback]');
  const handoff = dialog.querySelector('[data-contact-handoff]');
  const draft = () => makeEmailDraft(Object.fromEntries(new FormData(form)));

  if (!wired.has(dialog)) {
    wired.add(dialog);
    form.addEventListener('input', event => {
      event.target.setCustomValidity?.('');
      status.textContent = '';
      fallback.hidden = true;
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      fields.forEach(field => field.setCustomValidity(field.value.trim() ? '' : 'Please fill in this field.'));
      if (!form.reportValidity()) return;
      handoff.href = draft().href;
      status.textContent = 'Continue in your email app to review and send. If it did not open, use Copy message.';
      handoff.click();
    });
    dialog.querySelector('[data-copy-message]').addEventListener('click', async () => {
      const text = draft().text;
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = 'Message copied. Paste it into an email to black@burnaron.com.';
        fallback.hidden = true;
      } catch {
        fallback.hidden = false;
        const field = fallback.querySelector('textarea');
        field.value = text;
        status.textContent = 'Select and copy your draft below, then paste it into your email app.';
        field.focus({preventScroll: true});
        field.select();
      }
    });
  }
  // Drafts stay in this page's form only, including when it is closed and reopened.
  status.textContent = '';
  fallback.hidden = true;
  return openDialog(dialog, trigger, fields[0]);
}
