import {openDialog, closeDialog} from './dialogs.js?v=20261022-terminal';

let terminal, output, input, tell, origin, actions, portfolioPromise, loadedPortfolio;
let revision = 0, pendingRG = false, historyIndex = 0, draft = '', completion;
const history = []; // Current page session only. Never written to browser storage.
const focus = 'Fraud operations · Responsible gambling · Customer support';

function append(node) {
  output.append(node);
  while (output.children.length > 120) output.firstElementChild.remove();
  output.scrollTop = output.scrollHeight;
}
function line(text, className = '') {
  const p = document.createElement('p');
  p.textContent = text; p.className = className; append(p);
}
function suggestion(text, label = text) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'terminal-command';
  button.dataset.command = text; button.textContent = label;
  button.setAttribute('aria-label', `Use command ${text}`);
  return button;
}
function suggest(values) {
  const row = document.createElement('div'); row.className = 'terminal-suggestions';
  values.forEach(value => row.append(suggestion(value))); append(row);
}
function link(label, href) {
  const p = document.createElement('p'), a = document.createElement('a');
  a.textContent = label; a.href = href;
  if (href.startsWith('https:')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  p.append(a); append(p);
}
function portfolio() {
  portfolioPromise ||= fetch('/assets/portfolio-data.json?v=20261022-terminal')
    .then(response => { if (!response.ok) throw new Error('Index unavailable'); return response.json(); })
    .then(data => { loadedPortfolio = data; return data; })
    .catch(error => { portfolioPromise = null; throw error; });
  return portfolioPromise;
}
function endAssessment() {
  pendingRG = false;
  output.querySelectorAll('[data-command="1"],[data-command="2"],[data-command="3"]').forEach(el => { el.disabled = true; });
}
function showRG() {
  pendingRG = true;
  line('FICTIONAL RG ASSESSMENT\nAn anonymized illustration, with no real customer or system data.');
  line('Scenario: after a large loss, a customer deposits approximately four times their usual amount within a short period.\nSignals: deposit escalation, compressed timing and possible loss chasing. These signals warrant review; they do not establish harm by themselves.');
  line('What should be checked next?\n1. Immediately restore account access\n2. Review behavioural change and customer context\n3. Disregard the deposit pattern');
  suggest(['1','2','3']);
  line('Enter 1, 2 or 3, or use another command to leave this assessment.');
}
function answerRG(choice) {
  endAssessment();
  if (choice === '2') line('Review the change in context. Compare the previous pattern, timing, losses, limits and earlier interactions. Listen calmly to the customer and distinguish their account from your assumptions.');
  else line(choice === '1' ? 'Restoring access before reviewing the concern would skip the customer-protection assessment.' : 'Disregarding the pattern would leave a meaningful change unexplored.');
  line('Reasoning: consider the behavioural change and customer context together. Keep any justified protective measure proportionate and under review. Explain the concern without judgement, record what remains unknown and document the next step within the appropriate authority.');
  suggest(['open rg']);
}
function theme(arg) {
  const control = document.querySelector('#appearance-select');
  const modes = {dark:'night', light:'day', auto:'auto', day:'day', night:'night'};
  if (arg) {
    if (!Object.hasOwn(modes, arg)) { line('Use theme dark, theme light or theme auto.'); return; }
    control.value = modes[arg];
    control.dispatchEvent(new Event('change', {bubbles:true}));
  }
  const {appearanceMode:mode, appearance} = document.documentElement.dataset;
  line(`Theme: ${mode === 'auto' ? 'Auto (device local time)' : mode === 'day' ? 'Light / Day' : 'Dark / Night'}\nCurrent appearance: ${appearance === 'day' ? 'Light / Day' : 'Dark / Night'}\nAuto follows your local clock: Day from 07:00 to 19:00, Night otherwise.`);
  suggest(['theme light','theme dark','theme auto']);
}
async function egg(name, current) {
  const eggs = await import('./easter-eggs.js?v=20261021-controls2');
  if (!current()) return;
  closeDialog(terminal);
  if (name === 'bike') eggs.rideBike(tell); else eggs.surprise(tell);
}

// All execution goes through this registry. Input is text, never code or a URL.
const commands = {
  help: {description:'Show available commands', run() {
    line('Choose a command to put it in the input, then press Run or Enter.');
    const list = document.createElement('div'); list.className = 'terminal-help';
    for (const [name, command] of Object.entries(commands)) {
      if (command.hidden || (command.available && !command.available())) continue;
      const row = document.createElement('div'); row.className = 'terminal-help-row';
      const description = document.createElement('span'); description.textContent = command.description;
      row.append(suggestion(name), description); list.append(row);
    }
    append(list);
    line('↑ / ↓ history · Tab completes a command · Esc closes\nUse Tab on an empty input, or Shift+Tab, to move between controls.');
  }},
  about: {description:'Short portfolio summary', run() {
    line('Aron Blackburn. My background spans fraud operations, responsible gambling and customer support. I enjoy figuring out what happened, finding a practical way forward and learning how the systems behind it work.');
  }},
  whoami: {description:'Identity and professional focus', run() {
    line(`Aron Blackburn\n${focus}\nMCAST Extended Diploma in Software Development\nI like getting to the bottom of things.`);
  }},
  projects: {description:'List current projects', async run(arg, current) {
    const data = await portfolio(); if (!current()) return;
    data.projects.forEach(p => { line(`${p.name}\n${p.description}`); suggest([`open ${p.slug}`]); });
  }},
  cases: {description:'List Fraud / AML and RG cases', async run(arg, current) {
    const data = await portfolio(); if (!current()) return;
    line('Fictional portfolio demonstrations. No real customers, employer data or internal systems.');
    data.cases.forEach(c => { line(c.name); suggest([`open ${c.slug}`]); });
  }},
  open: {description:'Open a listed project or case', async run(arg, current) {
    const data = await portfolio(); if (!current()) return;
    const destinations = [...data.projects, ...data.cases];
    const destination = destinations.find(item => item.slug === arg);
    if (!destination) {
      line(arg ? `No listed project or case named “${arg}”. Choose one below.` : 'Choose a project or case:');
      suggest(destinations.map(item => `open ${item.slug}`)); return;
    }
    closeDialog(terminal); window.location.assign(destination.href);
  }},
  experience: {description:'Show concise career background', async run(arg, current) {
    const data = await portfolio(); if (!current()) return;
    data.experience.forEach(role => line(`${role.company} · ${role.role}\n${role.detail}`));
    line('Dates are as recorded in the public CV.'); suggest(['cv']);
  }},
  skills: {description:'Show professional and technical skills', run() {
    line('Fraud / Risk\nAccount and transaction review, verification documents, fraud patterns and documented escalation.');
    line('Responsible Gambling\nPlayer behaviour review, protective measures and sensitive customer communication.');
    line('Customer Support\nHealthcare and gaming support, clear notes, rapport and escalation handling.');
    line('Technical / Systems\nTroubleshooting, incident investigation, log analysis, local AI and self-hosted search. Software-development foundation: C#, Java, PHP, HTML and CSS.');
    line('Tools\nJira, Zendesk, Salesforce, Verint, Confluence, Office 365, VMware, Oracle and VirtualBox.');
  }},
  investigate: {description:'Review a fictional fraud scenario', run() {
    line('FICTIONAL FRAUD REVIEW\nAn anonymized illustration, with no real customer or system data.');
    line('1 / Account history\nThe account is new. Limited history gives little context; account age alone is not evidence of misuse.');
    line('2 / Payments\nFunding is followed by rapid withdrawal attempts. Ownership remains unresolved; timing warrants review, not a verdict.');
    line('3 / Devices and links\nA shared device signal appears on another account. Shared access is a possible explanation. Treat the link as unconfirmed until corroborated.');
    line('4 / Weigh the evidence\nConfirmed in this scenario: the funding and withdrawal sequence. Unknown: payment ownership and the meaning of the device link. Separate those facts from suspected misuse.');
    line('Result: multiple indicators merit further review, but do not establish fraud.\nNext step: verify ownership, check alternative explanations, maintain only justified and proportionate controls, and record unresolved questions for an appropriate fraud or AML review.');
    suggest(['open fraud']);
  }},
  'rg-check': {description:'Consider a fictional RG assessment', run:showRG},
  cv: {description:'Open the current CV', run() { actions.openCV(origin); }},
  contact: {description:'Show email, LinkedIn and copy options', async run(arg, current) {
    if (arg === 'email') { actions.openContact(origin); return; }
    if (arg === 'copy') { const copied = await actions.copyEmail(); if (current()) line(copied ? 'Email copied: black@burnaron.com' : 'Copy unavailable. Select the address: black@burnaron.com'); return; }
    if (arg && arg !== 'linkedin') { line('Use contact email, contact copy or contact linkedin.'); return; }
    line('Email: black@burnaron.com'); link('LinkedIn ↗', 'https://www.linkedin.com/in/aron-blackburn/');
    if (arg !== 'linkedin') { line(document.querySelector('#contact-dialog') ? 'contact email opens the existing email composer.' : 'contact email opens the existing contact section on the homepage.'); suggest(['contact email','contact copy']); }
  }},
  status: {description:'Show portfolio status', async run(arg, current) {
    const data = await portfolio(); if (!current()) return;
    line(`PORTFOLIO STATUS\nPortfolio: loaded\nPublished focus: ${focus}\nProjects available: ${data.projects.length}\nCases available: ${data.cases.length}\nPublic content only. No live service monitoring.`);
  }},
  theme: {description:'View or change theme', available:() => Boolean(window.signalAppearance && document.querySelector('#appearance-select')), run:theme},
  clear: {description:'Clear terminal output', run() { output.replaceChildren(); }},
  exit: {description:'Close terminal', run() { closeDialog(terminal); }},
  bike: {description:'A small motorcycle detail', run:(arg, current) => egg('bike', current)},
  surprise: {description:'A little visual curiosity', run:(arg, current) => egg('surprise', current)},
  why: {hidden:true, run() { line('Because understanding how something works usually makes solving it easier.'); }}
};

function distance(a, b) {
  let row = Array.from({length:b.length + 1}, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const next = [i + 1];
    for (let j = 0; j < b.length; j++) next[j + 1] = Math.min(next[j] + 1, row[j + 1] + 1, row[j] + (a[i] === b[j] ? 0 : 1));
    row = next;
  }
  return row[b.length];
}
function names() { return Object.keys(commands).filter(name => !commands[name].hidden && (!commands[name].available || commands[name].available())); }
async function execute(event) {
  event.preventDefault();
  const raw = input.value.trim().slice(0,200); input.value = '';
  if (!raw) return;
  completion = null; draft = '';
  if (history.at(-1) !== raw) history.push(raw);
  if (history.length > 50) history.shift();
  historyIndex = history.length;
  const token = ++revision, current = () => terminal.open && token === revision;
  line(`aron > ${raw}`, 'terminal-prompt');
  if (pendingRG && /^[123]$/.test(raw)) { answerRG(raw); return; }
  if (pendingRG && /^\d+$/.test(raw)) { line('Choose 1, 2 or 3, or enter another command to leave the assessment.'); return; }
  endAssessment();
  const [name, ...args] = raw.toLowerCase().split(/\s+/);
  if (!Object.hasOwn(commands, name) || (commands[name].available && !commands[name].available())) {
    const closest = names().map(value => ({value, score:distance(name,value)})).sort((a,b) => a.score - b.score)[0];
    const match = closest && closest.score <= (name.length < 5 ? 1 : 2);
    line(`Unknown command: ${raw}\n${match ? `Did you mean: ${closest.value}?` : 'Type help to see the available commands.'}`);
    if (match) suggest([closest.value]);
    return;
  }
  if (args.length && !['open','contact','theme'].includes(name)) { line(`Use ${name} without additional arguments.`); return; }
  try { await commands[name].run(args.join(' '), current); }
  catch { if (current()) line('That detail could not load. Try again, or use the portfolio links.'); }
}
function keyboard(event) {
  if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault(); completion = null;
    if (historyIndex === history.length) draft = input.value;
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    input.value = historyIndex === history.length ? draft : history[historyIndex];
    input.setSelectionRange(input.value.length, input.value.length); return;
  }
  if (event.key !== 'Tab' || event.shiftKey || !input.value.trim()) return;
  if (completion && input.value === completion.value) {
    completion.index = (completion.index + 1) % completion.matches.length;
  } else {
    const prefix = input.value.toLowerCase().trimStart();
    const values = [...names(), 'theme dark','theme light','theme auto','contact email','contact copy','contact linkedin'];
    if (loadedPortfolio) [...loadedPortfolio.projects,...loadedPortfolio.cases].forEach(item => values.push(`open ${item.slug}`));
    const matches = [...new Set(values)].filter(value => value.startsWith(prefix) && value !== prefix);
    if (!matches.length) return;
    completion = {matches, index:0};
  }
  event.preventDefault();
  completion.value = completion.matches[completion.index]; input.value = completion.value;
}
function fitViewport() {
  if (!terminal?.open) return;
  const viewport = window.visualViewport;
  terminal.style.setProperty('--terminal-viewport', `${viewport?.height || window.innerHeight}px`);
  terminal.style.setProperty('--terminal-offset', `${viewport?.offsetTop || 0}px`);
}
function build() {
  terminal = document.createElement('dialog'); terminal.id = 'terminal-dialog'; terminal.className = 'terminal-dialog'; terminal.setAttribute('aria-labelledby','terminal-title');
  const head = document.createElement('div'); head.className='dialog-heading';
  const title = document.createElement('h2'); title.id='terminal-title'; title.textContent='You found the back road.';
  const close = document.createElement('button'); close.type='button'; close.className='close-button'; close.dataset.close=''; close.setAttribute('aria-label','Close terminal'); close.textContent='×'; head.append(title,close);
  const desc = document.createElement('p'); desc.className='terminal-description'; desc.textContent='You can ask for help.';
  output = document.createElement('div'); output.id='terminal-output'; output.className='terminal-output'; output.role='log'; output.setAttribute('aria-label','Terminal responses'); output.setAttribute('aria-live','polite'); output.setAttribute('aria-relevant','additions'); output.tabIndex=0;
  const form = document.createElement('form'); form.className='terminal-form';
  const label = document.createElement('label'); label.htmlFor='terminal-input'; label.textContent='aron >';
  input = document.createElement('input'); input.id='terminal-input'; input.setAttribute('aria-label','Terminal command'); input.maxLength=200; input.autocomplete='off'; input.spellcheck=false; input.autocapitalize='off'; input.enterKeyHint='send';
  const submit = document.createElement('button'); submit.type='submit'; submit.textContent='Run';
  const hint = document.createElement('p'); hint.className='terminal-hint'; hint.id='terminal-hint'; hint.textContent='↑ ↓ History · Tab Complete · Enter Run · Esc Close'; input.setAttribute('aria-describedby',hint.id);
  form.append(label,input,submit); form.addEventListener('submit',execute);
  input.addEventListener('keydown',keyboard); input.addEventListener('input',() => { completion = null; historyIndex = history.length; });
  output.addEventListener('click', event => {
    const button = event.target.closest('[data-command]'); if (!button || button.disabled) return;
    input.value = button.dataset.command; completion = null; historyIndex = history.length; input.focus({preventScroll:true});
  });
  terminal.append(head,desc,output,form,hint); document.body.append(terminal);
  terminal.addEventListener('close', () => {
    if (terminal.open) return;
    revision++; endAssessment(); input.value='';
    window.visualViewport?.removeEventListener('resize',fitViewport);
    window.visualViewport?.removeEventListener('scroll',fitViewport);
    window.removeEventListener('resize',fitViewport);
  });
}
export function showTerminal(trigger, announce, integrations) {
  if (!terminal) build();
  origin = trigger; tell = announce; actions = integrations;
  revision++; pendingRG = false; completion = null; historyIndex = history.length; draft = ''; input.value = '';
  output.replaceChildren();
  if (!openDialog(terminal,origin,input)) { tell('Your browser cannot open this optional dialog. The portfolio links still work normally.'); return; }
  fitViewport();
  window.visualViewport?.addEventListener('resize',fitViewport);
  window.visualViewport?.addEventListener('scroll',fitViewport);
  window.addEventListener('resize',fitViewport);
}
