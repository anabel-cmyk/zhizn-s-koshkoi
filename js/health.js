// ========================================
// ЖИЗНЬ С КОШКОЙ
// HEALTH / CALENDAR
// MVP 0.9.3
// ========================================

const HEALTH_KEY = "catHealthProfiles";
let healthCalendarMonth = null;

function getHealthData() {
    const saved = localStorage.getItem(HEALTH_KEY);
    if (!saved) return {};
    try {
        const data = JSON.parse(saved);
        return data && typeof data === "object" ? data : {};
    } catch {
        return {};
    }
}

function saveHealthData(data) {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(data));
}

function getCatHealth(catId) {
    const data = getHealthData();
    return data[catId] || {
        gender: "",
        avatar: "",
        medicalEvents: []
    };
}

function saveCatHealth(catId, profile) {
    const data = getHealthData();
    data[catId] = {
        gender: profile.gender || "",
        avatar: profile.avatar || "",
        medicalEvents: Array.isArray(profile.medicalEvents)
            ? profile.medicalEvents
            : []
    };
    saveHealthData(data);
}

function getHealthEventTypeLabel(type) {
    const labels = {
        vaccination: "Вакцинация",
        parasite: "Обработка от паразитов",
        sterilization: "Стерилизация",
        dental: "Уход за зубами",
        other: "Другое"
    };
    return labels[type] || "Медицинское событие";
}

function formatHealthDate(date) {
    if (!date) return "—";
    return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatShortDate(date) {
    if (!date) return "";
    return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short"
    });
}

function getHealthMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getHealthMonthName(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric"
    });
}

function shiftHealthMonth(monthKey, delta) {
    const [year, month] = monthKey.split("-").map(Number);
    return getHealthMonthKey(new Date(year, month - 1 + delta, 1));
}

function getAllHealthEvents(catId) {
    return getCatHealth(catId).medicalEvents || [];
}

function getHealthEventDate(event) {
    return event.nextDate || event.date;
}

function getUpcomingHealthEvents(catId) {
    const today = getTodayKey();
    return getAllHealthEvents(catId)
        .filter(event => getHealthEventDate(event) >= today)
        .sort((a, b) => getHealthEventDate(a).localeCompare(getHealthEventDate(b)));
}

function getHealthProfileSummary(cat) {
    const profile = getCatHealth(cat.id);
    return {
        avatar: profile.avatar || "🐈",
        gender: profile.gender || "",
        nextEvent: getUpcomingHealthEvents(cat.id)[0] || null
    };
}

function openHealthCalendar() {
    const cat = getActiveCat();
    if (!cat) return;
    healthCalendarMonth = getHealthMonthKey(new Date());
    renderHealthCalendar(cat.id);
}

function openHealthProfile() {
    const cat = getActiveCat();
    if (!cat) return;
    renderHealthCalendar(cat.id, true);
}

