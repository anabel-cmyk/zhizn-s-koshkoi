// 0.9.4 — Calendar
// Presentation layer only: reads diary/health data and delegates mutations to their owners.
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

    function ensureSwitcher() {
        const content = document.getElementById("content");
        if (!content || mode !== "progress") return;
        const header = content.querySelector(".history-header");
        if (!header) return;
        const cats = content.querySelector(".diary-cat-switcher");
        let tabs = content.querySelector(".diary-mode-switcher");
        if (!tabs) {
            const holder = document.createElement("div");
            holder.innerHTML = switcher();
            tabs = holder.firstElementChild;
        } else {
            tabs.outerHTML = switcher();
            tabs = content.querySelector(".diary-mode-switcher");
        }
        if (cats) {
            header.insertAdjacentElement("afterend", cats);
            cats.insertAdjacentElement("afterend", tabs);
        } else {
            header.insertAdjacentElement("afterend", tabs);
        }
    }

    function getHealthEvents(catId) {
        return typeof getAllHealthEvents === "function" ? getAllHealthEvents(catId) : [];
    }

    function healthCalendar(cat) {
        const events = getHealthEvents(cat.id);
        const key = window.diaryHealthMonth || getTodayKey().slice(0, 7);
        window.diaryHealthMonth = key;
        const [year, month] = key.split("-").map(Number);
        const first = new Date(year, month - 1, 1);
        const days = new Date(year, month, 0).getDate();
        const offset = (first.getDay() + 6) % 7;
        const cells = [];
        for (let i = 0; i < offset; i++) cells.push(`<div class="diary-health-day empty"></div>`);
        for (let d = 1; d <= days; d++) {
            const date = `${key}-${String(d).padStart(2, "0")}`;
            const dayEvents = events.filter(e => e.date === date || e.nextDate === date);
            const emojis = [...new Set(dayEvents.map(e => typeof getHealthEventEmoji === "function" ? getHealthEventEmoji(e) : (e.emoji || "🩺")))];
            cells.push(`<button type="button" class="diary-health-day ${date === getTodayKey() ? "today" : ""} ${dayEvents.length ? "has-events" : ""}" onclick="window.openDiaryHealthDate('${date}')"><span>${d}</span>${emojis.length ? `<small>${emojis.join("")}</small>` : ""}</button>`);
        }
        const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(first);
        return `<div class="card diary-health-calendar"><div class="diary-health-calendar-header"><button type="button" onclick="window.shiftDiaryHealthMonth(-1)">‹</button><strong>${escapeHtml(monthName)}</strong><button type="button" onclick="window.shiftDiaryHealthMonth(1)">›</button></div><div class="diary-health-weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="diary-health-grid">${cells.join("")}</div></div><div id="diaryHealthDateEvents"></div>`;
    }

    function renderCalendar() {
        const content = document.getElementById("content");
        const cat = currentCat();
        if (!content || !cat) return;
        content.innerHTML = `<div class="history-header"><button class="back-button" onclick="renderApp()">← Назад</button><h1>Дневник</h1></div>${typeof createDiaryCatSwitcher === "function" ? createDiaryCatSwitcher() : ""}${switcher()}<div class="diary-subtitle">Календарь здоровья <strong>${escapeHtml(cat.name)}</strong></div>${healthCalendar(cat)}<button type="button" class="button diary-add-health" onclick="window.openHealthEventForm ? window.openHealthEventForm() : window.openDiaryHealthEventForm()">＋ Добавить событие</button>`;
    }

    window.setDiarySubsection = function (next) {
        mode = next === "calendar" ? "calendar" : "progress";
        if (mode === "calendar") {
            renderCalendar();
            return;
        }
        if (typeof window.__diaryOriginalOpenHistory === "function") {
            window.__diaryOriginalOpenHistory();
            setTimeout(ensureSwitcher, 0);
        }
    };

    window.shiftDiaryHealthMonth = function (delta) {
        const key = window.diaryHealthMonth || getTodayKey().slice(0, 7);
        const [y, m] = key.split("-").map(Number);
        const d = new Date(y, m - 1 + delta, 1);
        window.diaryHealthMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        renderCalendar();
    };

    window.openDiaryHealthDate = function (date) {
        const cat = currentCat();
        if (!cat) return;
        const dayEvents = getHealthEvents(cat.id).filter(e => e.date === date || e.nextDate === date);
        const target = document.getElementById("diaryHealthDateEvents");
        if (!target) return;
        const title = typeof formatHealthDate === "function" ? formatHealthDate(date) : date;
        target.innerHTML = `<div class="section-title">${escapeHtml(title)}</div>${dayEvents.length ? dayEvents.map(e => `<div class="card health-event-card" onclick="${typeof window.openHealthEventForm === "function" ? `window.openHealthEventForm('${e.id}')` : `window.openDiaryHealthEventForm('${e.id}')`}"><div><strong>${escapeHtml(typeof getHealthEventEmoji === "function" ? getHealthEventEmoji(e) : (e.emoji || "🩺"))} ${escapeHtml(e.title || (typeof getHealthEventTypeLabel === "function" ? getHealthEventTypeLabel(e.type) : "Медицинское событие"))}</strong>${e.note ? `<div class="health-event-note">${escapeHtml(e.note)}</div>` : ""}</div><div>${e.nextDate ? `<small>Следующая: ${typeof formatHealthShortDate === "function" ? formatHealthShortDate(e.nextDate) : e.nextDate}</small>` : ""}</div></div>`).join("") : `<div class="card health-empty">На этот день медицинских событий нет.</div>`}`;
    };

    const original = window.openHistory;
    window.__diaryOriginalOpenHistory = original;
    window.openHistory = function () {
        mode = "progress";
        if (typeof window.__diaryOriginalOpenHistory === "function") {
            window.__diaryOriginalOpenHistory();
            setTimeout(ensureSwitcher, 0);
        }
    };

    if (document.readyState !== "loading") setTimeout(ensureSwitcher, 0);
    else document.addEventListener("DOMContentLoaded", () => setTimeout(ensureSwitcher, 0), { once: true });
})();
