// ========================================
// 0.9.3 — HEALTH EVENT FORM
// ========================================

const HEALTH_EMOJI_CHOICES = ["💉", "🪱", "🦟", "🦷", "💊", "🩺", "🐾", "❤️", "✨", "📌"];

function getHealthEventTypeOptions(selectedType) {
    return Object.entries(HEALTH_EVENT_DEFAULTS)
        .map(([value, meta]) => `<option value="${value}" ${selectedType === value ? "selected" : ""}>${meta.label}</option>`)
        .join("");
}

function openHealthEventFormV093(eventId = "") {
    const cat = getActiveCat();
    if (!cat) return;

    const existing = getAllHealthEvents(cat.id).find(event => event.id === eventId);
    closeHealthEventForm();

    const currentType = existing?.type || "vaccination";
    const defaultEmoji = getHealthEventMeta({ type: currentType }).emoji;
    const emoji = existing?.emoji || defaultEmoji;

    const modal = document.createElement("div");
    modal.id = "healthEventModal";
    modal.className = "health-event-modal active";
    modal.innerHTML = `
        <div class="health-event-overlay" onclick="closeHealthEventForm()"></div>
        <div class="health-event-dialog">
            <button class="health-event-close" onclick="closeHealthEventForm()">×</button>
            <h2>${existing ? "Медицинское событие" : "Новое событие"}</h2>

            <div class="form-field">
                <label class="form-label">Событие</label>
                <select id="healthEventType" class="input" onchange="updateHealthEventEmoji()">
                    ${getHealthEventTypeOptions(currentType)}
                </select>
            </div>

            <div class="form-field">
                <label class="form-label">Эмодзи</label>
                <div class="health-emoji-picker" id="healthEmojiPicker">
                    ${HEALTH_EMOJI_CHOICES.map(item => `<button type="button" class="health-emoji-option ${item === emoji ? "active" : ""}" onclick="selectHealthEmoji('${item}')">${item}</button>`).join("")}
                </div>
            </div>

            <div class="form-field">
                <label class="form-label">Дата события</label>
                <input id="healthEventDate" class="input" type="date" value="${existing?.date || ""}">
            </div>

            <div class="form-field">
                <label class="form-label">Следующая дата</label>
                <input id="healthEventNextDate" class="input" type="date" value="${existing?.nextDate || ""}">
            </div>

            <div class="form-field">
                <label class="form-label">Напомнить заранее</label>
                <select id="healthEventReminder" class="input">
                    ${[1, 3, 7, 14, 30].map(days => `<option value="${days}" ${Number(existing?.reminderDays || 14) === days ? "selected" : ""}>За ${days} ${days === 1 ? "день" : "дней"}</option>`).join("")}
                </select>
            </div>

            <div class="form-field">
                <label class="form-label">Комментарий</label>
                <input id="healthEventNote" class="input" type="text" placeholder="Например, комплексная вакцина" value="${escapeHtml(existing?.note || "")}">
            </div>

            <button class="button" onclick="saveHealthEventV093('${eventId}')">Сохранить</button>
            ${existing ? `<button class="button button-secondary" onclick="deleteHealthEvent('${eventId}')">Удалить</button>` : ""}
        </div>
    `;
    document.body.appendChild(modal);
}

function getSelectedHealthEmoji() {
    return document.querySelector(".health-emoji-option.active")?.textContent || getHealthEventMeta({ type: document.getElementById("healthEventType")?.value }).emoji;
}

function selectHealthEmoji(emoji) {
    document.querySelectorAll(".health-emoji-option").forEach(button => button.classList.toggle("active", button.textContent === emoji));
}

function updateHealthEventEmoji() {
    const type = document.getElementById("healthEventType")?.value || "other";
    selectHealthEmoji(getHealthEventMeta({ type }).emoji);
}

function saveHealthEventV093(eventId) {
    const cat = getActiveCat();
    if (!cat) return;

    const profile = getCatHealth(cat.id);
    const date = document.getElementById("healthEventDate")?.value;
    if (!date) {
        alert("Укажите дату события");
        return;
    }

    const event = {
        id: eventId || `health_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: document.getElementById("healthEventType")?.value || "other",
        emoji: getSelectedHealthEmoji(),
        date,
        nextDate: document.getElementById("healthEventNextDate")?.value || "",
        reminderDays: Number(document.getElementById("healthEventReminder")?.value || 14),
        note: document.getElementById("healthEventNote")?.value?.trim() || ""
    };

    const index = profile.medicalEvents.findIndex(item => item.id === event.id);
    if (index >= 0) profile.medicalEvents[index] = event;
    else profile.medicalEvents.push(event);

    saveCatHealth(cat.id, profile);
    closeHealthEventForm();

    if (diaryViewMode === "calendar") renderDiaryCalendarView();
    else openDiaryProgress();
}

window.openHealthEventForm = openHealthEventFormV093;
window.saveHealthEvent = saveHealthEventV093;
