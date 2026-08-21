// ========================================
// 0.9.3 — DIARY: PROGRESS / CALENDAR
// Health is integrated into the Diary.
// ========================================

let diaryViewMode = "progress";

const HEALTH_EVENT_DEFAULTS = {
    vaccination: { label: "Вакцинация", emoji: "💉" },
    endoparasite: { label: "Эндопаразиты", emoji: "🪱" },
    ectoparasite: { label: "Эктопаразиты", emoji: "🦟" },
    dental_cleaning: { label: "Ультразвуковая чистка зубов под наркозом", emoji: "🦷" },
    medicine: { label: "Лечение / лекарство", emoji: "💊" },
    other: { label: "Другое", emoji: "🩺" }
};

function getHealthEventMeta(event) {
    const fallback = HEALTH_EVENT_DEFAULTS[event.type] || HEALTH_EVENT_DEFAULTS.other;
    return {
        label: fallback.label,
        emoji: event.emoji || fallback.emoji
    };
}

function getDiaryCalendarCatId() {
    const selected = diarySelectedCatId || getActiveCatId();
    return selected === "all" ? null : selected;
}

function getDiaryCalendarEvents(catId, monthKey) {
    if (!catId || typeof getAllHealthEvents !== "function") return {};

    const result = {};
    getAllHealthEvents(catId).forEach(event => {
        const meta = getHealthEventMeta(event);
        [
            { date: event.date, kind: "past" },
            { date: event.nextDate, kind: "future" }
        ].forEach(item => {
            if (!item.date || !item.date.startsWith(monthKey)) return;
            if (!result[item.date]) result[item.date] = [];
            result[item.date].push({ event, kind: item.kind, meta });
        });
    });
    return result;
}

