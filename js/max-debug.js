// MAX DEBUG — временная диагностика подключения пользователя
(function () {
    function getMaxUser() {
        return window.WebApp?.initDataUnsafe?.user || null;
    }

    function showMaxDebug() {
        const user = getMaxUser();
        const bridgeLoaded = Boolean(window.WebApp);
        const userId = user?.user_id ?? user?.id ?? null;
        const userName = user?.first_name || user?.name || "не определён";

        let message;

        if (!bridgeLoaded) {
            message = "MAX Bridge не найден";
        } else if (!user) {
            message = "MAX подключён ✓\nПользователь не определён";
        } else if (!userId) {
            message = `MAX подключён ✓\nПользователь: ${userName}\nID пользователя не получен`;
        } else {
            message = `MAX подключён ✓\nПользователь: ${userName}\nID пользователя: получен ✓`;
        }

        alert(message);
    }

    window.showMaxDebug = showMaxDebug;
})();
