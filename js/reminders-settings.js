// ========================================
// REMINDERS SETTINGS — 1.0.2
// MAX + Telegram
// ========================================

(function () {
    const SETTINGS_URL = "https://qligzwdxxytmsflzbpqy.supabase.co/functions/v1/reminder-settings";
    const AUTH_URL = "https://qligzwdxxytmsflzbpqy.supabase.co/functions/v1/max-auth";
    const LOCAL_KEY = "reminderSettings";

    function getPlatform() {
        return window.Telegram?.WebApp?.initData ? "telegram" : "max";
    }

    function getInitData() {
        return getPlatform() === "telegram"
            ? window.Telegram.WebApp.initData || ""
            : window.WebApp?.initData || "";
    }

    function getLocalSettings() {
        try {
            const raw = localStorage.getItem(`${LOCAL_KEY}_${getPlatform()}`);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function setLocalSettings(settings) {
        try {
            localStorage.setItem(`${LOCAL_KEY}_${getPlatform()}`, JSON.stringify(settings));
        } catch (_) {}
    }

    async function post(url, body) {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error(result.error || `Сервер вернул ${response.status}`);
        }
        return result;
    }

    async function ensureUser() {
        const initData = getInitData();
        if (!initData) throw new Error("Данные пользователя недоступны");
        return post(AUTH_URL, { initData, platform: getPlatform() });
    }

    async function getSettings() {
        await ensureUser();
        return post(SETTINGS_URL, {
            action: "get",
            initData: getInitData(),
            platform: getPlatform()
        });
    }

    async function saveSettings(enabled, reminderTime) {
        await ensureUser();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow";
        return post(SETTINGS_URL, {
            action: "save",
            initData: getInitData(),
            platform: getPlatform(),
            enabled,
            reminderTime,
            timezone,
            catId: null
        });
    }

    function applySettings(settings) {
        const enabledInput = document.getElementById("reminderEnabled");
        const timeInput = document.getElementById("reminderTime");
        const timeRow = document.getElementById("reminderTimeRow");
        if (!enabledInput || !timeInput || !timeRow || !settings) return;

        enabledInput.checked = settings.enabled === true;
        timeInput.value = String(settings.reminder_time || settings.reminderTime || "20:00").slice(0, 5);
        timeRow.hidden = !enabledInput.checked;
    }

    function renderRemindersSettings() {
        const content = document.getElementById("content");
        if (!content) return;

        content.innerHTML = `
            <div class="reminders-page">
                <div class="history-header reminders-page-header">
                    <button class="back-button" type="button" onclick="renderApp()">← Назад</button>
                    <h1>Напоминания</h1>
                </div>

                <div class="card reminders-card">
                    <div class="reminders-row">
                        <div class="reminders-row-text">
                            <strong>Вечернее напоминание</strong>
                            <span>Если останутся невыполненные дела, мы напомним о них вечером.</span>
                        </div>
                        <label class="reminder-switch">
                            <input id="reminderEnabled" type="checkbox">
                            <span></span>
                        </label>
                    </div>

                    <div id="reminderTimeRow" class="reminder-time-row" hidden>
                        <label for="reminderTime">Время</label>
                        <input id="reminderTime" class="input reminder-time-input" type="time" value="20:00">
                    </div>

                    <button id="saveReminderSettings" class="button" type="button">Сохранить</button>
                    <div id="reminderSettingsStatus" class="reminder-status" aria-live="polite"></div>
                </div>
            </div>
        `;

        loadSettingsIntoPage();
    }

    async function loadSettingsIntoPage() {
        const enabledInput = document.getElementById("reminderEnabled");
        const timeInput = document.getElementById("reminderTime");
        const timeRow = document.getElementById("reminderTimeRow");
        const status = document.getElementById("reminderSettingsStatus");
        if (!enabledInput || !timeInput || !timeRow) return;

        function syncTimeVisibility() {
            timeRow.hidden = !enabledInput.checked;
        }

        // Сначала восстанавливаем локально, чтобы MAX не показывал исходное состояние.
        applySettings(getLocalSettings());

        try {
            const result = await getSettings();
            if (result.settings) {
                applySettings(result.settings);
                setLocalSettings(result.settings);
            } else {
                syncTimeVisibility();
            }
        } catch (error) {
            syncTimeVisibility();
            if (status) status.textContent = "Не удалось проверить настройки на сервере.";
            console.error("[REMINDERS] Не удалось загрузить настройки:", error);
        }

        enabledInput.addEventListener("change", syncTimeVisibility);

        document.getElementById("saveReminderSettings")?.addEventListener("click", async () => {
            const button = document.getElementById("saveReminderSettings");
            const currentStatus = document.getElementById("reminderSettingsStatus");
            const enabled = enabledInput.checked;
            const reminderTime = timeInput.value || "20:00";
            const localSettings = { enabled, reminderTime };

            button.disabled = true;
            if (currentStatus) currentStatus.textContent = "Сохраняем…";

            try {
                const result = await saveSettings(enabled, reminderTime);
                const saved = result.settings || localSettings;
                setLocalSettings(saved);
                applySettings(saved);
                if (currentStatus) currentStatus.textContent = "Настройки сохранены.";
            } catch (error) {
                if (currentStatus) currentStatus.textContent = "Не удалось сохранить настройки.";
                console.error("[REMINDERS] Не удалось сохранить настройки:", error);
            } finally {
                button.disabled = false;
            }
        });
    }

    function installMenuItem() {
        const menu = document.getElementById("headerMenu");
        if (!menu || document.getElementById("remindersMenuItem")) return;

        const button = document.createElement("button");
        button.id = "remindersMenuItem";
        button.type = "button";
        button.innerHTML = "🔔 <span>Напоминания</span>";
        button.onclick = function () {
            if (typeof closeHeaderMenu === "function") closeHeaderMenu();
            renderRemindersSettings();
        };
        menu.appendChild(button);
    }

    window.renderRemindersSettings = renderRemindersSettings;

    document.addEventListener("DOMContentLoaded", installMenuItem);
    setTimeout(installMenuItem, 0);
})();
