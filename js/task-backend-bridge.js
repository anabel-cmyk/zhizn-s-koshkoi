// ========================================
// TASK BACKEND BRIDGE — 1.0.1
// Надёжная синхронизация локальных отметок задач
// с Supabase для вечерних напоминаний.
// ========================================

(function () {
    function syncTodayTasks() {
        if (typeof window.saveTaskCompletionToBackend !== "function") return false;
        if (!window.appBackendUser) return false;

        const date = window.getTodayKey?.();
        if (!date) return false;

        let storage = {};
        try {
            storage = JSON.parse(localStorage.getItem("dailyTasks") || "{}");
        } catch {
            return false;
        }

        let found = false;

        Object.keys(storage).forEach(catId => {
            const catData = storage[catId];
            if (!catData || catData.date !== date || !Array.isArray(catData.tasks)) return;

            catData.tasks.forEach(task => {
                found = true;
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

        return found;
    }

    function syncWhenReady(attempt = 0) {
        if (syncTodayTasks()) return;
        if (attempt < 20) {
            setTimeout(() => syncWhenReady(attempt + 1), 250);
        }
    }

    function install() {
        if (document.body.__taskBackendBridgeInstalled) return;
        document.body.__taskBackendBridgeInstalled = true;

        document.addEventListener("click", event => {
            const check = event.target.closest?.(".check");
            if (!check) return;
            setTimeout(() => syncWhenReady(), 50);
        });

        setTimeout(() => syncWhenReady(), 1000);
        setTimeout(() => syncWhenReady(), 3000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
