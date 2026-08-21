// ========================================
// 0.9.3 — DIARY SUBSECTIONS
// Progress = existing Diary. Calendar = existing Health calendar.
// ========================================
(function () {
    let mode = "progress";

    function currentCat() {
        const cats = getCats();
        if (!cats.length) return null;
        const id = diarySelectedCatId || getActiveCatId();
        return id === "all" ? getActiveCat() : (cats.find(c => c.id === id) || getActiveCat());
    }

    function switcher() {
        return `<div class="diary-mode-switcher" role="tablist" aria-label="Раздел дневника">
            <button type="button" class="diary-mode-button ${mode === "progress" ? "active" : ""}" onclick="window.setDiarySubsection('progress')">Прогресс</button>
            <button type="button" class="diary-mode-button ${mode === "calendar" ? "active" : ""}" onclick="window.setDiarySubsection('calendar')">Календарь</button>
        </div>`;
    }

    function healthCalendar(cat) {
        const health = getCatHealth(cat.id);
        const events = Array.isArray(health.medicalEvents) ? health.medicalEvents : [];
        const key = window.diaryHealthMonth || getHealthMonthKey(new Date());
        window.diaryHealthMonth = key;
        const [year, month] = key.split("-").map(Number);
        const first = new Date(year, month - 1, 1);
        const days = new Date(year, month, 0).getDate();
        const offset = (first.getDay() + 6) % 7;
        const typeInfo = {
            vaccination: ["💉", "Вакцинация"],
            endo: ["🪱", "Эндопаразиты"],
            ecto: ["🦟", "Эктопаразиты"],
            parasite: ["🪱", "Обработка от паразитов"],
            dental: ["🦷", "Ультразвуковая чистка зубов под наркозом"],
            dental_cleaning: ["🦷", "Ультразвуковая чистка зубов под наркозом"],
            medicine: ["💊", "Лечение / лекарство"],
            other: ["🩺", "Другое"]
        };
        const getInfo = e => typeInfo[e.type] || [e.emoji || "🩺", e.title || "Медицинское событие"];
        const cells = [];
        for (let i = 0; i < offset; i++) cells.push(`<div class="diary-health-day empty"></div>`);
        for (let d = 1; d <= days; d++) {
            const date = `${key}-${String(d).padStart(2, "0")}`;
            const dayEvents = events.filter(e => e.date === date || e.nextDate === date);
            const emojis = [...new Set(dayEvents.map(e => getInfo(e)[0]))];
            cells.push(`<button type="button" class="diary-health-day ${date === getTodayKey() ? "today" : ""} ${dayEvents.length ? "has-events" : ""}" onclick="window.openDiaryHealthDate('${date}')"><span>${d}</span>${emojis.length ? `<small>${emojis.join("")}</small>` : ""}</button>`);
        }
        const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(first);
        return `<div class="card diary-health-calendar">
            <div class="diary-health-calendar-header"><button type="button" onclick="window.shiftDiaryHealthMonth(-1)">‹</button><strong>${escapeHtml(monthName)}</strong><button type="button" onclick="window.shiftDiaryHealthMonth(1)">›</button></div>
            <div class="diary-health-weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>
            <div class="diary-health-grid">${cells.join("")}</div>
        </div>
        <div id="diaryHealthDateEvents"></div>`;
    }

    window.setDiarySubsection = function (next) {
        mode = next === "calendar" ? "calendar" : "progress";
        render();
    };

    window.shiftDiaryHealthMonth = function (delta) {
        const key = window.diaryHealthMonth || getHealthMonthKey(new Date());
        window.diaryHealthMonth = shiftHealthMonth(key, delta);
        render();
    };

    window.openDiaryHealthDate = function (date) {
        const cat = currentCat();
        if (!cat) return;
        const events = getCatHealth(cat.id).medicalEvents || [];
        const dayEvents = events.filter(e => e.date === date || e.nextDate === date);
        const info = e => ({ vaccination:["💉","Вакцинация"],endo:["🪱","Эндопаразиты"],ecto:["🦟","Эктопаразиты"],parasite:["🪱","Обработка от паразитов"],dental:["🦷","Ультразвуковая чистка зубов под наркозом"],dental_cleaning:["🦷","Ультразвуковая чистка зубов под наркозом"],medicine:["💊","Лечение / лекарство"],other:["🩺","Другое"] }[e.type] || [e.emoji || "🩺", e.title || "Медицинское событие"]);
        const target = document.getElementById("diaryHealthDateEvents");
        if (!target) return;
        const title = new Intl.DateTimeFormat("ru-RU", { day:"numeric", month:"long", year:"numeric" }).format(new Date(`${date}T12:00:00`));
        target.innerHTML = `<div class="section-title">${escapeHtml(title)}</div>${dayEvents.length ? dayEvents.map(e => { const [emoji,name]=info(e); return `<div class="card health-event-card"><div><strong>${emoji} ${escapeHtml(e.title || name)}</strong>${e.note ? `<div class="health-event-note">${escapeHtml(e.note)}</div>` : ""}</div><div>${e.nextDate ? `<small>Следующая: ${formatShortDate(e.nextDate)}</small>` : ""}</div></div>`; }).join("") : `<div class="card health-empty">На этот день медицинских событий нет.</div>`}`;
    };

    function render() {
        const content = document.getElementById("content");
        if (!content) return;
        const cats = getCats();
        if (!cats.length) return;
        const cat = currentCat();
        if (!cat) return;
        // Always render the existing Diary first. This keeps all current Progress UI untouched.
        if (mode === "progress") {
            window.__diarySubsectionRendering = true;
            window.__diaryOriginalOpenHistory();
            window.__diarySubsectionRendering = false;
            const header = content.querySelector(".diary-cat-switcher");
            if (header && !content.querySelector(".diary-mode-switcher")) header.insertAdjacentHTML("afterend", switcher());
            return;
        }
        content.innerHTML = `<div class="history-header"><button class="back-button" onclick="renderApp()">← Назад</button><h1>Дневник</h1></div>${createDiaryCatSwitcher()}${switcher()}<div class="diary-subtitle">Здоровье <strong>${escapeHtml(cat.name)}</strong></div>${healthCalendar(cat)}<button class="button diary-add-health" onclick="openHealthEventForm()">＋ Добавить событие</button>`;
    }

    const original = window.openHistory;
    window.__diaryOriginalOpenHistory = original;
    window.openHistory = function () {
        if (window.__diarySubsectionRendering) return original();
        render();
    };

    document.addEventListener("DOMContentLoaded", () => {
        // Do not alter the user's existing Progress data or date formatting.
        setTimeout(() => {
            const content = document.getElementById("content");
            if (content && content.querySelector(".diary-cat-switcher") && !content.querySelector(".diary-mode-switcher")) {
                content.querySelector(".diary-cat-switcher").insertAdjacentHTML("afterend", switcher());
            }
        }, 0);
    });
})();
