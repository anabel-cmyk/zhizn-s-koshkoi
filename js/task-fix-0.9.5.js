// ========================================
// 0.9.5 TASK SETTINGS FIX
// Shared-task state is stored per cat,
// but the setting itself is synchronized.
// ========================================

function toggleTaskShared(taskId, isShared) {
    const cats = typeof getCats === "function" ? getCats() : [];
    if (!cats.length) return;

    const activeCatId = typeof getActiveCatId === "function" ? getActiveCatId() : null;
    if (!activeCatId) return;

    const activeTasks = getDailyTasks(activeCatId);
    const activeTask = activeTasks.find(task => task.id === taskId);
    if (!activeTask) return;

    const newSharedState = typeof isShared === "boolean" ? isShared : !activeTask.shared;
    const sharedDone = activeTask.done === true;

    cats.forEach(cat => {
        const tasks = getDailyTasks(cat.id);
        const task = tasks.find(item => item.id === taskId);
        if (!task) return;

        task.shared = newSharedState;
        if (newSharedState) task.done = sharedDone;

        saveDailyTasks(getTodayKey(), tasks, cat.id);
        saveTasksToHistory(cat.id, getTodayKey(), tasks);
    });

    renderApp();
}

// ========================================
// ORIGINAL TASK SETTINGS PRESENTATION
// ========================================

function createTask(task) {
    return `
        <div class="task">
            <div class="task-main">
                <div class="task-icon">${task.icon}</div>
                <div class="task-text">
                    <div class="task-name">${escapeHtml(task.name)}</div>
                    <div class="task-time">${escapeHtml(task.description)}</div>
                </div>
                <button class="task-settings-button" type="button" onclick="toggleTaskSettings('${task.id}')" aria-label="Настройки задачи" aria-expanded="false">⚙</button>
                <div class="check ${task.done ? "done" : ""}" onclick="toggleTask('${task.id}')" role="button" aria-label="Отметить выполненным"></div>
            </div>
            <div id="task-settings-${task.id}" class="task-settings" hidden>
                <label class="task-shared-setting">
                    <span>
                        <strong>Общая для всех кошек</strong>
                        <small>Одна отметка будет применяться ко всем кошкам</small>
                    </span>
                    <input type="checkbox" ${task.shared === true ? "checked" : ""} onchange="toggleTaskShared('${task.id}', this.checked)">
                    <span class="task-toggle" aria-hidden="true"></span>
                </label>
            </div>
        </div>
    `;
}
