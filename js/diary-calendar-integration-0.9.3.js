// 0.9.3 — Calendar is a real subsection of Diary
(function () {
    const originalOpenHistory = window.openHistory;

    function isCalendarMode() {
        return typeof diaryMode !== "undefined" && diaryMode === "calendar";
    }

    window.setDiaryMode = function (mode) {
        diaryMode = mode === "calendar" ? "calendar" : "progress";
        originalOpenHistory();
        if (isCalendarMode()) renderCalendarView();
        else injectDiaryModes();
    };

    function injectDiaryModes() {
        const header = document.querySelector(".diary-cat-switcher");
        if (!header || document.querySelector(".diary-mode-switcher")) return;
        header.insertAdjacentHTML("afterend", createDiaryModeSwitcher());
    }

    function renderCalendarView() {
        const content = document.getElementById("content");
        if (!content) return;
        const cats = getCats();
        if (!cats.length) { renderEmptyState(); return; }
        const selected = diarySelectedCatId || getActiveCatId();
        const cat = selected !== "all" ? (cats.find(c => c.id === selected) || getActiveCat()) : getActiveCat();
        if (!cat) { renderEmptyState(); return; }
        content.innerHTML = `<div class="history-header"><button class="back-button" onclick="renderApp()">← Назад</button><h1>Дневник</h1></div>${createDiaryCatSwitcher()}${createDiaryModeSwitcher()}${renderDiaryCalendar()}`;
    }

    window.openHistory = function () {
        originalOpenHistory();
        if (isCalendarMode()) renderCalendarView();
        else injectDiaryModes();
    };

    document.addEventListener("DOMContentLoaded", () => {
        if (typeof diaryMode !== "undefined") diaryMode = "progress";
        setTimeout(() => injectDiaryModes(), 0);
    });
})();
