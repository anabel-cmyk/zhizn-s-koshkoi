// 0.9.3 — Diary: Progress / Calendar
// Calendar is integrated into the existing Diary. No MutationObserver loop.
(function () {
    let mode = "progress";

    const eventTypes = {
        vaccination: ["💉", "Вакцинация"],
        endo: ["🪱", "Эндопаразиты"],
        ecto: ["🦟", "Эктопаразиты"],
        dental_cleaning: ["🦷", "Ультразвуковая чистка зубов под наркозом"],
        medicine: ["💊", "Лечение / лекарство"],
        other: ["🩺", "Другое"]
    };

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

    function healthCalendar(cat) {
        const health = typeof getCatHealth === "function" ? getCatHealth(cat.id) : {};
        const events = Array.isArray(health.medicalEvents) ? health.medicalEvents : [];
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
            const emojis = [...new Set(dayEvents.map(e => e.emoji || eventTypes[e.type]?.[0] || "🩺"))];
            cells.push(`<button type="button" class="diary-health-day ${date === getTodayKey() ? "today" : ""} ${dayEvents.length ? "has-events" : ""}" onclick="window.openDiaryHealthDate('${date}')"><span>${d}</span>${emojis.length ? `<small>${emojis.join("")}</small>` : ""}</button>`);
        }
        const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(first);
        return `<div class="card diary-health-calendar"><div class="diary-health-calendar-header"><button type="button" onclick="window.shiftDiaryHealthMonth(-1)">‹</button><strong>${escapeHtml(monthName)}</strong><button type="button" onclick="window.shiftDiaryHealthMonth(1)">›</button></div><div class="diary-health-weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="diary-health-grid">${cells.join("")}</div></div><div id="diaryHealthDateEvents"></div>`;
    }

    function renderCalendar() {
        const content = document.getElementById("content");
        const cat = currentCat();
        if (!content || !cat) return;
        content.innerHTML = `<div class="history-header"><button class="back-button" onclick="renderApp()">← Назад</button><h1>Дневник</h1></div>${typeof createDiaryCatSwitcher === "function" ? createDiaryCatSwitcher() : ""}${switcher()}<div class="diary-subtitle">Календарь здоровья <strong>${escapeHtml(cat.name)}</strong></div>${healthCalendar(cat)}<button type="button" class="button diary-add-health" onclick="window.openDiaryHealthEventForm()">＋ Добавить событие</button>`;
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
        const health = typeof getCatHealth === "function" ? getCatHealth(cat.id) : {};
        const events = Array.isArray(health.medicalEvents) ? health.medicalEvents : [];
        const dayEvents = events.filter(e => e.date === date || e.nextDate === date);
        const target = document.getElementById("diaryHealthDateEvents");
        if (!target) return;
        const title = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00`));
        target.innerHTML = `<div class="section-title">${escapeHtml(title)}</div>${dayEvents.length ? dayEvents.map(e => `<div class="card health-event-card" onclick="window.openDiaryHealthEventForm('${e.id}')"><div><strong>${escapeHtml(e.emoji || eventTypes[e.type]?.[0] || "🩺")} ${escapeHtml(e.title || eventTypes[e.type]?.[1] || "Медицинское событие")}</strong>${e.note ? `<div class="health-event-note">${escapeHtml(e.note)}</div>` : ""}</div><div>${e.nextDate ? `<small>Следующая: ${formatShortDate(e.nextDate)}</small>` : ""}</div></div>`).join("") : `<div class="card health-empty">На этот день медицинских событий нет.</div>`}`;
    };

    window.openDiaryHealthEventForm = function (eventId = "") {
        const cat = currentCat();
        if (!cat || typeof getCatHealth !== "function") return;
        const health = getCatHealth(cat.id);
        const existing = (health.medicalEvents || []).find(e => e.id === eventId);
        document.getElementById("diaryHealthEventModal")?.remove();
        const modal = document.createElement("div");
        modal.id = "diaryHealthEventModal";
        modal.className = "health-event-modal active";
        const emoji = existing?.emoji || eventTypes[existing?.type]?.[0] || "💉";
        modal.innerHTML = `<div class="health-event-overlay" onclick="this.parentElement.remove()"></div><div class="health-event-dialog"><button class="health-event-close" onclick="this.closest('.health-event-modal').remove()">×</button><h2>${existing ? "Медицинское событие" : "Новое событие"}</h2><div class="form-field"><label class="form-label">Тип</label><select id="diaryHealthType" class="input">${Object.entries(eventTypes).map(([value,[icon,label]]) => `<option value="${value}" ${existing?.type === value ? "selected" : ""}>${icon} ${label}</option>`).join("")}</select></div><div class="form-field"><label class="form-label">Эмодзи</label><select id="diaryHealthEmoji" class="input">${["💉","🪱","🦟","🦷","💊","🩺","❤️","⭐"].map(x => `<option value="${x}" ${emoji===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="form-field"><label class="form-label">Дата события</label><input id="diaryHealthDate" class="input" type="date" required value="${existing?.date || ""}"></div><div class="form-field"><label class="form-label">Следующая дата</label><input id="diaryHealthNextDate" class="input" type="date" value="${existing?.nextDate || ""}"></div><div class="form-field"><label class="form-label">Напомнить заранее</label><select id="diaryHealthReminder" class="input">${[1,3,7,14,30].map(days => `<option value="${days}" ${Number(existing?.reminderDays || 14)===days?"selected":""}>За ${days} ${days===1?"день":"дней"}</option>`).join("")}</select></div><div class="form-field"><label class="form-label">Комментарий</label><input id="diaryHealthNote" class="input" type="text" value="${escapeHtml(existing?.note || "")}"></div><button type="button" class="button" onclick="window.saveDiaryHealthEvent('${eventId}')">Сохранить</button>${existing ? `<button type="button" class="button button-secondary" onclick="window.deleteDiaryHealthEvent('${eventId}')">Удалить</button>` : ""}</div>`;
        document.body.appendChild(modal);
    };

    window.saveDiaryHealthEvent = function (eventId) {
        const cat = currentCat();
        if (!cat || typeof getCatHealth !== "function" || typeof saveCatHealth !== "function") return;
        const health = getCatHealth(cat.id);
        const type = document.getElementById("diaryHealthType")?.value || "other";
        const date = document.getElementById("diaryHealthDate")?.value;
        if (!date) { alert("Укажите дату события"); return; }
        const item = { id: eventId || `health_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type, title: eventTypes[type]?.[1] || "Медицинское событие", emoji: document.getElementById("diaryHealthEmoji")?.value || eventTypes[type]?.[0] || "🩺", date, nextDate: document.getElementById("diaryHealthNextDate")?.value || "", reminderDays: Number(document.getElementById("diaryHealthReminder")?.value || 14), note: document.getElementById("diaryHealthNote")?.value?.trim() || "" };
        const events = Array.isArray(health.medicalEvents) ? health.medicalEvents : [];
        const index = events.findIndex(e => e.id === item.id);
        if (index >= 0) events[index] = item; else events.push(item);
        health.medicalEvents = events;
        saveCatHealth(cat.id, health);
        document.getElementById("diaryHealthEventModal")?.remove();
        window.diaryHealthMonth = item.nextDate?.slice(0,7) || item.date.slice(0,7);
        renderCalendar();
    };

    window.deleteDiaryHealthEvent = function (eventId) {
        const cat = currentCat();
        if (!cat || typeof getCatHealth !== "function" || typeof saveCatHealth !== "function") return;
        const health = getCatHealth(cat.id);
        health.medicalEvents = (health.medicalEvents || []).filter(e => e.id !== eventId);
        saveCatHealth(cat.id, health);
        document.getElementById("diaryHealthEventModal")?.remove();
        renderCalendar();
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

    // Если Дневник уже открыт к моменту загрузки файла — просто добавляем вкладки один раз.
    if (document.readyState !== "loading") setTimeout(ensureSwitcher, 0);
    else document.addEventListener("DOMContentLoaded", () => setTimeout(ensureSwitcher, 0), { once: true });
})();
