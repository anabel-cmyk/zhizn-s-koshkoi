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

    const script = document.createElement("script");
    script.src = "js/app.js?v=0.9.8";

    script.onload = function () {
        // app.js регистрирует DOMContentLoaded, но к этому моменту
        // событие может уже пройти. Поэтому запускаем его и здесь.
        try {
            if (typeof migrateOldCat === "function") migrateOldCat();
            if (typeof updateHeaderCat === "function") updateHeaderCat();
            if (typeof renderApp === "function") renderApp();
        } catch (error) {
            console.error("[APP] Ошибка запуска интерфейса:", error);
        }
    };

    script.onerror = function () {
        console.error("[APP] Не удалось загрузить app.js");
    };

    document.body.appendChild(script);
})();