function renderDiaryCalendarView() {
    const content = document.getElementById("content");
    const cats = getCats();
    if (!content || !cats.length) return;

    const selected = diarySelectedCatId || getActiveCatId();
    const cat = selected === "all" ? null : cats.find(item => item.id === selected) || getActiveCat();
    const monthKey = window.diaryCalendarMonth || getHealthMonthKey(new Date());
    const [year, month] = monthKey.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7;
    const eventsByDate = cat ? getDiaryCalendarEvents(cat.id, monthKey) : {};
    const cells = [];

    for (let i = 0; i < offset; i++) cells.push(`<div class="diary-calendar-day empty"></div>`);

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${monthKey}-${String(day).padStart(2, "0")}`;
        const dayEvents = eventsByDate[key] || [];
        const isToday = key === getTodayKey();
        const emojis = [...new Map(dayEvents.map(item => [item.event.id + item.kind, item])).values()];

        cells.push(`
            <button class="diary-calendar-day ${isToday ? "today" : ""} ${emojis.length ? "has-events" : ""}"
                    onclick="openDiaryCalendarDay('${key}')">
                <span class="diary-calendar-number">${day}</span>
                ${emojis.length ? `<span class="diary-calendar-emojis">${emojis.slice(0, 3).map(item => `<span>${item.meta.emoji}</span>`).join("")}</span>` : ""}
            </button>
        `);
    }

    content.innerHTML = `
        <div class="history-header">
            <button class="back-button" onclick="renderApp()">← Назад</button>
            <h1>Дневник</h1>
        </div>

        ${createDiaryCatSwitcher()}

        ${renderDiaryViewToggle()}

        <div class="diary-calendar-caption">
            ${cat ? `Календарь здоровья · <strong>${escapeHtml(cat.name)}</strong>` : "Календарь здоровья"}
        </div>

        <div class="diary-calendar card">
            <div class="diary-calendar-header">
                <button onclick="changeDiaryCalendarMonth(-1)" aria-label="Предыдущий месяц">‹</button>
                <strong>${escapeHtml(getHealthMonthName(monthKey))}</strong>
                <button onclick="changeDiaryCalendarMonth(1)" aria-label="Следующий месяц">›</button>
            </div>
            <div class="diary-calendar-weekdays">
                <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
            </div>
            <div class="diary-calendar-grid">${cells.join("")}</div>
        </div>

        <div class="section-title">Предстоящие</div>
        ${renderDiaryUpcomingEvents(cat)}
        <button class="button" onclick="openDiaryHealthEventForm()">＋ Добавить событие</button>
    `;
}

function renderDiaryViewToggle() {
    return `
        <div class="diary-view-toggle" role="tablist" aria-label="Режим дневника">
            <button class="${diaryViewMode === "progress" ? "active" : ""}" onclick="setDiaryViewMode('progress')">Прогресс</button>
            <button class="${diaryViewMode === "calendar" ? "active" : ""}" onclick="setDiaryViewMode('calendar')">Календарь</button>
        </div>
    `;
}

function setDiaryViewMode(mode) {
    diaryViewMode = mode === "calendar" ? "calendar" : "progress";
    if (diaryViewMode === "calendar") renderDiaryCalendarView();
    else openDiaryProgress();
}

function openDiaryProgress() {
    diaryViewMode = "progress";
    originalOpenHistory();
    const header = document.querySelector(".history-header");
    if (!header) return;
    const toggle = document.createElement("div");
    toggle.innerHTML = renderDiaryViewToggle();
    header.insertAdjacentElement("afterend", toggle.firstElementChild);
}

function openDiaryCalendarDay(dateKey) {
    const catId = getDiaryCalendarCatId();
    const events = catId ? getDiaryCalendarEvents(catId, dateKey.slice(0, 7))[dateKey] || [] : [];
    const healthEvents = events.map(item => `
        <button class="diary-calendar-event" onclick="openDiaryHealthEventForm('${item.event.id}')">
            <span class="diary-calendar-event-emoji">${item.meta.emoji}</span>
            <span>
                <strong>${escapeHtml(item.meta.label)}</strong>
                ${item.kind === "future" ? `<small>Следующая дата · ${formatHealthDate(dateKey)}</small>` : `<small>${formatHealthDate(dateKey)}</small>`}
            </span>
        </button>
    `).join("");

    const existing = document.getElementById("diaryDayModal");
    existing?.remove();

    const modal = document.createElement("div");
    modal.id = "diaryDayModal";
    modal.className = "health-event-modal active";
    modal.innerHTML = `
        <div class="health-event-overlay" onclick="document.getElementById('diaryDayModal')?.remove()"></div>
        <div class="health-event-dialog diary-day-dialog">
            <button class="health-event-close" onclick="document.getElementById('diaryDayModal')?.remove()">×</button>
            <h2>${getRelativeDiaryLabel(dateKey) === dateKey ? formatHealthDate(dateKey) : getRelativeDiaryLabel(dateKey)}</h2>
            ${healthEvents || `<div class="health-empty">На этот день медицинских событий нет.</div>`}
        </div>
    `;
    document.body.appendChild(modal);
}

function renderDiaryUpcomingEvents(cat) {
    if (!cat || typeof getUpcomingHealthEvents !== "function") {
        return `<div class="card health-empty">Выберите кошку, чтобы увидеть события.</div>`;
    }

    const events = getUpcomingHealthEvents(cat.id).slice(0, 5);
    if (!events.length) return `<div class="card health-empty">Предстоящих медицинских событий нет.</div>`;

    return `<div class="card diary-upcoming-list">
        ${events.map(event => {
            const meta = getHealthEventMeta(event);
            return `<button class="diary-upcoming-item" onclick="openDiaryHealthEventForm('${event.id}')">
                <span class="diary-upcoming-emoji">${meta.emoji}</span>
                <span><strong>${escapeHtml(meta.label)}</strong><small>${formatHealthDate(event.nextDate || event.date)}</small></span>
            </button>`;
        }).join("")}
    </div>`;
}

function changeDiaryCalendarMonth(delta) {
    window.diaryCalendarMonth = shiftHealthMonth(window.diaryCalendarMonth || getHealthMonthKey(new Date()), delta);
    renderDiaryCalendarView();
}

function openDiaryHealthEventForm(eventId = "") {
    openHealthEventForm(eventId);
}

// Keep the existing Progress diary untouched; only wrap its entry point.
const originalOpenHistory = window.openHistory;
window.openHistory = function() {
    if (diaryViewMode === "calendar") renderDiaryCalendarView();
    else openDiaryProgress();
};

// The dashboard Health shortcut opens Diary → Calendar.
window.openHealthCalendar = function() {
    diarySelectedCatId = getActiveCatId();
    diaryViewMode = "calendar";
    window.diaryCalendarMonth = getHealthMonthKey(new Date());
    renderDiaryCalendarView();
};

// Remove the old one-time sterilization option from existing stored data.
function migrateHealthEventTypes() {
    const data = getHealthData();
    let changed = false;
    Object.values(data).forEach(profile => {
        (profile.medicalEvents || []).forEach(event => {
            if (event.type === "parasite") {
                event.type = "endoparasite";
                changed = true;
            }
            if (event.type === "dental") {
                event.type = "dental_cleaning";
                changed = true;
            }
            if (event.type === "sterilization") {
                profile.medicalEvents = profile.medicalEvents.filter(item => item.id !== event.id);
                changed = true;
            }
        });
    });
    if (changed) saveHealthData(data);
}

document.addEventListener("DOMContentLoaded", migrateHealthEventTypes);
