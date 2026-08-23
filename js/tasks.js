// ========================================
// ЖИЗНЬ С КОШКОЙ
// TASKS.JS
// MVP 0.9.6
//
// Ежедневные задачи
// + индивидуальные / общие задачи
// + игровая регулярность
// ========================================

const TASKS_KEY = "dailyTasks";
const LEGACY_TASK_SHARED_SETTINGS_KEY = "taskSharedSettings";
let legacySharedMigrationDone = false;


// ========================================
// DEFAULT TASKS
// ========================================

function getDefaultTasks() {
    return [
        {
            id: "play",
            icon: "🎾",
            name: "Поиграть",
            description: "15–30 минут",
            frequency: "daily",
            statistics: "monthly",
            targetPerWeek: 7,
            targetPerMonth: 30,
            shared: false,
            done: false
        },
        {
            id: "water",
            icon: "💧",
            name: "Проверить воду",
            description: "Свежая вода",
            frequency: "daily",
            statistics: "none",
            targetPerWeek: null,
            targetPerMonth: null,
            shared: false,
            done: false
        },
        {
            id: "teeth",
            icon: "🦷",
            name: "Уход за зубами",
            description: "Регулярный уход",
            frequency: "weekly",
            statistics: "monthly",
            targetPerWeek: 2,
            targetPerMonth: 8,
            shared: false,
            done: false
        }
    ];
}


// ========================================
// STORAGE
// ========================================

function getTasksStorage() {
    const saved = localStorage.getItem(TASKS_KEY);
    if (!saved) return {};

    try {
        const data = JSON.parse(saved);
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return {};
        }
        return data;
    } catch {
        return {};
    }
}


function saveTasksStorage(data) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(data));
}


// ========================================
// LEGACY MIGRATION
// ========================================

function migrateOldTasks() {
    const saved = localStorage.getItem(TASKS_KEY);
    if (!saved) return;

    try {
        const data = JSON.parse(saved);

        if (
            data &&
            typeof data === "object" &&
            !Array.isArray(data) &&
            !data.date &&
            !Array.isArray(data.tasks)
        ) {
            return;
        }

        if (data && data.date && Array.isArray(data.tasks)) {
            const activeCatId =
                typeof getActiveCatId === "function"
                    ? getActiveCatId()
                    : null;

            if (!activeCatId) return;

            saveTasksStorage({
                [activeCatId]: {
                    date: data.date,
                    tasks: normalizeTasks(data.tasks)
                }
            });
        }
    } catch {
        // Старые повреждённые данные не должны ломать приложение.
    }
}


// Переносим старый отдельный флаг общей задачи
// в основной источник данных dailyTasks.
function migrateLegacySharedSettings() {
    if (legacySharedMigrationDone) return;

    legacySharedMigrationDone = true;

    const saved = localStorage.getItem(LEGACY_TASK_SHARED_SETTINGS_KEY);
    if (!saved) return;

    const cats =
        typeof getCats === "function"
            ? getCats()
            : [];

    if (!cats.length) {
        legacySharedMigrationDone = false;
        return;
    }

    try {
        const settings = JSON.parse(saved);

        if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
            localStorage.removeItem(LEGACY_TASK_SHARED_SETTINGS_KEY);
            return;
        }

        const storage = getTasksStorage();
        const today = getTodayKey();

        cats.forEach(cat => {
            if (!storage[cat.id]) {
                storage[cat.id] = {
                    date: today,
                    tasks: getDefaultTasks()
                };
            }

            if (storage[cat.id].date !== today) return;

            storage[cat.id].tasks = normalizeTasks(storage[cat.id].tasks);

            Object.keys(settings).forEach(taskId => {
                const task = storage[cat.id].tasks.find(item => item.id === taskId);
                if (task) {
                    task.shared = settings[taskId] === true;
                }
            });
        });

        saveTasksStorage(storage);
        localStorage.removeItem(LEGACY_TASK_SHARED_SETTINGS_KEY);

    } catch {
        legacySharedMigrationDone = false;
    }
}


// ========================================
// NORMALIZATION
// ========================================

function normalizeTasks(tasks) {
    const defaults = getDefaultTasks();
    if (!Array.isArray(tasks)) return defaults;

    const result = tasks.map(oldTask => {
        const defaultTask = defaults.find(task => task.id === oldTask.id);

        if (!defaultTask) {
            return {
                ...oldTask,
                shared: oldTask.shared === true,
                done: oldTask.done === true
            };
        }

        return {
            ...defaultTask,
            ...oldTask,
            shared: oldTask.shared === true,
            done: oldTask.done === true
        };
    });

    defaults.forEach(defaultTask => {
        if (!result.some(task => task.id === defaultTask.id)) {
            result.push({ ...defaultTask });
        }
    });

    return result;
}


// ========================================
// DAILY TASKS
// ========================================

