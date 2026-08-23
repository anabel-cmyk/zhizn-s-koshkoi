// ========================================
// ЖИЗНЬ С КОШКОЙ
// BOOTSTRAP — 0.9.8
// Сначала синхронизация MAX/Supabase, затем UI.
// ========================================

(async function () {
    try {
        if (typeof window.syncMaxUser === "function") {
            await window.syncMaxUser();
        }
    } catch (error) {
        console.error("[MAX] Начальная синхронизация не выполнена:", error);
    }

    const appScript = document.createElement("script");
    appScript.src = "js/app.js?v=0.9.8";

    appScript.onload = function () {
        const taskSyncScript = document.createElement("script");
        taskSyncScript.src = "js/task-sync.js?v=0.9.8";

        taskSyncScript.onload = async function () {
            try {
                if (typeof window.initTaskSync === "function") {
                    await window.initTaskSync();
                }

                if (typeof migrateOldCat === "function") migrateOldCat();
                if (typeof updateHeaderCat === "function") updateHeaderCat();
                if (typeof renderApp === "function") renderApp();
            } catch (error) {
                console.error("[APP] Ошибка запуска интерфейса:", error);
                if (typeof window.renderApp === "function") window.renderApp();
            }
        };

        taskSyncScript.onerror = function () {
            console.error("[TASKS] Не удалось загрузить task-sync.js");
            try {
                if (typeof migrateOldCat === "function") migrateOldCat();
                if (typeof updateHeaderCat === "function") updateHeaderCat();
                if (typeof renderApp === "function") renderApp();
            } catch (error) {
                console.error("[APP] Ошибка запуска интерфейса:", error);
            }
        };

        document.body.appendChild(taskSyncScript);
    };

    appScript.onerror = function () {
        console.error("[APP] Не удалось загрузить app.js");
    };

    document.body.appendChild(appScript);
})();
