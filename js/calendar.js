// ЖИЗНЬ С КОШКОЙ
// CALENDAR.JS
// 0.9.5
// Presentation layer: care data comes from diary/history, medical data from health.js.
(function () {
    let mode = "progress";
    let healthMonth = null;

    function selectedId() { return diarySelectedCatId || getActiveCatId(); }
    function calendarCats() {
        const cats = getCats();
        const id = selectedId();
        if (id === "all") return cats;
        const cat = cats.find(c => c.id === id) || getActiveCat();
        return cat ? [cat] : [];
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
        if (!tabs) { const holder = document.createElement("div"); holder.innerHTML = switcher(); tabs = holder.firstElementChild; }
        else { tabs.outerHTML = switcher(); tabs = content.querySelector(".diary-mode-switcher"); }
        if (cats) { header.insertAdjacentElement("afterend", cats); cats.insertAdjacentElement("afterend", tabs); }
        else header.insertAdjacentElement("afterend", tabs);
    }
    function getMonthKey() { return healthMonth || window.diaryHealthMonth || getTodayKey().slice(0, 7); }
    function getHealthEventsForCats(cats) {
        const result = [];
        cats.forEach(cat => {
            const events = typeof getAllHealthEvents === "function" ? getAllHealthEvents(cat.id) : [];
            events.forEach(event => result.push({ ...event, catId: cat.id, catName: cat.name }));
        });
        return result;
    }
    function getCareEventsForDate(cats, date) {
        const history = typeof getHistory === "function" ? getHistory() : {};
        const result = [];
        cats.forEach(cat => {
            const catHistory = typeof getCatHistory === "function" ? getCatHistory(history, cat.id) : (history[cat.id] || {});
            (catHistory?.[date]?.tasks || []).forEach(task => {
                if (task.done === true) result.push({ id: `care_${cat.id}_${date}_${task.id}`, type: "care", title: task.name || "Уход", emoji: task.icon || "🐾", catId: cat.id, catName: cat.name });
            });
        });
        return result;
    }
    function healthCalendar(cats) {
        const key = getMonthKey(); healthMonth = key; window.diaryHealthMonth = key;
        const [year, month] = key.split("-").map(Number);
        const first = new Date(year, month - 1, 1);
        const days = new Date(year, month, 0).getDate();
        const offset = (first.getDay() + 6) % 7;
        const healthEvents = getHealthEventsForCats(cats);
        const cells = [];
        for (let i = 0; i < offset; i++) cells.push(`<div class="diary-health-day empty"></div>`);
        for (let d = 1; d <= days; d++) {
            const date = `${key}-${String(d).padStart(2, "0")}`;
            const events = [...healthEvents.filter(e => e.date === date || e.nextDate === date), ...getCareEventsForDate(cats, date)];
            const emojis = [...new Set(events.map(e => e.type === "care" ? e.emoji : (typeof getHealthEventEmoji === "function" ? getHealthEventEmoji(e) : (e.emoji || "🩺"))))];
            cells.push(`<button type="button" class="diary-health-day ${date === getTodayKey() ? "today" : ""} ${events.length ? "has-events" : ""}" onclick="window.openDiaryHealthDate('${date}')"><span>${d}</span>${emojis.length ? `<small>${emojis.join("")}</small>` : ""}</button>`);
        }
        const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(first);
        return `<div class="card diary-health-calendar"><div class="diary-health-calendar-header"><button type="button" onclick="window.shiftDiaryHealthMonth(-1)">‹</button><strong>${escapeHtml(monthName)}</strong><button type="button" onclick="window.shiftDiaryHealthMonth(1)">›</button></div><div class="diary-health-weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div><div class="diary-health-grid">${cells.join("")}</div></div><div id="diaryHealthDateEvents"></div>`;
    }
    function renderCalendar() {
        const content = document.getElementById("content"); const cats = calendarCats();
        if (!content || !cats.length) return;
        const id = selectedId(); const title = id === "all" ? "Все кошки" : cats[0].name;
        content.innerHTML = `<div class="history-header"><button class="back-button" onclick="renderApp()">← Назад</button><h1>Дневник</h1></div>${typeof createDiaryCatSwitcher === "function" ? createDiaryCatSwitcher() : ""}${switcher()}<div class="diary-subtitle">Календарь <strong>${escapeHtml(title)}</strong></div>${healthCalendar(cats)}<button type="button" class="button diary-add-health" onclick="window.openHealthEventForm()">＋ Добавить событие</button>`;
    }
    function eventCard(event) {
        const emoji = event.type === "care" ? event.emoji : (typeof getHealthEventEmoji === "function" ? getHealthEventEmoji(event) : (event.emoji || "🩺"));
        const title = event.title || (typeof getHealthEventTypeLabel === "function" ? getHealthEventTypeLabel(event.type) : "Медицинское событие");
        const cat = selectedId() === "all" ? `<small class="history-cat-name">${escapeHtml(event.catName || "")}</small>` : "";
        const editable = event.type !== "care";
        return `<div class="card health-event-card ${editable ? "calendar-editable-event" : ""}" ${editable ? `onclick="window.openHealthEventForm('${event.catId}','${event.id}')"` : ""}><div><strong>${escapeHtml(emoji)} ${escapeHtml(title)}</strong>${cat}${event.note ? `<div class="health-event-note">${escapeHtml(event.note)}</div>` : ""}</div><div>${event.nextDate ? `<small>Следующая: ${typeof formatHealthShortDate === "function" ? formatHealthShortDate(event.nextDate) : event.nextDate}</small>` : ""}</div></div>`;
    }
    window.setDiarySubsection = function (next) {
        mode = next === "calendar" ? "calendar" : "progress";
        if (mode === "calendar") { renderCalendar(); return; }
        if (typeof window.__diaryOriginalOpenHistory === "function") { window.__diaryOriginalOpenHistory(); setTimeout(ensureSwitcher, 0); }
    };
    window.shiftDiaryHealthMonth = function (delta) {
        const key = getMonthKey(); const [y, m] = key.split("-").map(Number); const d = new Date(y, m - 1 + delta, 1);
        healthMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; window.diaryHealthMonth = healthMonth; renderCalendar();
    };
    window.openDiaryHealthDate = function (date) {
        const cats = calendarCats();
        const events = [...getHealthEventsForCats(cats).filter(e => e.date === date || e.nextDate === date), ...getCareEventsForDate(cats, date)];
        const target = document.getElementById("diaryHealthDateEvents"); if (!target) return;
        const title = typeof formatHealthDate === "function" ? formatHealthDate(date) : date;
        target.innerHTML = `<div class="section-title">${escapeHtml(title)}</div>${events.length ? events.map(eventCard).join("") : `<div class="card health-empty">На этот день событий нет.</div>`}`;
    };
    window.openHealthEventForm = function (catId, eventId) {
        const cats = getCats(); const id = catId || (selectedId() === "all" ? "" : selectedId());
        const event = id && eventId && typeof getAllHealthEvents === "function" ? getAllHealthEvents(id).find(e => e.id === eventId) : null;
        const types = typeof getHealthEventTypes === "function" ? getHealthEventTypes() : [];
        const overlay = document.createElement("div"); overlay.className = "modal active calendar-event-modal"; overlay.setAttribute("aria-hidden", "false");
        overlay.innerHTML = `<div class="modal-content"><div class="modal-header"><h2>${event ? "Изменить событие" : "Новое событие"}</h2><button type="button" class="modal-close" onclick="this.closest('.calendar-event-modal').remove()">×</button></div><form class="form" id="calendarHealthForm"><div class="form-field"><label class="form-label">Кошка</label><select id="calendarEventCat" class="input" required>${cats.map(c => `<option value="${c.id}" ${c.id === id ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}</select></div><div class="form-field"><label class="form-label">Тип события</label><select id="calendarEventType" class="input">${types.map(t => `<option value="${t.id}" ${t.id === (event?.type || "vaccination") ? "selected" : ""}>${escapeHtml(t.emoji)} ${escapeHtml(t.name)}</option>`).join("")}</select></div><div class="form-field"><label class="form-label">Дата</label><input id="calendarEventDate" class="input" type="date" value="${event?.date || getTodayKey()}" required></div><div class="form-field"><label class="form-label">Следующая дата</label><input id="calendarEventNextDate" class="input" type="date" value="${event?.nextDate || ""}"></div><div class="form-field"><label class="form-label">Заметка</label><textarea id="calendarEventNote" class="input" rows="3" placeholder="По желанию">${escapeHtml(event?.note || "")}</textarea></div><div class="form-actions"><button type="submit" class="button">${event ? "Сохранить" : "Добавить"}</button>${event ? `<button type="button" class="delete-profile-button" id="calendarDeleteEvent">Удалить</button>` : ""}<button type="button" class="button button-secondary" onclick="this.closest('.calendar-event-modal').remove()">Отмена</button></div></form></div>`;
        document.body.appendChild(overlay);
        overlay.querySelector("#calendarHealthForm").addEventListener("submit", function (e) {
            e.preventDefault(); const targetCatId = overlay.querySelector("#calendarEventCat").value;
            const data = { type: overlay.querySelector("#calendarEventType").value, date: overlay.querySelector("#calendarEventDate").value, nextDate: overlay.querySelector("#calendarEventNextDate").value, note: overlay.querySelector("#calendarEventNote").value.trim() };
            if (!targetCatId || !data.date) return;
            if (eventId && targetCatId === id && typeof updateHealthEvent === "function") updateHealthEvent(targetCatId, eventId, data); else if (typeof createHealthEvent === "function") createHealthEvent(targetCatId, data);
            overlay.remove(); renderCalendar();
        });
        const deleteButton = overlay.querySelector("#calendarDeleteEvent");
        if (deleteButton) deleteButton.addEventListener("click", () => { if (!confirm("Удалить это событие?")) return; if (typeof deleteHealthEvent === "function") deleteHealthEvent(id, eventId); overlay.remove(); renderCalendar(); });
    };
    window.openDiaryHealthEventForm = window.openHealthEventForm;

    const original = window.openHistory; window.__diaryOriginalOpenHistory = original;
    window.openHistory = function () {
        if (mode === "calendar") { renderCalendar(); return; }
        if (typeof window.__diaryOriginalOpenHistory === "function") { window.__diaryOriginalOpenHistory(); setTimeout(ensureSwitcher, 0); }
    };
    if (document.readyState !== "loading") setTimeout(ensureSwitcher, 0);
    else document.addEventListener("DOMContentLoaded", () => setTimeout(ensureSwitcher, 0), { once: true });
})();
