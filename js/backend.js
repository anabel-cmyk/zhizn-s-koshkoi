// ========================================
// BACKEND INTEGRATION — 0.9.8
// MAX Mini App → Supabase Edge Function
// ========================================

(function () {
    const SUPABASE_FUNCTION_URL = "https://qligzwdxxytmsflzbpqy.supabase.co/functions/v1/max-auth";

    async function syncMaxUser() {
        const webApp = window.WebApp;
        const initData = webApp?.initData || "";

        if (!initData) {
            return { ok: false, skipped: true, error: "MAX initData недоступен" };
        }

        const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
            throw new Error(result.error || `Сервер вернул ${response.status}`);
        }

        window.appBackendUser = result.user;
        return result;
    }

    window.syncMaxUser = syncMaxUser;
})();
