// ========================================
// TASK SYNC — 0.9.8
// local task UI + Supabase persistence
// ========================================

(function () {
    const TASKS_API = "https://qligzwdxxytmsflzbpqy.supabase.co/functions/v1/max-tasks";
    let originalRenderApp = null;
    let originalToggleTask = null;
    let initialized = false;
    let readyResolve;
    const ready = new Promise(resolve => { readyResolve = resolve; });

    window.taskSyncReady = ready;

    function getInitData() {
        return window.WebApp?.initData || "";
    }

    async function request(body) {
        const initData = getInitData();
        if (!initData) throw new Error("MAX initData недоступен");

        const response = await fetch(TASKS_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...body, initData })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error(result.error || `Сервер вернул ${response.status}`);
        }
        return result;
    }

    function applyCompletions(completions) {
        const storage = typeof getTasksStorage === "function" ? getTasksStorage() : {};
        const today = typeof getTodayKey === "function" ? getTodayKey() : new Date().toISOString().slice(0, 10);

        completions.forEach(item => {
            const catId = item.cat_id;
            if (!storage[catId] || storage[catId].date !== today) return;
            if (!Array.isArray(storage[catId].tasks)) return;

            const task = storage[catId].tasks.find(t => String(t.id) === String(item.task_id));
            if (task) task.done = item.completed === true;
        });

        if (typeof saveTasksStorage === "function") saveTasksStorage(storage);
    }

    async function loadCompletions() {
        const cats = typeof getCats === "function" ? getCats() : [];
        if (!cats.length || !getInitData()) return;

        const today = typeof getTodayKey === "function" ? getTodayKey() : new Date().toISOString().slice(0, 10);
        const result = await request({ action: "get", date: today });
        applyCompletions(result.completions || []);
    }

    async function initTaskSync() {
        if (initialized) return ready;
        initialized = true;

        originalRenderApp = window.renderApp;
        originalToggleTask = window.toggleTask;

        if (typeof originalRenderApp !== "function" || typeof originalToggleTask !== "function") {
            console.error("[TASKS] Основные функции приложения ещё не загружены");
            window.__taskSyncLoaded = true;
            readyResolve();
            return ready;
        }

        window.renderApp = function () {
            if (!window.__taskSyncLoaded) {
                const content = document.getElementById("content");
                if (content) {
                    content.innerHTML = '<div class="welcome"><h1>Загружаем данные…</h1><p>Секунду, проверяем ваши задачи.</p></div>';
                }
                return ready.then(() => originalRenderApp());
            }
            return originalRenderApp();
        };

        window.toggleTask = function (taskId) {
            const before = typeof getDailyTasks === "function" ? getDailyTasks() : [];
            const previous = before.find(task => String(task.id) === String(taskId));
            const previousDone = previous ? previous.done === true : false;

            originalToggleTask(taskId);

            const after = typeof getDailyTasks === "function" ? getDailyTasks() : [];
            const current = after.find(task => String(task.id) === String(taskId));
            const catId = typeof getActiveCatId === "function" ? getActiveCatId() : null;

            if (!catId || !current || previousDone === (current.done === true)) return;

            request({
                action: "set",
                catId,
                taskId: String(taskId),
                date: typeof getTodayKey === "function" ? getTodayKey() : new Date().toISOString().slice(0, 10),
                completed: current.done === true
            }).catch(error => console.error("[TASKS] Ошибка сохранения:", error));
        };

        try {
            await loadCompletions();
        } catch (error) {
            console.error("[TASKS] Ошибка загрузки:", error);
        }

        window.__taskSyncLoaded = true;
        readyResolve();
        return ready;
    }

    window.initTaskSync = initTaskSync;
})();
