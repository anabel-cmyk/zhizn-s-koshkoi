// ========================================
// BACKEND START — 0.9.8
// ========================================
// Запускаем синхронизацию с Supabase после загрузки страницы.
// Ошибка backend не блокирует интерфейс Mini App.

window.addEventListener("load", function () {
    if (typeof window.syncMaxUser !== "function") return;

    window.syncMaxUser()
        .then(function (result) {
            if (result && result.ok) {
                window.maxBackendSyncStatus = "success";
                console.log("[MAX] Пользователь синхронизирован с сервером ✓");
            }
        })
        .catch(function (error) {
            window.maxBackendSyncStatus = "error";
            console.error("[MAX] Ошибка синхронизации:", error);
        });
});
