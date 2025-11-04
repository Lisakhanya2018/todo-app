// -------------------- STATE --------------------
let todosData = JSON.parse(localStorage.getItem('todos-data')) || {};
let todos = todosData.todos || [];
let isDark = todosData.isDark ?? true;
let currentFilter = 'all';
let draggedIndex = null;

// -------------------- DOM ELEMENTS --------------------
const app = document.getElementById('app');
const todoInput = document.getElementById('todoInput');
const todosContainer = document.getElementById('todosContainer');
const itemsLeftEl = document.getElementById('itemsLeft');
const themeToggle = document.getElementById('themeToggle');
const clearCompletedBtn = document.getElementById('clearCompleted');
const filterButtons = document.querySelectorAll('.filter-btn');

// -------------------- ICONS --------------------
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
</svg>`;

const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707
       m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
</svg>`;

// -------------------- LOCAL STORAGE --------------------
function saveData() {
  localStorage.setItem('todos-data', JSON.stringify({ todos, isDark }));
}

// -------------------- THEME --------------------
function applyTheme() {
  app.className = `app ${isDark ? 'dark' : 'light'}`;
  themeToggle.innerHTML = isDark ? sunIcon : moonIcon;
  saveData();
}

function toggleTheme() {
  isDark = !isDark;
  applyTheme();
}

// -------------------- TODOS --------------------
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, completed: false });
  todoInput.value = '';
  saveData();
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
  saveData();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(todo => todo.id !== id);
  saveData();
  renderTodos();
}

function clearCompleted() {
  todos = todos.filter(todo => !todo.completed);
  saveData();
  renderTodos();
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
  renderTodos();
}

// -------------------- DRAG & DROP --------------------
function handleDragStart(e, index) {
  draggedIndex = index;
  e.target.classList.add('dragging');
}

function handleDragOver(e, index) {
  e.preventDefault();
  if (draggedIndex === null || draggedIndex === index) return;
  const draggedTodo = todos[draggedIndex];
  todos.splice(draggedIndex, 1);
  todos.splice(index, 0, draggedTodo);
  draggedIndex = index;
  renderTodos();
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedIndex = null;
  saveData();
}

// --- TOUCH SUPPORT FOR MOBILE ---
let touchStartY = 0;
let currentDragIndex = null;

function handleTouchStart(e, index) {
  touchStartY = e.touches[0].clientY;
  currentDragIndex = index;
}

function handleTouchMove(e) {
  const touchY = e.touches[0].clientY;
  const elements = [...todosContainer.children];
  const target = elements.find(el => {
    const rect = el.getBoundingClientRect();
    return touchY > rect.top && touchY < rect.bottom;
  });

  if (!target) return;
  const newIndex = elements.indexOf(target);
  if (newIndex !== currentDragIndex && newIndex >= 0) {
    const draggedTodo = todos[currentDragIndex];
    todos.splice(currentDragIndex, 1);
    todos.splice(newIndex, 0, draggedTodo);
    currentDragIndex = newIndex;
    renderTodos();
  }
}

function handleTouchEnd() {
  saveData();
  currentDragIndex = null;
}

// -------------------- RENDER --------------------
function renderTodos() {
  todosContainer.innerHTML = '';

  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  if (filteredTodos.length === 0) {
    todosContainer.innerHTML = `<p class="empty-state">${
      currentFilter === 'all' ? 'No todos yet!' : `No ${currentFilter} todos`
    }</p>`;
  }

  filteredTodos.forEach((todo, index) => {
    const div = document.createElement('div');
    div.className = 'todo-item';
    div.draggable = true;
    div.dataset.id = todo.id;
    div.innerHTML = `
      <button class="checkbox ${todo.completed ? 'checked' : ''}" data-id="${todo.id}">
        <svg class="checkmark" viewBox="0 0 11 9" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 4.304L3.696 7l6-6" stroke="#FFF" stroke-width="2" fill="none"/>
        </svg>
      </button>
      <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
      <button class="delete-btn" data-id="${todo.id}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    `;

    // Event listeners (click + drag + touch)
    div.querySelector('.checkbox').addEventListener('click', () => toggleTodo(todo.id));
    div.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
    div.addEventListener('dragstart', e => handleDragStart(e, index));
    div.addEventListener('dragover', e => handleDragOver(e, index));
    div.addEventListener('dragend', handleDragEnd);
    div.addEventListener('touchstart', e => handleTouchStart(e, index));
    div.addEventListener('touchmove', handleTouchMove);
    div.addEventListener('touchend', handleTouchEnd);

    todosContainer.appendChild(div);
  });

  const left = todos.filter(todo => !todo.completed).length;
  itemsLeftEl.textContent = `${left} item${left !== 1 ? 's' : ''} left`;
}

// -------------------- EVENT LISTENERS --------------------
todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

themeToggle.addEventListener('click', toggleTheme);
clearCompletedBtn.addEventListener('click', clearCompleted);
filterButtons.forEach(btn => btn.addEventListener('click', () => setFilter(btn.dataset.filter)));

// -------------------- INITIALIZE --------------------
applyTheme();
renderTodos();
