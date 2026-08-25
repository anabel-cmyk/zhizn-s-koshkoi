// ========================================
// TASK BACKEND BRIDGE — 1.0.0
// Надёжная синхронизация локальных отметок задач
// с Supabase для вечерних напоминаний.
// ========================================

(function () {
    function syncTodayTasks() {
        if (typeof window.saveTaskCompletionToBackend !== "function") return;
        if (!window.appBackendUser) return;

        const date = window.getTodayKey?.();
        if (!date) return;

        let storage = {};
        try {
            storage = JSON.parse(localStorage.getItem("dailyTasks") || "{}");
        } catch {
            return;
        }

        Object.keys(storage).forEach(catId => {
            const catData = storage[catId];
            if (!catData || catData.date !== date || !Array.isArray(catData.tasks)) return;

            catData.tasks.forEach(task => {
                window.saveTaskCompletionToBackend(
                    catId,
                    task.id,
                    date,
                    task.done === true
                ).catch(error => {
                    console.error("[BACKEND] Не удалось синхронизировать задачу:", error);
                });
            });
        });
    }

    function install() {
        if (document.body.__taskBackendBridgeInstalled) return;
        document.body.__taskBackendBridgeInstalled = true;

        document.addEventListener("click", event => {
            const check = event.target.closest?.(".check");
            if (!check) return;

            // toggleTask() сначала завершает локальное сохранение и renderApp(),
            // поэтому ждём следующий кадр, чтобы прочитать уже обновлённое состояние.
            setTimeout(syncTodayTasks, 0);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
