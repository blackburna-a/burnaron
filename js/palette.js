import {openDialog, closeDialog, hasOpenDialog} from './dialogs.js?v=20261022-terminal';

export function initPalette({openCV, openTerminal}) {
  const dialog = document.querySelector('#palette-dialog');
  const input = document.querySelector('#command-search');
  const list = document.querySelector('#command-results');
  const empty = document.querySelector('#command-empty');
  const trigger = document.querySelector('[data-open-palette]');
  if (typeof dialog.showModal !== 'function') return;
  let origin = trigger, selected = 0, filtered = [];
  const commands = [
    {name:'Home', keywords:'home aron portfolio', detail:'Page', href:'/index.html'},
    {name:'Selected work', keywords:'work selected', detail:'Section', href:'/index.html#work'},
    {name:'Projects', keywords:'projects wolt searxng deepseek', detail:'Page', href:'/projects.html'},
    {name:'Experience', keywords:'experience career jobs', detail:'Section', href:'/index.html#experience'},
    {name:'About', keywords:'about interests', detail:'Section', href:'/index.html#about'},
    {name:'Case studies', keywords:'cases fraud responsible gambling', detail:'Page', href:'/cases.html'},
    {name:'View CV', keywords:'cv resume curriculum', detail:'Document', run:() => openCV(origin)},
    {name:'Email Aron', keywords:'email contact mail', detail:'Email app', href:'mailto:black@burnaron.com'},
    {name:'LinkedIn', keywords:'linkedin social profile', detail:'External', href:'https://www.linkedin.com/in/aron-blackburn/'},
    {name:'Change atmosphere', keywords:'appearance theme day night auto atmosphere', detail:'Setting', run:() => { document.querySelector('#appearance-select').scrollIntoView({block:'nearest'}); document.querySelector('#appearance-select').focus({preventScroll:true}); }},
    {name:'A little curiosity', keywords:'terminal secret easter egg curiosity bike', detail:'Hidden detail', run:() => openTerminal(origin)}
  ];
  function select(index) {
    selected = filtered.length ? (index + filtered.length) % filtered.length : 0;
    [...list.children].forEach((el,i) => el.setAttribute('aria-selected', String(i === selected)));
    const item = list.children[selected];
    if (item) { input.setAttribute('aria-activedescendant',item.id); item.scrollIntoView({block:'nearest'}); }
    else input.removeAttribute('aria-activedescendant');
  }
  function filter() {
    const query = input.value.trim().toLowerCase();
    filtered = commands.filter(c => `${c.name} ${c.keywords}`.toLowerCase().includes(query));
    list.replaceChildren();
    filtered.forEach((command,i) => {
      const item = document.createElement('li'); item.id = `command-${i}`; item.role = 'option'; item.dataset.index = String(i);
      item.append(document.createTextNode(command.name));
      const detail = document.createElement('span'); detail.textContent = command.detail; item.append(detail); list.append(item);
    });
    empty.hidden = filtered.length > 0;
    select(0);
  }
  function activate(index) {
    const command = filtered[index];
    if (!command) return;
    closeDialog(dialog);
    if (command.run) command.run(); else window.location.assign(command.href);
  }
  function open(from = document.activeElement) {
    origin = from;
    input.value = '';
    openDialog(dialog, from, input);
    filter();
  }
  trigger.hidden = false;
  trigger.addEventListener('click', () => open(trigger));
  input.addEventListener('input', filter);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); select(selected + (e.key === 'ArrowDown' ? 1 : -1)); }
    else if (e.key === 'Enter') { e.preventDefault(); activate(selected); }
  });
  list.addEventListener('click', e => { const item=e.target.closest('[data-index]'); if (item) activate(Number(item.dataset.index)); });
  document.addEventListener('keydown', e => {
    if (e.isComposing || e.repeat || e.altKey) return;
    const shortcut = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k';
    const target = e.target;
    const editing = target.closest('input,textarea,select,button,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="combobox"],[role="slider"]');
    const slash = e.key === '/' && !e.ctrlKey && !e.metaKey && !editing;
    if (!shortcut && !slash) return;
    if (hasOpenDialog() && !dialog.open) return;
    e.preventDefault();
    if (dialog.open) { if (shortcut) closeDialog(dialog); } else open();
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform)) document.querySelector('[data-shortcut]').textContent = '⌘ K';
}
