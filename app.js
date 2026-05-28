// STATO DELL'APPLICAZIONE
let state = {
    user: null,
    tasks: [],
    currentFilter: 'tutte',
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    theme: 'light'
};

// COSTANTI DI AUTENTICAZIONE
const AUTH_CONFIG = {
    username: "Marco",
    password: "Ginevra@1984"
};

// SELETTORI DOM
const dom = {
    loginScreen: document.getElementById('login-screen'),
    mainScreen: document.getElementById('main-screen'),
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    logoutBtn: document.getElementById('logout-btn'),
    themeToggle: document.getElementById('theme-toggle'),
    
    taskForm: document.getElementById('task-form'),
    taskText: document.getElementById('task-text'),
    taskTypeRadios: document.getElementsByName('task-type'),
    datetimeFields: document.getElementById('datetime-fields'),
    taskDate: document.getElementById('task-date'),
    taskTime: document.getElementById('task-time'),
    submitTaskBtn: document.getElementById('submit-task-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    editTaskId: document.getElementById('edit-task-id'),
    
    calendarMonthYear: document.getElementById('calendar-month-year'),
    calendarDays: document.getElementById('calendar-days'),
    prevMonthBtn: document.getElementById('prev-month'),
    nextMonthBtn: document.getElementById('next-month'),
    
    filterButtons: document.querySelectorAll('.filter-btn'),
    tasksContainer: document.getElementById('tasks-container')
};

// INIZIALIZZAZIONE APPLICAZIONE
document.addEventListener('DOMContentLoaded', () => {
    loadLocalData();
    initTheme();
    setupEventListeners();
    checkAuthStatus();
});

// CARICAMENTO E SALVATAGGIO LOCALE
function loadLocalData() {
    const savedTasks = localStorage.getItem('marcolist_tasks');
    const savedUser = localStorage.getItem('marcolist_user');
    const savedTheme = localStorage.getItem('marcolist_theme');

    if (savedTasks) state.tasks = JSON.parse(savedTasks);
    if (savedUser) state.user = savedUser;
    if (savedTheme) state.theme = savedTheme;
}

function saveTasksToLocalStorage() {
    localStorage.setItem('marcolist_tasks', JSON.stringify(state.tasks));
}

// GESTIONE AUTENTICAZIONE
function checkAuthStatus() {
    if (state.user === AUTH_CONFIG.username) {
        dom.loginScreen.classList.add('hidden');
        dom.mainScreen.classList.remove('hidden');
        renderDashboard();
    } else {
        dom.loginScreen.classList.remove('hidden');
        dom.mainScreen.classList.add('hidden');
    }
}

// GESTIONE TEMA
function initTheme() {
    if (!state.theme) {
        state.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', state.theme);
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('marcolist_theme', state.theme);
}

// UTILITY DATE
function getTodayDateString() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

// EVENT LISTENERS
function setupEventListeners() {
    // Login
    dom.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = dom.usernameInput.value.trim();
        const password = dom.passwordInput.value;

        if (username === AUTH_CONFIG.username && password === AUTH_CONFIG.password) {
            state.user = username;
            localStorage.setItem('marcolist_user', username);
            dom.loginError.classList.add('hidden');
            dom.usernameInput.value = '';
            dom.passwordInput.value = '';
            checkAuthStatus();
        } else {
            dom.loginError.classList.remove('hidden');
        }
    });

    // Logout
    dom.logoutBtn.addEventListener('click', () => {
        state.user = null;
        localStorage.removeItem('marcolist_user');
        checkAuthStatus();
    });

    // Toggle Tema
    dom.themeToggle.addEventListener('click', toggleTheme);

    // Cambio tipo task (Mostra/Nascondi Campi Data/Ora)
    dom.taskForm.addEventListener('change', (e) => {
        if (e.target.name === 'task-type') {
            if (e.target.value === 'pianificata') {
                dom.datetimeFields.classList.remove('hidden');
                dom.taskDate.required = true;
            } else {
                dom.datetimeFields.classList.add('hidden');
                dom.taskDate.required = false;
                dom.taskDate.value = '';
                dom.taskTime.value = '';
            }
        }
    });

    // Sottomissione Form Task (Crea o Modifica)
    dom.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = dom.editTaskId.value;
        const text = dom.taskText.value.trim();
        const type = Array.from(dom.taskTypeRadios).find(r => r.checked).value;
        const date = dom.taskDate.value;
        const time = dom.taskTime.value;

        if (id) {
            // Logica Modifica
            state.tasks = state.tasks.map(t => t.id === id ? {
                ...t, text, type, date: type === 'pianificata' ? date : '', time: type === 'pianificata' ? time : ''
            } : t);
            resetTaskForm();
        } else {
            // Logica Creazione
            const newTask = {
                id: Date.now().toString(),
                text,
                type,
                date: type === 'pianificata' ? date : '',
                time: type === 'pianificata' ? time : '',
                completed: false,
                createdAt: new Date().toISOString()
            };
            state.tasks.unshift(newTask);
        }

        saveTasksToLocalStorage();
        renderDashboard();
    });

    // Annulla Modifica
    dom.cancelEditBtn.addEventListener('click', resetTaskForm);

    // Navigazione Calendario
    dom.prevMonthBtn.addEventListener('click', () => {
        state.currentMonth--;
        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        renderCalendar();
    });

    dom.nextMonthBtn.addEventListener('click', () => {
        state.currentMonth++;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        }
        renderCalendar();
    });

    // Filtri Clic
    dom.filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            dom.filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentFilter = e.target.getAttribute('data-filter');
            renderTaskList();
        });
    });
}

