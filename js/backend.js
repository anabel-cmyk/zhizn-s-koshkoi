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
        await syncCats();
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

    function backendCatToLocal(cat) {
        return {
            id: cat.id,
            name: cat.name || "",
            gender: cat.gender || "",
            birthDate: cat.birth_date || null,
            ageValue: cat.age_value ?? null,
            ageUnit: cat.age_unit || null,
            avatar: cat.avatar_url || "",
            createdAt: cat.created_at || new Date().toISOString(),
            updatedAt: cat.updated_at || new Date().toISOString()
        };
    }

    async function syncCats() {
        if (!window.appBackendUser || typeof window.getCats !== "function") return;
        try {
            const result = await loadCatsFromBackend();
            if (!result?.ok) return;
            const remoteCats = Array.isArray(result.cats) ? result.cats : [];
            const localCats = window.getCats();
            const activeId = window.getActiveCatId?.();

            if (remoteCats.length) {
                const mapped = remoteCats.map(backendCatToLocal);
                window.saveCats(mapped);
                const activeRemote = mapped.find(cat => cat.id === activeId);
                window.setActiveCatId(activeRemote ? activeRemote.id : mapped[0].id);
                window.maxCatsSyncStatus = "success";
                if (typeof window.renderApp === "function") window.renderApp();
                return;
            }

            // First server session: migrate existing local prototype data.
            for (const localCat of localCats) {
                const saved = await saveCatToBackend(localCat);
                if (saved?.ok && saved.cat) {
                    const mapped = backendCatToLocal(saved.cat);
                    const current = window.getCats();
                    const index = current.findIndex(cat => cat.id === localCat.id);
                    if (index >= 0) current[index] = mapped;
                    else current.push(mapped);
                    window.saveCats(current);
                    if (activeId === localCat.id) window.setActiveCatId(mapped.id);
                }
            }
            window.maxCatsSyncStatus = "success";
            if (localCats.length && typeof window.renderApp === "function") window.renderApp();
        } catch (error) {
            console.error("[MAX] Ошибка синхронизации кошек:", error);
            window.maxCatsSyncStatus = "error";
        }
    }

    window.syncMaxUser = syncMaxUser;
    window.loadCatsFromBackend = loadCatsFromBackend;
    window.saveCatToBackend = saveCatToBackend;
    window.syncCatsWithBackend = syncCats;
})();
