// ========================================
// REMINDERS SETTINGS — 1.0.3
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

    async function saveSettings(enabled, reminderTime, medicalEnabled, medicalReminderDays, medicalReminderTime) {
        await ensureUser();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow";
        return post(SETTINGS_URL, {
            action: "save",
            initData: getInitData(),
            platform: getPlatform(),
            enabled,
            reminderTime,
            medicalEnabled,
            medicalReminderDays,
            medicalReminderTime,
            timezone,
            catId: null
        });
    }

    function applySettings(settings) {
        if (!settings) return;

        const enabledInput = document.getElementById("reminderEnabled");
        const timeInput = document.getElementById("reminderTime");
        const timeRow = document.getElementById("reminderTimeRow");
        const medicalEnabledInput = document.getElementById("medicalReminderEnabled");
        const medicalDaysInput = document.getElementById("medicalReminderDays");
        const medicalTimeInput = document.getElementById("medicalReminderTime");
        const medicalSettings = document.getElementById("medicalReminderSettings");

        if (enabledInput && timeInput && timeRow) {
            enabledInput.checked = settings.enabled === true;
            timeInput.value = String(settings.reminder_time || settings.reminderTime || "20:00").slice(0, 5);
            timeRow.hidden = !enabledInput.checked;
        }

        if (medicalEnabledInput && medicalDaysInput && medicalTimeInput && medicalSettings) {
            medicalEnabledInput.checked = settings.medical_enabled !== false;
            medicalDaysInput.value = String(settings.medical_reminder_days ?? 14);
            medicalTimeInput.value = String(settings.medical_reminder_time || "20:00").slice(0, 5);
            medicalSettings.hidden = !medicalEnabledInput.checked;
        }
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
                </div>

                <div class="card reminders-card">
                    <div class="reminders-row">
                        <div class="reminders-row-text">
                            <strong>Медицинские события</strong>
                            <span>Напоминаем о запланированных ветеринарных и профилактических событиях.</span>
                        </div>
                        <label class="reminder-switch">
                            <input id="medicalReminderEnabled" type="checkbox">
                            <span></span>
                        </label>
                    </div>

                    <div id="medicalReminderSettings" hidden>
                        <div class="reminder-time-row">
                            <div>
                                <label for="medicalReminderDays">Напоминать заранее</label>
                            </div>
                            <select id="medicalReminderDays" class="input reminder-time-input">
                                <option value="0">В день события</option>
                                <option value="1">За 1 день</option>
                                <option value="3">За 3 дня</option>
                                <option value="7">За 7 дней</option>
                                <option value="14">За 14 дней</option>
                                <option value="30">За 30 дней</option>
                            </select>
                        </div>

                        <div class="reminder-time-row">
                            <label for="medicalReminderTime">Время</label>
                            <input id="medicalReminderTime" class="input reminder-time-input" type="time" value="20:00">
                        </div>
                    </div>
                </div>

                <button id="saveReminderSettings" class="button" type="button">Сохранить</button>
                <div id="reminderSettingsStatus" class="reminder-status" aria-live="polite"></div>
            </div>
        `;

        loadSettingsIntoPage();
    }

    async function loadSettingsIntoPage() {
        const enabledInput = document.getElementById("reminderEnabled");
        const timeInput = document.getElementById("reminderTime");
        const timeRow = document.getElementById("reminderTimeRow");
        const medicalEnabledInput = document.getElementById("medicalReminderEnabled");
        const medicalDaysInput = document.getElementById("medicalReminderDays");
        const medicalTimeInput = document.getElementById("medicalReminderTime");
        const medicalSettings = document.getElementById("medicalReminderSettings");
        const status = document.getElementById("reminderSettingsStatus");
        if (!enabledInput || !timeInput || !timeRow || !medicalEnabledInput || !medicalDaysInput || !medicalTimeInput || !medicalSettings) return;

        function syncVisibility() {
            timeRow.hidden = !enabledInput.checked;
            medicalSettings.hidden = !medicalEnabledInput.checked;
        }

        applySettings(getLocalSettings());
        syncVisibility();

        try {
            const result = await getSettings();
            if (result.settings) {
                applySettings(result.settings);
                setLocalSettings(result.settings);
            }
        } catch (error) {
            if (status) status.textContent = "Не удалось проверить настройки на сервере.";
            console.error("[REMINDERS] Не удалось загрузить настройки:", error);
        }

        enabledInput.addEventListener("change", syncVisibility);
        medicalEnabledInput.addEventListener("change", syncVisibility);

        document.getElementById("saveReminderSettings")?.addEventListener("click", async () => {
            const button = document.getElementById("saveReminderSettings");
            const currentStatus = document.getElementById("reminderSettingsStatus");
            const enabled = enabledInput.checked;
            const reminderTime = timeInput.value || "20:00";
            const medicalEnabled = medicalEnabledInput.checked;
            const medicalReminderDays = Number(medicalDaysInput.value);
            const medicalReminderTime = medicalTimeInput.value || "20:00";
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow";
            const localSettings = {
                enabled,
                reminderTime,
                medical_enabled: medicalEnabled,
                medical_reminder_days: medicalReminderDays,
                medical_reminder_time: medicalReminderTime,
                timezone
            };

            button.disabled = true;
            if (currentStatus) currentStatus.textContent = "Сохраняем…";

            try {
                const result = await saveSettings(enabled, reminderTime, medicalEnabled, medicalReminderDays, medicalReminderTime);
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
