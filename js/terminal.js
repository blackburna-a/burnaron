import {openDialog, closeDialog} from './dialogs.js?v=20261021-controls2';
let terminal, output, input, tell, origin;

function line(text, className = '') {
  const p = document.createElement('p'); p.textContent = text; p.className = className; output.append(p);
  while (output.children.length > 60) output.firstChild.remove();
  output.scrollTop = output.scrollHeight;
}
const responses = {
  help:'Try: about, projects, experience, contact, clear, exit, bike or surprise.',
  about:'Aron Blackburn. Fraud operations, responsible gambling, customer support and a habit of asking how things work.',
  projects:'Wolt Discount Finder: a Firefox extension. SearXNG and DeepSeek: local experiments. Full notes are on the Projects page.',
  experience:'Flutter: customer service, verification and fraud operations. Abtran / HSE Live: support. bet365: responsible gambling. Momentum Group: reactivation. Dates and details are in the CV.',
  contact:'Email: black@burnaron.com\nLinkedIn: https://www.linkedin.com/in/aron-blackburn/'
};

async function command(event) {
  event.preventDefault();
  const raw = input.value.trim().slice(0,200); input.value = '';
  if (!raw) return;
  line(`aron > ${raw}`,'terminal-prompt');
  const name = raw.toLowerCase();
  if (name === 'clear') { output.replaceChildren(); return; }
  if (name === 'exit') { closeDialog(terminal); return; }
  if (name === 'bike' || name === 'surprise') {
    try {
      const eggs = await import('./easter-eggs.js?v=20261021-controls2');
      if (!terminal.open) return;
      closeDialog(terminal);
      if (name === 'bike') eggs.rideBike(tell); else eggs.surprise(tell);
    } catch { line('That detail could not load. Try another command.'); }
    return;
  }
  line(Object.hasOwn(responses, name) ? responses[name] : 'Unknown command. Type help to see the small list of things I can do.');
}

function build() {
  terminal = document.createElement('dialog'); terminal.id = 'terminal-dialog'; terminal.className = 'terminal-dialog'; terminal.setAttribute('aria-labelledby','terminal-title');
  const head = document.createElement('div'); head.className='dialog-heading';
  const title = document.createElement('h2'); title.id='terminal-title'; title.textContent='You found the back road.';
  const close = document.createElement('button'); close.type='button'; close.className='close-button'; close.dataset.close=''; close.setAttribute('aria-label','Close terminal'); close.textContent='×'; head.append(title,close);
  const desc = document.createElement('p'); desc.className='terminal-description'; desc.textContent='You can ask for help.';
  output = document.createElement('div'); output.id='terminal-output'; output.className='terminal-output'; output.role='log'; output.setAttribute('aria-label','Terminal responses'); output.setAttribute('aria-live','polite'); output.tabIndex=0;
  const form = document.createElement('form'); form.className='terminal-form';
  const label = document.createElement('label'); label.htmlFor='terminal-input'; label.textContent='aron >';
  input = document.createElement('input'); input.id='terminal-input'; input.setAttribute('aria-label','Terminal command'); input.maxLength=200; input.autocomplete='off'; input.spellcheck=false; input.autocapitalize='off';
  const submit = document.createElement('button'); submit.type='submit'; submit.textContent='Run';
  form.append(label,input,submit); form.addEventListener('submit',command);
  terminal.append(head,desc,output,form); document.body.append(terminal);
  terminal.addEventListener('close', () => { input.value=''; });
}
export function showTerminal(trigger, announce) {
  if (!terminal) build();
  origin = trigger; tell = announce;
  output.replaceChildren();
  if (!openDialog(terminal,origin,input)) tell('Your browser cannot open this optional dialog. The portfolio links still work normally.');
}