function getDailyTasks(catId = null) {
    migrateOldTasks();
    migrateLegacySharedSettings();

    const activeCatId =
        catId ||
        (
            typeof getActiveCatId === "function"
                ? getActiveCatId()
                : null
        );

    if (!activeCatId) return [];

    const today = getTodayKey();
    const storage = getTasksStorage();
    let catData = storage[activeCatId];

    if (!catData) {
        catData = {
            date: today,
            tasks: getDefaultTasks()
        };
        storage[activeCatId] = catData;
        saveTasksStorage(storage);
        return catData.tasks;
    }

    if (catData.date !== today) {
        saveTasksToHistory(activeCatId, catData.date, catData.tasks);

        catData = {
            date: today,
            tasks: getDefaultTasks()
        };

        storage[activeCatId] = catData;
        saveTasksStorage(storage);
        return catData.tasks;
    }

    catData.tasks = normalizeTasks(catData.tasks);
    syncSharedFlagsForCat(activeCatId, storage);
    saveTasksStorage(storage);

    return storage[activeCatId].tasks;
}


function syncSharedFlagsForCat(catId, storage) {
    const target = storage[catId];
    if (!target || !Array.isArray(target.tasks)) return;

    const sharedIds = new Set();

    Object.keys(storage).forEach(id => {
        if (id === catId) return;

        const data = storage[id];
        if (
            !data ||
            data.date !== getTodayKey() ||
            !Array.isArray(data.tasks)
        ) return;

        data.tasks.forEach(task => {
            if (task.shared === true) sharedIds.add(task.id);
        });
    });

    if (!sharedIds.size) return;

    target.tasks.forEach(task => {
        if (sharedIds.has(task.id)) task.shared = true;
    });
}


function saveDailyTasks(date, tasks, catId = null) {
    const activeCatId =
        catId ||
        (
            typeof getActiveCatId === "function"
                ? getActiveCatId()
                : null
        );

    if (!activeCatId) return;

    const storage = getTasksStorage();

    storage[activeCatId] = {
        date,
        tasks: normalizeTasks(tasks)
    };

    saveTasksStorage(storage);
}


// ========================================
// HISTORY
// ========================================

function saveTasksToHistory(catId, date, tasks) {
    if (!catId || !date || !tasks) return;

    if (typeof saveDayToHistory === "function") {
        try {
            saveDayToHistory(catId, date, tasks);
        } catch {
            // История не должна ломать задачи.
        }
    }
}


function saveCurrentTasksToHistory(catId = null) {
    const activeCatId =
        catId ||
        (
            typeof getActiveCatId === "function"
                ? getActiveCatId()
                : null
        );

    if (!activeCatId) return;

    const storage = getTasksStorage();
    const catData = storage[activeCatId];
    if (!catData) return;

    saveTasksToHistory(activeCatId, catData.date, catData.tasks);
}


// ========================================
// TASK UI
// ========================================

function createTask(task) {
    return `
        <div class="task">
            <div class="task-main">
                <div class="task-icon">${task.icon}</div>

                <div class="task-text">
                    <div class="task-name">
                        ${escapeHtml(task.name)}
                        ${task.shared === true
                            ? '<span class="task-shared-badge">Общая</span>'
                            : ''}
                    </div>
                    <div class="task-time">
                        ${escapeHtml(task.description)}
                    </div>
                </div>

                <button
                    class="task-settings-button"
                    type="button"
                    onclick="openTaskSettings('${task.id}')"
                    aria-label="Настройки задачи"
                >⚙</button>

                <div
                    class="check ${task.done ? "done" : ""}"
                    onclick="toggleTask('${task.id}')"
                    role="button"
                    aria-label="Отметить выполненным"
                ></div>
            </div>
        </div>
    `;
}


// ========================================
// TASK SETTINGS MODAL
// ========================================

