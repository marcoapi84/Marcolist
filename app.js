// STATO DELL'APPLICAZIONE
let state = {
    isLoggedIn: false,
    tasks: [],
    currentFilter: 'tutte',
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
    
    calendarWeekLabel: document.getElementById('calendar-week-label'),
    calendarWeekDays: document.getElementById('calendar-week-days'),
    
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
    const savedAuth = localStorage.getItem('marcolist_logged_in');
    const savedTheme = localStorage.getItem('marcolist_theme');

    if (savedTasks) state.tasks = JSON.parse(savedTasks);
    if (savedAuth === 'true') state.isLoggedIn = true;
    if (savedTheme) state.theme = savedTheme;
}

function saveTasksToLocalStorage() {
    localStorage.setItem('marcolist_tasks', JSON.stringify(state.tasks));
}

// GESTIONE AUTENTICAZIONE
function checkAuthStatus() {
    if (state.isLoggedIn) {
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
    // Form Login
    dom.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = dom.usernameInput.value.trim();
        const password = dom.passwordInput.value;

        if (username === AUTH_CONFIG.username && password === AUTH_CONFIG.password) {
            state.isLoggedIn = true;
            localStorage.setItem('marcolist_logged_in', 'true');
            dom.loginError.classList.add('hidden');
            dom.usernameInput.value = '';
            dom.passwordInput.value = '';
            checkAuthStatus();
        } else {
            dom.loginError.classList.remove('hidden');
        }
    });

    // Tasto Logout
    dom.logoutBtn.addEventListener('click', () => {
        state.isLoggedIn = false;
        localStorage.setItem('marcolist_logged_in', 'false');
        checkAuthStatus();
    });

    // Interruttore Tema
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

    // Inserimento o Modifica Task
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
            // Logica Nuova Creazione
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

    // Annulla Modifica attiva
    dom.cancelEditBtn.addEventListener('click', resetTaskForm);

    // Filtri di Scrematura Rapida
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

// LOGICA RENDERING PANNELLO
function renderDashboard() {
    renderCompactCalendar();
    renderTaskList();
}

// RENDER CALENDARIO COMPATTO (Timeline Settimanale Meno Invasiva)
function renderCompactCalendar() {
    dom.calendarWeekDays.innerHTML = '';
    
    const giorniSettimana = ["Do", "Lu", "Ma", "Me", "Gi", "Ve", "Sa"];
    const mesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    
    const oggi = new Date();
    dom.calendarWeekLabel.textContent = `${mesi[oggi.getMonth()]} ${oggi.getFullYear()}`;

    // Calcoliamo l'inizio della settimana corrente (Lunedì)
    const giornoCorrente = oggi.getDay();
    const distanzaDalLunedi = giornoCorrente === 0 ? -6 : 1 - giornoCorrente;
    const lunediCorrente = new Date(oggi);
    lunediCorrente.setDate(oggi.getDate() + distanzaDalLunedi);

    const stringaOggi = getTodayDateString();

    // Generiamo i 7 giorni della settimana
    for (let i = 0; i < 7; i++) {
        const dataGiorno = new Date(lunediCorrente);
        dataGiorno.setDate(lunediCorrente.getDate() + i);

        const dNome = giorniSettimana[dataGiorno.getDay()];
        const dNumero = dataGiorno.getDate();
        
        const mStr = String(dataGiorno.getMonth() + 1).padStart(2, '0');
        const gStr = String(dNumero).padStart(2, '0');
        const stringaDataCard = `${dataGiorno.getFullYear()}-${mStr}-${gStr}`;

        const card = document.createElement('div');
        card.className = 'week-day-card';
        
        if (stringaDataCard === stringaOggi) {
            card.classList.add('today');
        }

        // Pallino se ci sono task pianificate in questo specifico giorno della settimana
        const haTaskPianificate = state.tasks.some(t => t.type === 'pianificata' && t.date === stringaDataCard);
        if (haTaskPianificate) {
            card.classList.add('has-task');
        }

        card.innerHTML = `
            <span class="day-name">${dNome}</span>
            <span class="day-num">${dNumero}</span>
        `;
        dom.calendarWeekDays.appendChild(card);
    }
}

// RENDER LISTA TASK CON FILTRI DI SCREMATURA
function renderTaskList() {
    dom.tasksContainer.innerHTML = '';
    const oggi = getTodayDateString();

    // Applica il filtro solo se richiesto, altrimenti mostra "tutte" di base
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
            default:
                return true; // Mostra tutto l'elenco indistintamente
        }
    });

    if (tasksFiltrate.length === 0) {
        dom.tasksContainer.innerHTML = `<li style="text-align:center; padding:24px; list-style:none; color: var(--text-muted); font-size:0.95rem;">Nessuna attività in questo filtro.</li>`;
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

// AZIONI DELLE TASK ESTERNE (WINDOW BINDING)
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
            .then(reg => console.log('Service Worker V1.1 registrato con successo.'))
            .catch(err => console.error('Errore SW:', err));
    });
}// AGGIUNGI IN FONDO A app.js

// Richiede il permesso per le notifiche all'avvio
if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
}

// Invia la lista delle task aggiornata al Service Worker ogni volta che cambia lo stato
function syncTasksWithServiceWorker() {
    if ('navigator' in window && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'SYNC_TASKS',
            tasks: state.tasks
        });
    }
}

// Modifica la tua funzione esistente saveTasksToLocalStorage() includendo il sync:
const vecchioSaveTasks = saveTasksToLocalStorage;
saveTasksToLocalStorage = function() {
    vecchioSaveTasks();
    syncTasksWithServiceWorker();
};

// Quando il Service Worker si connette, gli inviamo subito le task
navigator.serviceWorker.ready.then(() => {
    setTimeout(syncTasksWithServiceWorker, 1000);
});