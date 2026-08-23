// ========================================
// PLATFORM BRIDGE — 0.9.9
// MAX + Telegram Mini App
// ========================================

(function () {
    function isTelegram() {
        return !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
    }

    function getPlatform() {
        return isTelegram() ? "telegram" : "max";
    }

    function getInitData() {
        if (isTelegram()) return window.Telegram.WebApp.initData || "";
        return window.WebApp?.initData || "";
    }

    function initPlatform() {
        if (isTelegram() && typeof window.Telegram.WebApp.ready === "function") {
            window.Telegram.WebApp.ready();
            if (typeof window.Telegram.WebApp.expand === "function") {
                window.Telegram.WebApp.expand();
            }
        }
        window.appPlatform = getPlatform();
        window.appInitData = getInitData();
        return { platform: window.appPlatform, initData: window.appInitData };
    }

    window.isTelegramMiniApp = isTelegram;
    window.getAppPlatform = getPlatform;
    window.getAppInitData = getInitData;
    window.initAppPlatform = initPlatform;

    initPlatform();
})();