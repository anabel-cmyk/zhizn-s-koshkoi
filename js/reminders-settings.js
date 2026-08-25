// ========================================
// REMINDERS SETTINGS — 1.0.1
// MAX + Telegram
// ========================================

(function () {
    const SETTINGS_URL = "https://qligzwdxxytmsflzbpqy.supabase.co/functions/v1/reminder-settings";
    const AUTH_URL = "https://qligzwdxxytmsflzbpqy.supabase.co/functions/v1/max-auth";

    function getPlatform() {
        return window.Telegram?.WebApp?.initData ? "telegram" : "max";
    }

    function getInitData() {
        return getPlatform() === "telegram"
            ? window.Telegram.WebApp.initData || ""
            : window.WebApp?.initData || "";
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

        try {
            const result = await getSettings();
            const settings = result.settings;
            if (settings) {
                enabledInput.checked = settings.enabled === true;
                timeInput.value = String(settings.reminder_time || "20:00").slice(0, 5);
            }
            syncTimeVisibility();
        } catch (error) {
            syncTimeVisibility();
            if (status) status.textContent = "Не удалось загрузить настройки.";
            console.error("[REMINDERS] Не удалось загрузить настройки:", error);
        }

        enabledInput.addEventListener("change", syncTimeVisibility);

        document.getElementById("saveReminderSettings")?.addEventListener("click", async () => {
            const button = document.getElementById("saveReminderSettings");
            const currentStatus = document.getElementById("reminderSettingsStatus");
            button.disabled = true;
            if (currentStatus) currentStatus.textContent = "Сохраняем…";

            try {
                await saveSettings(enabledInput.checked, timeInput.value || "20:00");
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
