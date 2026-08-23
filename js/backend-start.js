// ========================================
// BACKEND STARTUP — 0.9.8
// Синхронизация профилей кошек с Supabase
// ========================================

(function () {
    function mapServerCat(cat) {
        return {
            id: cat.id,
            name: cat.name || "",
            gender: cat.gender || "",
            birthDate: cat.birth_date || "",
            ageValue: cat.age_value ?? null,
            ageUnit: cat.age_unit || "years",
            avatar: cat.avatar_url || "",
            createdAt: cat.created_at || new Date().toISOString()
        };
    }

    async function syncCats() {
        if (typeof window.loadCatsFromBackend !== "function") return;
        const result = await window.loadCatsFromBackend();
        if (!result?.ok) return;

        const serverCats = Array.isArray(result.cats) ? result.cats : [];
        const localCats = typeof getCats === "function" ? getCats() : [];

        // Первый запуск: переносим существующие локальные профили в базу.
        if (!serverCats.length && localCats.length && typeof window.saveCatToBackend === "function") {
            const uploaded = [];
            for (const localCat of localCats) {
                try {
                    const saved = await window.saveCatToBackend(localCat);
                    if (saved?.ok && saved.cat) uploaded.push(mapServerCat(saved.cat));
                } catch (error) {
                    console.error("[Cats] Не удалось перенести профиль:", error);
                }
            }
            if (uploaded.length) {
                saveCats(uploaded);
                setActiveCatId(uploaded[0].id);
            }
            return;
        }

        // Если база уже содержит профили — она становится источником истины.
        if (serverCats.length) {
            const mapped = serverCats.map(mapServerCat);
            saveCats(mapped);
            const currentId = getActiveCatId();
            setActiveCatId(mapped.some(cat => cat.id === currentId) ? currentId : mapped[0].id);
        }
    }

    function installSaveWrapper() {
        if (typeof window.saveCat !== "function" || window.saveCat.__backendWrapped) return;

        const localSaveCat = window.saveCat;
        const wrappedSaveCat = async function (event) {
            const result = await localSaveCat(event);
            try {
                if (window.appBackendUser && typeof window.saveCatToBackend === "function") {
                    const cat = typeof getActiveCat === "function" ? getActiveCat() : null;
                    if (cat) {
                        const saved = await window.saveCatToBackend(cat);
                        if (saved?.ok && saved.cat) {
                            const serverCat = mapServerCat(saved.cat);
                            const cats = getCats().map(item => item.id === cat.id ? serverCat : item);
                            saveCats(cats);
                            setActiveCatId(serverCat.id);
                        }
                    }
                }
            } catch (error) {
                console.error("[Cats] Серверное сохранение не удалось:", error);
            }
            return result;
        };
        wrappedSaveCat.__backendWrapped = true;
        window.saveCat = wrappedSaveCat;
    }

    window.addEventListener("load", async function () {
        try {
            if (typeof window.syncMaxUser === "function") await window.syncMaxUser();
            await syncCats();
            installSaveWrapper();
            if (typeof window.renderApp === "function") window.renderApp();
            window.maxBackendSyncStatus = "cats-success";
            console.log("[MAX] Профили кошек синхронизированы ✓");
        } catch (error) {
            window.maxBackendSyncStatus = "cats-error";
            console.error("[MAX] Ошибка синхронизации профилей:", error);
        }
    });
})();
