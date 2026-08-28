// ========================================
// BACKEND STARTUP — 0.9.10
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
                            const cats = getCats().map(item =>
                                item.id === cat.id ? serverCat : item
                            );

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
            if (typeof window.syncMaxUser === "function") {
                await window.syncMaxUser();
            }

            // syncMaxUser() уже выполняет синхронизацию кошек.
            // Повторный sync здесь создавал лишние запросы и мог
            // затереть локальную отметку задачи ответом сервера.
            installSaveWrapper();

            window.maxBackendSyncStatus = "cats-success";
            console.log("[MAX] Профили кошек синхронизированы ✓");
        } catch (error) {
            window.maxBackendSyncStatus = "cats-error";
            console.error("[MAX] Ошибка синхронизации профилей:", error);
        }
    });
})();