function openTaskSettings(taskId) {
    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;

    if (!activeCatId) return;

    const task = getDailyTasks(activeCatId).find(item => item.id === taskId);
    if (!task) return;

    closeTaskSettings();

    const modal = document.createElement("div");
    modal.id = "taskSettingsModal";
    modal.className = "task-settings-modal";
    modal.setAttribute("aria-hidden", "false");

    modal.innerHTML = `
        <div class="task-settings-overlay" onclick="closeTaskSettings()"></div>

        <div
            class="task-settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="taskSettingsTitle"
        >
            <div class="task-settings-header">
                <div class="task-settings-icon">${task.icon}</div>

                <button
                    type="button"
                    class="task-settings-close"
                    onclick="closeTaskSettings()"
                    aria-label="Закрыть"
                >×</button>
            </div>

            <h2 id="taskSettingsTitle" class="task-settings-title">
                ${escapeHtml(task.name)}
            </h2>

            <p class="task-settings-description">
                ${escapeHtml(task.description)}
            </p>

            <label class="task-setting-row">
                <span class="task-setting-text">
                    <strong>Общая для всех кошек</strong>
                    <small>
                        Одна отметка будет применяться ко всем кошкам.
                    </small>
                </span>

                <span class="task-toggle-control">
                    <input
                        class="task-shared-checkbox"
                        type="checkbox"
                        ${task.shared === true ? "checked" : ""}
                        onchange="toggleTaskShared('${task.id}', this.checked)"
                    >
                    <span class="task-toggle" aria-hidden="true"></span>
                </span>
            </label>

            <button
                type="button"
                class="task-settings-done"
                onclick="closeTaskSettings()"
            >Готово</button>
        </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
        modal.classList.add("active");
    });
}


function closeTaskSettings() {
    const modal = document.getElementById("taskSettingsModal");
    if (!modal) return;

    modal.classList.remove("active");

    setTimeout(() => {
        if (modal.parentNode) modal.remove();
    }, 200);
}


// ========================================
// SHARED TASK
// ========================================

function toggleTaskShared(taskId, requestedState) {
    const cats = typeof getCats === "function" ? getCats() : [];
    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;

    if (!cats.length || !activeCatId) return;

    const storage = getTasksStorage();
    const today = getTodayKey();

    if (!storage[activeCatId]) getDailyTasks(activeCatId);

    const activeData = storage[activeCatId];
    if (!activeData) return;

    activeData.tasks = normalizeTasks(activeData.tasks);

    const activeTask = activeData.tasks.find(task => task.id === taskId);
    if (!activeTask) return;

    const newSharedState =
        typeof requestedState === "boolean"
            ? requestedState
            : !activeTask.shared;

    cats.forEach(cat => {
        if (!storage[cat.id]) {
            storage[cat.id] = {
                date: today,
                tasks: getDefaultTasks()
            };
        }

        if (storage[cat.id].date !== today) {
            storage[cat.id] = {
                date: today,
                tasks: getDefaultTasks()
            };
        }

        storage[cat.id].tasks = normalizeTasks(storage[cat.id].tasks);
    });

    if (newSharedState) {
        const sharedDone = activeTask.done === true;

        cats.forEach(cat => {
            const task = storage[cat.id].tasks.find(item => item.id === taskId);
            if (!task) return;

            task.shared = true;
            task.done = sharedDone;
        });

    } else {
        cats.forEach(cat => {
            const task = storage[cat.id].tasks.find(item => item.id === taskId);
            if (task) task.shared = false;
        });
    }

    saveTasksStorage(storage);

    cats.forEach(cat => {
        const catData = storage[cat.id];
        if (!catData) return;

        saveTasksToHistory(cat.id, catData.date, catData.tasks);
    });

    closeTaskSettings();
    renderApp();
}


// ========================================
// TOGGLE TASK
// ========================================

function toggleTask(taskId) {
    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;

    if (!activeCatId) return;

    const storage = getTasksStorage();
    const catData = storage[activeCatId];
    if (!catData) return;

    catData.tasks = normalizeTasks(catData.tasks);

    const task = catData.tasks.find(item => item.id === taskId);
    if (!task) return;

    const newDoneState = !task.done;

    if (task.shared === true) {
        const cats = typeof getCats === "function" ? getCats() : [];

        cats.forEach(cat => {
            if (!storage[cat.id]) {
                storage[cat.id] = {
                    date: getTodayKey(),
                    tasks: getDefaultTasks()
                };
            }

            if (storage[cat.id].date !== getTodayKey()) {
                storage[cat.id] = {
                    date: getTodayKey(),
                    tasks: getDefaultTasks()
                };
            }

            storage[cat.id].tasks = normalizeTasks(storage[cat.id].tasks);

            const catTask = storage[cat.id].tasks.find(item => item.id === taskId);
            if (catTask) {
                catTask.shared = true;
                catTask.done = newDoneState;
            }
        });

    } else {
        task.done = newDoneState;
    }

    saveTasksStorage(storage);

    const cats = typeof getCats === "function" ? getCats() : [];

    if (task.shared === true) {
        cats.forEach(cat => {
            const data = storage[cat.id];
            if (data) {
                saveTasksToHistory(cat.id, data.date, data.tasks);
            }
        });
    } else {
        saveTasksToHistory(activeCatId, catData.date, catData.tasks);
    }

    renderApp();
}


// ========================================
// DELETE CAT TASKS
// ========================================

function deleteCatTasks(catId) {
    if (!catId) return;

    const storage = getTasksStorage();

    if (Object.prototype.hasOwnProperty.call(storage, catId)) {
        delete storage[catId];
    }

    saveTasksStorage(storage);
}


// ========================================
// DATE
// ========================================

function getTodayKey() {
    return formatDateKey(new Date());
}


function formatDateKey(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
}
