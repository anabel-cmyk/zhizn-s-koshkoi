// ========================================
// TASK BACKEND BRIDGE — 1.0.3
// Надёжная синхронизация локальных отметок задач
// с Supabase для вечерних напоминаний.
// ========================================

(function () {
    async function ensureBackendReady() {
        if (window.appBackendUser) return true;
        if (typeof window.syncMaxUser !== "function") return false;

        try {
            const result = await window.syncMaxUser();
            return result?.ok === true && !!window.appBackendUser;
        } catch (error) {
            console.error("[BACKEND] Не удалось авторизовать пользователя:", error);
            return false;
        }
    }

    async function resolveServerCatId(localCatId) {
        if (!localCatId) return null;

        const cats = typeof window.getCats === "function" ? window.getCats() : [];
        const localCat = cats.find(cat => String(cat.id) === String(localCatId));

        // Уже серверный UUID.
        if (localCat?.serverId) return localCat.serverId;
        if (localCatId && !String(localCatId).startsWith("cat_")) {
            const remote = await window.loadCatsFromBackend?.();
            if (remote?.ok && Array.isArray(remote.cats) && remote.cats.some(cat => String(cat.id) === String(localCatId))) {
                return localCatId;
            }
        }

        const remote = await window.loadCatsFromBackend?.();
        if (!remote?.ok || !Array.isArray(remote.cats)) return null;

        const match = remote.cats.find(cat =>
            (localCat && cat.name === localCat.name) ||
            (localCat?.serverId && String(cat.id) === String(localCat.serverId))
        );

        return match?.id || null;
    }

    async function syncTodayTasks() {
        if (typeof window.saveTaskCompletionToBackend !== "function") return false;

        const ready = await ensureBackendReady();
        if (!ready) return false;

        const date = window.getTodayKey?.();
        if (!date) return false;

        let storage = {};
        try {
            storage = JSON.parse(localStorage.getItem("dailyTasks") || "{}");
        } catch {
            return false;
        }

        const requests = [];
        let found = false;

        for (const localCatId of Object.keys(storage)) {
            const catData = storage[localCatId];
            if (!catData || catData.date !== date || !Array.isArray(catData.tasks)) continue;

            const serverCatId = await resolveServerCatId(localCatId);
            if (!serverCatId) {
                console.warn("[BACKEND] Не найден серверный ID кошки:", localCatId);
                continue;
            }

            found = true;

            // Переносим локальные данные под серверный ID, чтобы следующие
            // операции сразу использовали правильный ключ.
            if (serverCatId !== localCatId && !storage[serverCatId]) {
                storage[serverCatId] = catData;
                delete storage[localCatId];
            }

            for (const task of catData.tasks) {
                requests.push(
                    window.saveTaskCompletionToBackend(
                        serverCatId,
                        task.id,
                        date,
                        task.done === true
                    ).catch(error => {
                        console.error("[BACKEND] Не удалось синхронизировать задачу:", error);
                    })
                );
            }
        }

        localStorage.setItem("dailyTasks", JSON.stringify(storage));
        await Promise.all(requests);
        return found;
    }

    function syncWhenReady(attempt = 0) {
        syncTodayTasks().then(done => {
            if (done) return;
            if (attempt < 20) setTimeout(() => syncWhenReady(attempt + 1), 500);
        }).catch(error => {
            console.error("[BACKEND] Ошибка синхронизации задач:", error);
            if (attempt < 20) setTimeout(() => syncWhenReady(attempt + 1), 500);
        });
    }

    function install() {
        if (document.body.__taskBackendBridgeInstalled) return;
        document.body.__taskBackendBridgeInstalled = true;

        document.addEventListener("click", event => {
            const check = event.target.closest?.(".check");
            if (!check) return;
            setTimeout(() => syncWhenReady(), 100);
        });

        setTimeout(() => syncWhenReady(), 1000);
        setTimeout(() => syncWhenReady(), 3000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();
