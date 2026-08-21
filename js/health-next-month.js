// ========================================
// 0.9.3 — NEXT MONTH PREVIEW
// ========================================

function renderHealthMonthPreview(catId, monthKey) {
    const [year, monthNumber] = monthKey.split("-").map(Number);
    const firstDay = new Date(year, monthNumber - 1, 1);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const events = getAllHealthEvents(catId);
    const eventDates = new Set();

    events.forEach(event => {
        if (event.date?.startsWith(monthKey)) eventDates.add(event.date);
        if (event.nextDate?.startsWith(monthKey)) eventDates.add(event.nextDate);
    });

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(`<div class="health-calendar-day empty"></div>`);

    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${monthKey}-${String(day).padStart(2, "0")}`;
        cells.push(`
            <div class="health-calendar-day ${eventDates.has(key) ? "has-event" : ""}">
                <span>${day}</span>
                ${eventDates.has(key) ? `<i></i>` : ""}
            </div>
        `);
    }

    return `
        <div class="health-calendar health-calendar-next card">
            <div class="health-calendar-header">
                <strong>${escapeHtml(getHealthMonthName(monthKey))}</strong>
            </div>
            <div class="health-calendar-weekdays">
                <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
            </div>
            <div class="health-calendar-grid">${cells.join("")}</div>
        </div>
    `;
}

function addHealthNextMonthPreview() {
    const calendar = document.querySelector(".health-calendar:not(.health-calendar-next)");
    if (!calendar || document.querySelector(".health-calendar-next")) return;

    const catId = getActiveCatId();
    if (!catId) return;

    const current = healthCalendarMonth || getHealthMonthKey(new Date());
    const next = shiftHealthMonth(current, 1);
    calendar.insertAdjacentHTML("afterend", renderHealthMonthPreview(catId, next));
}

const healthNextMonthObserver = new MutationObserver(() => {
    addHealthNextMonthPreview();
});

document.addEventListener("DOMContentLoaded", () => {
    healthNextMonthObserver.observe(document.getElementById("content"), {
        childList: true,
        subtree: true
    });
});