function renderHealthCalendar(catId, profileFocus = false) {
    const content = document.getElementById("content");
    const cat = getCats().find(item => item.id === catId);
    if (!content || !cat) return;

    const health = getCatHealth(catId);
    const month = healthCalendarMonth || getHealthMonthKey(new Date());
    const [year, monthNumber] = month.split("-").map(Number);
    const firstDay = new Date(year, monthNumber - 1, 1);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const events = health.medicalEvents || [];
    const eventDates = new Set();

    events.forEach(event => {
        if (event.date?.startsWith(month)) eventDates.add(event.date);
        if (event.nextDate?.startsWith(month)) eventDates.add(event.nextDate);
    });

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(`<div class="health-calendar-day empty"></div>`);
    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${month}-${String(day).padStart(2, "0")}`;
        cells.push(`
            <div class="health-calendar-day ${key === getTodayKey() ? "today" : ""} ${eventDates.has(key) ? "has-event" : ""}">
                <span>${day}</span>
                ${eventDates.has(key) ? `<i></i>` : ""}
            </div>
        `);
    }

    const upcoming = getUpcomingHealthEvents(catId).slice(0, 5);

    content.innerHTML = `
        <div class="history-header">
            <button class="back-button" onclick="renderApp()">← Назад</button>
            <h1>Здоровье</h1>
        </div>

        <div class="health-profile-card card">
            <button class="health-avatar" onclick="chooseCatAvatar()" aria-label="Изменить фото">
                ${health.avatar || "🐈"}
            </button>
            <div class="health-profile-info">
                <h2>${escapeHtml(cat.name)}</h2>
                <p>${escapeHtml(getCatAgeText(cat))}${health.gender ? ` · ${escapeHtml(health.gender)}` : ""}</p>
            </div>
            <button class="health-profile-edit" onclick="editHealthProfile()">Изменить</button>
        </div>

        ${profileFocus ? renderHealthProfileForm(cat, health) : ""}

        <div class="health-calendar card">
            <div class="health-calendar-header">
                <button onclick="changeHealthMonth(-1)" aria-label="Предыдущий месяц">‹</button>
                <strong>${escapeHtml(getHealthMonthName(month))}</strong>
                <button onclick="changeHealthMonth(1)" aria-label="Следующий месяц">›</button>
            </div>
            <div class="health-calendar-weekdays">
                <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
            </div>
            <div class="health-calendar-grid">${cells.join("")}</div>
        </div>

        <div class="section-title">Медицинские события</div>
        <div class="health-events">
            ${events.length ? events.sort((a,b) => (a.date || "").localeCompare(b.date || "")).map(renderHealthEvent).join("") : `
                <div class="card health-empty">Добавьте вакцинацию, обработку или другую процедуру.</div>
            `}
        </div>

        <button class="button" onclick="openHealthEventForm()">＋ Добавить событие</button>

        ${upcoming.length ? `
            <div class="section-title">Предстоящие</div>
            <div class="health-upcoming card">
                ${upcoming.map(event => `
                    <div class="health-upcoming-item">
                        <span>${escapeHtml(getHealthEventTypeLabel(event.type))}</span>
                        <strong>${formatShortDate(getHealthEventDate(event))}</strong>
                    </div>
                `).join("")}
            </div>
        ` : ""}
    `;
}

function renderHealthProfileForm(cat, health) {
    return `
        <div class="card health-profile-form">
            <div class="form-field">
                <label class="form-label">Пол</label>
                <select id="healthGender" class="input">
                    <option value="" ${!health.gender ? "selected" : ""}>Не указан</option>
                    <option value="Кот" ${health.gender === "Кот" ? "selected" : ""}>Кот</option>
                    <option value="Кошка" ${health.gender === "Кошка" ? "selected" : ""}>Кошка</option>
                </select>
            </div>
            <div class="health-photo-note">Нажмите на аватар выше, чтобы выбрать фото.</div>
            <button class="button" onclick="saveHealthProfile()">Сохранить</button>
        </div>
    `;
}

function editHealthProfile() {
    renderHealthCalendar(getActiveCatId(), true);
}

function saveHealthProfile() {
    const cat = getActiveCat();
    if (!cat) return;
    const profile = getCatHealth(cat.id);
    profile.gender = document.getElementById("healthGender")?.value || "";
    saveCatHealth(cat.id, profile);
    renderHealthCalendar(cat.id);
}

function chooseCatAvatar() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = event => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const cat = getActiveCat();
            if (!cat) return;
            const profile = getCatHealth(cat.id);
            profile.avatar = reader.result;
            saveCatHealth(cat.id, profile);
            renderHealthCalendar(cat.id);
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function openHealthEventForm(eventId = "") {
    const cat = getActiveCat();
    if (!cat) return;
    const existing = getAllHealthEvents(cat.id).find(event => event.id === eventId);
    closeHealthEventForm();

    const modal = document.createElement("div");
    modal.id = "healthEventModal";
    modal.className = "health-event-modal active";
    modal.innerHTML = `
        <div class="health-event-overlay" onclick="closeHealthEventForm()"></div>
        <div class="health-event-dialog">
            <button class="health-event-close" onclick="closeHealthEventForm()">×</button>
            <h2>${existing ? "Медицинское событие" : "Новое событие"}</h2>
            <div class="form-field">
                <label class="form-label">Тип</label>
                <select id="healthEventType" class="input">
                    ${[
                        ["vaccination", "Вакцинация"],
                        ["parasite", "Обработка от паразитов"],
                        ["sterilization", "Стерилизация"],
                        ["dental", "Уход за зубами"],
                        ["other", "Другое"]
                    ].map(([value, label]) => `<option value="${value}" ${existing?.type === value ? "selected" : ""}>${label}</option>`).join("")}
                </select>
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
            <button class="button" onclick="saveHealthEvent('${eventId}')">Сохранить</button>
            ${existing ? `<button class="button button-secondary" onclick="deleteHealthEvent('${eventId}')">Удалить</button>` : ""}
        </div>
    `;
    document.body.appendChild(modal);
}

function closeHealthEventForm() {
    document.getElementById("healthEventModal")?.remove();
}

function saveHealthEvent(eventId) {
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
    healthCalendarMonth = event.nextDate?.slice(0, 7) || event.date.slice(0, 7);
    renderHealthCalendar(cat.id);
}

function deleteHealthEvent(eventId) {
    const cat = getActiveCat();
    if (!cat) return;
    const profile = getCatHealth(cat.id);
    profile.medicalEvents = profile.medicalEvents.filter(event => event.id !== eventId);
    saveCatHealth(cat.id, profile);
    closeHealthEventForm();
    renderHealthCalendar(cat.id);
}

function changeHealthMonth(delta) {
    healthCalendarMonth = shiftHealthMonth(
        healthCalendarMonth || getHealthMonthKey(new Date()),
        delta
    );
    renderHealthCalendar(getActiveCatId());
}

function renderHealthEvent(event) {
    return `
        <div class="card health-event-card" onclick="openHealthEventForm('${event.id}')">
            <div class="health-event-main">
                <strong>${escapeHtml(getHealthEventTypeLabel(event.type))}</strong>
                ${event.note ? `<span>${escapeHtml(event.note)}</span>` : ""}
            </div>
            <div class="health-event-dates">
                <span>${formatHealthDate(event.date)}</span>
                ${event.nextDate ? `<small>Следующая: ${formatHealthDate(event.nextDate)}</small>` : ""}
                <small>Напомнить за ${event.reminderDays || 14} дн.</small>
            </div>
        </div>
    `;
}