// RESET FORM TASK
function resetTaskForm() {
    dom.taskForm.reset();
    dom.editTaskId.value = '';
    dom.datetimeFields.classList.add('hidden');
    dom.taskDate.required = false;
    dom.submitTaskBtn.textContent = 'Aggiungi Task';
    dom.submitTaskBtn.className = 'btn btn-success';
    dom.cancelEditBtn.classList.add('hidden');
}

// DATI RENDERING
function renderDashboard() {
    renderCalendar();
    renderTaskList();
}

// RENDER CALENDARIO
function renderCalendar() {
    dom.calendarDays.innerHTML = '';
    const mesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    dom.calendarMonthYear.textContent = `${mesi[state.currentMonth]} ${state.currentYear}`;

    const primoGiornoMese = new Date(state.currentYear, state.currentMonth, 1).getDay();
    // Conversione per far iniziare la settimana da Lunedì (0=Dom -> diventa 6, 1=Lun -> 0)
    const shiftGiorno = primoGiornoMese === 0 ? 6 : primoGiornoMese - 1;
    const giorniNelMese = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();

    // Spazi vuoti per inizio mese
    for (let i = 0; i < shiftGiorno; i++) {
        const div = document.createElement('div');
        div.classList.add('calendar-day', 'empty');
        dom.calendarDays.appendChild(div);
    }

    // Giorni reali del mese
    const odierno = getTodayDateString();
    
    for (let giorno = 1; giorno <= giorniNelMese; giorno++) {
        const div = document.createElement('div');
        div.classList.add('calendar-day');
        div.textContent = giorno;

        const meseStr = String(state.currentMonth + 1).padStart(2, '0');
        const giornoStr = String(giorno).padStart(2, '0');
        const dataCorrenteCard = `${state.currentYear}-${meseStr}-${giornoStr}`;

        if (dataCorrenteCard === odierno) {
            div.classList.add('today');
        }

        // Verifica se ci sono task in questa data
        const haTask = state.tasks.some(t => t.type === 'pianificata' && t.date === dataCorrenteCard);
        if (haTask) {
            div.classList.add('has-task');
        }

        dom.calendarDays.appendChild(div);
    }
}

// RENDER LISTA TASK
function renderTaskList() {
    dom.tasksContainer.innerHTML = '';
    const oggi = getTodayDateString();

    let tasksFiltrate = state.tasks.filter(task => {
        switch (state.currentFilter) {
            case 'oggi':
                return task.type === 'pianificata' && task.date === oggi;
            case 'da-fare':
                return !task.completed;
            case 'pianificate':
                return task.type === 'pianificata';
            case 'completate':
                return task.completed;
            case 'tutte':
                return true;
            default:
                return true;
        }
    });

    if (tasksFiltrate.length === 0) {
        dom.tasksContainer.innerHTML = `<li class="task-muted" style="text-align:center; padding:20px; list-style:none; color: var(--text-muted);">Nessuna attività trovata.</li>`;
        return;
    }

    tasksFiltrate.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''} ${task.date === oggi ? 'is-today' : ''}`;
        
        let metaHtml = '';
        if (task.type === 'pianificata' && task.date) {
            const dateObj = new Date(task.date);
            const dataFormattata = dateObj.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            metaHtml = `<span class="task-meta">📅 ${dataFormattata} ${task.time ? 'alle ' + task.time : ''}</span>`;
        }

        li.innerHTML = `
            <div class="task-left" onclick="toggleTaskCompletion('${task.id}')">
                <div class="checkbox-container"></div>
                <div class="task-info">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <span class="task-badge badge-${task.type}">${task.type.toUpperCase()}</span>
                    ${metaHtml}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-task-action" onclick="startEditTask('${task.id}')" aria-label="Modifica">✏️</button>
                <button class="btn-task-action" onclick="deleteTask('${task.id}')" aria-label="Elimina">🗑️</button>
            </div>
        `;
        dom.tasksContainer.appendChild(li);
    });
}

// FUNZIONI DI AZIONE TASK INTERNA
window.toggleTaskCompletion = function(id) {
    state.tasks = state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasksToLocalStorage();
    renderDashboard();
};

window.deleteTask = function(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasksToLocalStorage();
    renderDashboard();
    if(dom.editTaskId.value === id) {
        resetTaskForm();
    }
};

window.startEditTask = function(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    dom.editTaskId.value = task.id;
    dom.taskText.value = task.text;
    
    dom.taskTypeRadios.forEach(radio => {
        if (radio.value === task.type) {
            radio.checked = true;
        }
    });

    if (task.type === 'pianificata') {
        dom.datetimeFields.classList.remove('hidden');
        dom.taskDate.required = true;
        dom.taskDate.value = task.date;
        dom.taskTime.value = task.time;
    } else {
        dom.datetimeFields.classList.add('hidden');
        dom.taskDate.required = false;
        dom.taskDate.value = '';
        dom.taskTime.value = '';
    }

    dom.submitTaskBtn.textContent = 'Salva Modifiche';
    dom.submitTaskBtn.className = 'btn btn-primary';
    dom.cancelEditBtn.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// PREVENZIONE SCRIPT INJECTION (XSS)
function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// REGISTRAZIONE SERVICE WORKER
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registrato con successo.', reg.scope))
            .catch(err => console.error('Errore registrazione Service Worker:', err));
    });
}