// ========================================
// 0.9.5 TASK SETTINGS FIX
// Shared-task state is stored per cat,
// but the setting itself is synchronized.
// ========================================

function toggleTaskShared(taskId, isShared) {
    const cats = typeof getCats === "function" ? getCats() : [];
    if (!cats.length) return;

    const activeCatId = typeof getActiveCatId === "function"
        ? getActiveCatId()
        : null;

    if (!activeCatId) return;

    const sharedState = typeof isShared === "boolean"
        ? isShared
        : null;

    // Read the active cat's current state before changing anything.
    const activeTasks = getDailyTasks(activeCatId);
    const activeTask = activeTasks.find(task => task.id === taskId);
    if (!activeTask) return;

    const newSharedState = sharedState === null
        ? !activeTask.shared
        : sharedState;

    // When enabling shared mode, the active cat remains the source
    // of truth for today's completion state. Disabling shared mode
    // does not overwrite individual completion states.
    const sharedDone = activeTask.done === true;

    cats.forEach(cat => {
        const tasks = getDailyTasks(cat.id);
        const task = tasks.find(item => item.id === taskId);

        if (!task) return;

        task.shared = newSharedState;

        if (newSharedState) {
            task.done = sharedDone;
        }

        saveDailyTasks(getTodayKey(), tasks, cat.id);
        saveTasksToHistory(cat.id, getTodayKey(), tasks);
    });

    if (typeof closeTaskSettings === "function") {
        closeTaskSettings();
    }

    renderApp();
}
