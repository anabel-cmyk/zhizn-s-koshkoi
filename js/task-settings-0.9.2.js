// ========================================
// ЖИЗНЬ С КОШКОЙ — TASK SETTINGS 0.9.2
// ========================================

const TASK_SHARED_SETTINGS_KEY = "taskSharedSettings";

function getTaskSharedSettings() {
    try {
        const saved = localStorage.getItem(TASK_SHARED_SETTINGS_KEY);
        const data = saved ? JSON.parse(saved) : {};
        return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch {
        return {};
    }
}

function saveTaskSharedSettings(settings) {
    localStorage.setItem(TASK_SHARED_SETTINGS_KEY, JSON.stringify(settings));
}

function migrateSharedFlagsToSettings() {
    const settings = getTaskSharedSettings();
    const cats = typeof getCats === "function" ? getCats() : [];
    let changed = false;

    cats.forEach(cat => {
        const tasks = typeof getDailyTasks === "function" ? getDailyTasks(cat.id) : [];
        tasks.forEach(task => {
            if (task.shared === true && settings[task.id] !== true) {
                settings[task.id] = true;
                changed = true;
            }
        });
    });

    if (changed) saveTaskSharedSettings(settings);
}

function isTaskShared(taskId) {
    return getTaskSharedSettings()[taskId] === true;
}

function setTaskSharedState(taskId, shared) {
    const settings = getTaskSharedSettings();
    settings[taskId] = shared === true;
    saveTaskSharedSettings(settings);
}

function createTask(task) {
    const shared = isTaskShared(task.id);

    return `
        <div class="task">
            <div class="task-main">
                <div class="task-icon">${task.icon}</div>

                <div class="task-text">
                    <div class="task-name">
                        ${escapeHtml(task.name)}
                        ${shared ? '<span class="task-shared-badge">Общая</span>' : ''}
                    </div>
                    <div class="task-time">${escapeHtml(task.description)}</div>
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

function openTaskSettings(taskId) {
    const activeCatId = getActiveCatId();
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
        <div class="task-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="taskSettingsTitle">
            <div class="task-settings-header">
                <div class="task-settings-icon">${task.icon}</div>
                <button type="button" class="task-settings-close" onclick="closeTaskSettings()" aria-label="Закрыть">×</button>
            </div>

            <h2 id="taskSettingsTitle">${escapeHtml(task.name)}</h2>
            <p class="task-settings-description">${escapeHtml(task.description)}</p>

            <label class="task-setting-row">
                <span class="task-setting-text">
                    <strong>Общая</strong>
                    <small>Одна отметка будет применяться ко всем кошкам.</small>
                </span>

                <span class="task-toggle-control">
                    <input
                        class="task-shared-checkbox"
                        type="checkbox"
                        ${isTaskShared(taskId) ? "checked" : ""}
                        onchange="toggleTaskShared('${taskId}', this.checked)"
                    >
                    <span class="task-toggle" aria-hidden="true"></span>
                </span>
            </label>

            <button type="button" class="task-settings-done" onclick="closeTaskSettings()">Готово</button>
        </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("active"));
}

function closeTaskSettings() {
    const modal = document.getElementById("taskSettingsModal");
    if (!modal) return;
    modal.classList.remove("active");
    setTimeout(() => modal.remove(), 180);
}

function toggleTaskShared(taskId, requestedState) {
    const cats = getCats();
    const activeCatId = getActiveCatId();
    if (!cats.length || !activeCatId) return;

    const newSharedState = typeof requestedState === "boolean"
        ? requestedState
        : !isTaskShared(taskId);

    setTaskSharedState(taskId, newSharedState);

    let activeTask = null;

    cats.forEach(cat => {
        const tasks = getDailyTasks(cat.id);
        const task = tasks.find(item => item.id === taskId);
        if (cat.id === activeCatId) activeTask = task;
    });

    if (newSharedState) {
        const sharedDone = activeTask?.done === true;

        cats.forEach(cat => {
            const tasks = getDailyTasks(cat.id);
            const task = tasks.find(item => item.id === taskId);
            if (!task) return;

            task.shared = true;
            task.done = sharedDone;
            saveDailyTasks(getTodayKey(), tasks, cat.id);
            saveTasksToHistory(cat.id, getTodayKey(), tasks);
        });
    } else {
        cats.forEach(cat => {
            const tasks = getDailyTasks(cat.id);
            const task = tasks.find(item => item.id === taskId);
            if (!task) return;

            task.shared = false;
            saveDailyTasks(getTodayKey(), tasks, cat.id);
            saveTasksToHistory(cat.id, getTodayKey(), tasks);
        });
    }

    closeTaskSettings();
    renderApp();
}

function toggleTask(taskId) {
    const cats = getCats();
    const activeCatId = getActiveCatId();
    if (!cats.length || !activeCatId) return;

    if (isTaskShared(taskId)) {
        const activeTasks = getDailyTasks(activeCatId);
        const activeTask = activeTasks.find(item => item.id === taskId);
        if (!activeTask) return;

        const newDoneState = !activeTask.done;

        cats.forEach(cat => {
            const tasks = getDailyTasks(cat.id);
            const task = tasks.find(item => item.id === taskId);
            if (!task) return;

            task.shared = true;
            task.done = newDoneState;
            saveDailyTasks(getTodayKey(), tasks, cat.id);
            saveTasksToHistory(cat.id, getTodayKey(), tasks);
        });
    } else {
        const tasks = getDailyTasks(activeCatId);
        const task = tasks.find(item => item.id === taskId);
        if (!task) return;

        task.shared = false;
        task.done = !task.done;
        saveDailyTasks(getTodayKey(), tasks, activeCatId);
        saveTasksToHistory(activeCatId, getTodayKey(), tasks);
    }

    renderApp();
}

function applySavedTaskSharedSettings() {
    const settings = getTaskSharedSettings();
    const cats = getCats();
    if (!cats.length) return;

    Object.keys(settings).forEach(taskId => {
        const shared = settings[taskId] === true;
        cats.forEach(cat => {
            const tasks = getDailyTasks(cat.id);
            const task = tasks.find(item => item.id === taskId);
            if (task) {
                task.shared = shared;
                saveDailyTasks(getTodayKey(), tasks, cat.id);
            }
        });
    });
}

migrateSharedFlagsToSettings();
applySavedTaskSharedSettings();
