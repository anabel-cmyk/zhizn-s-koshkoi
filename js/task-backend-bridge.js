// ========================================
// TASK BACKEND BRIDGE — 1.0.2
// Надёжная синхронизация локальных отметок задач
// с Supabase для вечерних напоминаний.
// ========================================

(function () {
    async function ensureBackendReady() {
        if (window.appBackendUser) return true;

        if (typeof window.syncMaxUser !== "function") return false;

        try {
            const result = await window.syncMaxUser();
            return result?.ok === true && !!window.appBackendUser;
        } catch (error) {
            console.error("[BACKEND] Не удалось авторизовать пользователя:", error);
            return false;
        }
    }

    async function syncTodayTasks() {
        if (typeof window.saveTaskCompletionToBackend !== "function") return false;

        const ready = await ensureBackendReady();
        if (!ready) return false;

        const date = window.getTodayKey?.();
        if (!date) return false;

        let storage = {};
        try {
            storage = JSON.parse(localStorage.getItem("dailyTasks") || "{}");
        } catch {
            return false;
        }

        let found = false;
        const requests = [];

        Object.keys(storage).forEach(catId => {
            const catData = storage[catId];
            if (!catData || catData.date !== date || !Array.isArray(catData.tasks)) return;

            catData.tasks.forEach(task => {
                found = true;
                requests.push(
                    window.saveTaskCompletionToBackend(
                        catId,
                        task.id,
                        date,
                        task.done === true
                    ).catch(error => {
                        console.error("[BACKEND] Не удалось синхронизировать задачу:", error);
                    })
                );
            });
        });

        await Promise.all(requests);
        return found;
    }

    function syncWhenReady(attempt = 0) {
        syncTodayTasks().then(done => {
            if (done) return;
            if (attempt < 20) {
                setTimeout(() => syncWhenReady(attempt + 1), 500);
            }
        }).catch(error => {
            console.error("[BACKEND] Ошибка синхронизации задач:", error);
            if (attempt < 20) {
                setTimeout(() => syncWhenReady(attempt + 1), 500);
            }
        });
    }

    function install() {
        if (document.body.__taskBackendBridgeInstalled) return;
        document.body.__taskBackendBridgeInstalled = true;

        document.addEventListener("click", event => {
            const check = event.target.closest?.(".check");
            if (!check) return;
            setTimeout(() => syncWhenReady(), 100);
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
