const key = 'todo-please.tasks.v1';
const $ = selector => document.querySelector(selector);
let tasks = [];
let filter = 'all';
let editingId = null;
let undoTasks = null;
let toastTimer;
try {
  const saved = JSON.parse(localStorage.getItem(key) || '[]');
  if (Array.isArray(saved)) tasks = saved.filter(t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean');
} catch { $('#storage-note').textContent = 'Saving unavailable. Keep this tab open.'; }

function save() {
  try { localStorage.setItem(key, JSON.stringify(tasks)); }
  catch { $('#storage-note').textContent = 'Could not save. Keep this tab open.'; }
}

function render() {
  const done = tasks.filter(t => t.done).length;
  const active = tasks.length - done;
  const percent = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  $('#count-all').textContent = tasks.length;
  $('#count-active').textContent = active;
  $('#count-done').textContent = done;
  $('#remaining').textContent = active ? `${active} ${active === 1 ? 'thing' : 'things'} to do` : tasks.length ? 'All done. Go enjoy your day.' : '0 things to do';
  $('#percent').textContent = `${percent}% done`;
  $('.progress').setAttribute('aria-valuenow', percent);
  $('.progress i').style.width = `${percent}%`;
  $('#clear').disabled = !done;
  const shown = tasks.filter(t => filter === 'all' || (filter === 'done' ? t.done : !t.done));
  $('#list').replaceChildren();
  for (const task of shown) {
    const row = document.createElement('li');
    row.className = `task-row${task.done ? ' done' : ''}`;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark ${task.text} ${task.done ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => { task.done = checkbox.checked; save(); render(); });
    const label = document.createElement('span');
    label.className = 'task-text';
    label.textContent = task.text;
    const edit = document.createElement('button');
    edit.className = 'row-action';
    edit.textContent = 'Edit';
    edit.setAttribute('aria-label', `Edit ${task.text}`);
    edit.addEventListener('click', () => { editingId = task.id; $('#edit-text').value = task.text; $('#edit-dialog').showModal(); $('#edit-text').focus(); });
    const remove = document.createElement('button');
    remove.className = 'row-action';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${task.text}`);
    remove.addEventListener('click', () => { remember('Task removed.'); tasks = tasks.filter(t => t.id !== task.id); save(); render(); });
    row.append(checkbox, label, edit, remove);
    $('#list').append(row);
  }
  $('#empty').hidden = shown.length > 0;
  const titles = {all: 'A clean slate. Nice.', active: 'Nothing left to do.', done: 'Your small wins go here.'};
  const descriptions = {all: 'Add your first task above. Big plans start with a little list.', active: 'Take a breath. Or add your next small step.', done: 'Check off a task and give yourself a little credit.'};
  $('#empty strong').textContent = titles[filter];
  $('#empty p').textContent = descriptions[filter];
  document.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', button.dataset.filter === filter));
}

function remember(message) {
  undoTasks = tasks.map(t => ({...t}));
  clearTimeout(toastTimer);
  $('#toast span').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; undoTasks = null; }, 8000);
}

$('#add-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('#task').value.trim();
  if (!text) { $('#task').focus(); return; }
  tasks.push({id: crypto.randomUUID(), text, done: false});
  $('#task').value = '';
  if (filter === 'done') filter = 'all';
  save(); render(); $('#task').focus();
});
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => { filter = button.dataset.filter; render(); }));
$('#clear').addEventListener('click', () => { remember('Completed tasks cleared.'); tasks = tasks.filter(t => !t.done); save(); render(); });
$('#undo').addEventListener('click', () => {
  if (!undoTasks) return;
  const ids = new Set(tasks.map(t => t.id));
  tasks = [...tasks, ...undoTasks.filter(t => !ids.has(t.id))];
  undoTasks = null;
  clearTimeout(toastTimer); $('#toast').hidden = true; save(); render();
});
$('#edit-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('#edit-text').value.trim();
  if (!text) return;
  const task = tasks.find(t => t.id === editingId);
  if (task) task.text = text;
  save(); render(); $('#edit-dialog').close();
});
$('#cancel-edit').addEventListener('click', () => $('#edit-dialog').close());
window.addEventListener('storage', event => {
  if (event.key !== key) return;
  try { const updated = JSON.parse(event.newValue || '[]'); if (Array.isArray(updated)) { tasks = updated.filter(t => t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean'); render(); } } catch {}
});
$('#date').textContent = new Date().toLocaleDateString('en', {weekday: 'short', month: 'short', day: 'numeric'});
render();
