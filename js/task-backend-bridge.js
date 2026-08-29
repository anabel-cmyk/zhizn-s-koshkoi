// ========================================
// TASK BACKEND BRIDGE — 1.0.0
// Синхронизация локальных отметок задач
// с Supabase для вечерних напоминаний.
// ========================================

(function () {
    async function ensureBackendReady() {
        return !!window.appBackendUser;
    }

    async function resolveServerCatId(localCatId, remoteCats) {
        if (!localCatId || !Array.isArray(remoteCats)) return null;

        const cats = typeof window.getCats === "function" ? window.getCats() : [];
        const localCat = cats.find(cat => String(cat.id) === String(localCatId));

        if (localCat?.serverId) return localCat.serverId;
        if (!String(localCatId).startsWith("cat_") &&
            remoteCats.some(cat => String(cat.id) === String(localCatId))) {
            return localCatId;
        }

        const match = remoteCats.find(cat =>
            (localCat && cat.name === localCat.name) ||
            (localCat?.serverId && String(cat.id) === String(localCat.serverId))
        );

        return match?.id || null;
    }

    async function syncTodayTasks() {
        if (typeof window.saveTaskCompletionToBackend !== "function") return false;
        if (!(await ensureBackendReady())) return false;

        const date = window.getTodayKey?.();
        if (!date) return false;

        let storage;
        try {
            storage = JSON.parse(localStorage.getItem("dailyTasks") || "{}");
        } catch {
            return false;
        }

        const remote = await window.loadCatsFromBackend?.();
        const remoteCats = remote?.ok && Array.isArray(remote.cats) ? remote.cats : [];
        if (!remoteCats.length) return false;

        const requests = [];
        let found = false;

        for (const localCatId of Object.keys(storage)) {
            const catData = storage[localCatId];
            if (!catData || catData.date !== date || !Array.isArray(catData.tasks)) continue;

            const serverCatId = await resolveServerCatId(localCatId, remoteCats);
            if (!serverCatId) continue;

            found = true;

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

        try {
            localStorage.setItem("dailyTasks", JSON.stringify(storage));
        } catch (error) {
            console.error("[BACKEND] Не удалось сохранить локальные задачи:", error);
        }

        await Promise.all(requests);
        return found;
    }

    function syncWhenReady(attempt = 0) {
        syncTodayTasks().then(done => {
            if (done || attempt >= 5) return;
            setTimeout(() => syncWhenReady(attempt + 1), 1000);
        }).catch(error => {
            console.error("[BACKEND] Ошибка фоновой синхронизации задач:", error);
            if (attempt < 5) setTimeout(() => syncWhenReady(attempt + 1), 1000);
        });
    }

    function install() {
        if (document.body.__taskBackendBridgeInstalled) return;
        document.body.__taskBackendBridgeInstalled = true;

        // backend.js уже сохраняет каждое нажатие галочки.
        // Этот мост делает только одну начальную синхронизацию после загрузки.
        const start = () => syncWhenReady();

        if (document.readyState === "complete") {
            start();
        } else {
            window.addEventListener("load", start, { once: true });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", install, { once: true });
    } else {
        install();
    }
})();