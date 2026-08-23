// ========================================
// BACKEND INTEGRATION — 0.9.8
// MAX Mini App → Supabase Edge Functions
// ========================================

(function () {
    const AUTH_URL = "https://qligzwdxxytmsflzbpqy.supabase.co/functions/v1/max-auth";
    const CATS_URL = "https://qligzwdxxytmsflzbpqy.supabase.co/functions/v1/max-cats";

    function getInitData() { return window.WebApp?.initData || ""; }

    async function post(url, body) {
        const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.error || `Сервер вернул ${response.status}`);
        return result;
    }

    async function syncMaxUser() {
        const initData = getInitData();
        if (!initData) return { ok: false, skipped: true, error: "MAX initData недоступен" };
        const result = await post(AUTH_URL, { initData });
        window.appBackendUser = result.user;
        return result;
    }

    async function loadCatsFromBackend() {
        if (!window.appBackendUser) return { ok: false, skipped: true, cats: [] };
        return await post(CATS_URL, { action: "list", initData: getInitData() });
    }

    async function saveCatToBackend(cat) {
        if (!window.appBackendUser) return { ok: false, skipped: true };
        return await post(CATS_URL, { action: "save", initData: getInitData(), cat });
    }

    window.syncMaxUser = syncMaxUser;
    window.loadCatsFromBackend = loadCatsFromBackend;
    window.saveCatToBackend = saveCatToBackend;
})();
