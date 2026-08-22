// ========================================
// ЖИЗНЬ С КОШКОЙ
// APP.JS
// 0.9.4 — запуск, навигация и UI hooks
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    migrateOldCat();
    renderApp();
});

function renderApp() {
    const cats = getCats();
    if (!cats.length) {
        renderEmptyState();
        return;
    }
    renderCatDashboard(getActiveCat());
}

function renderEmptyState() {
    const content = document.getElementById("content");
    content.innerHTML = `<div class="welcome"><h1>Спокойная<br>жизнь с кошкой.</h1><p>Уход, здоровье и поведение — в одном месте.</p></div><div class="card empty"><div class="empty-icon">🐾</div><h2>Добавьте первую кошку</h2><p>Создадим её профиль и постепенно соберём всю важную информацию.</p><button class="button" onclick="openModal()">＋ Добавить кошку</button></div>`;
}

function renderCatDashboard(cat) {
    const content = document.getElementById("content");
    const tasks = getDailyTasks(cat.id);
    const profile = typeof getCatHealth === "function" ? getCatHealth(cat.id) : { avatar: "" };
    const avatar = cat.avatar || profile.avatar;
    const avatarMarkup = avatar
        ? `<img src="${avatar}" alt="${escapeHtml(cat.name)}" class="cat-avatar-image">`
        : "🐈";

    content.innerHTML = `<div class="welcome"><h1>Сегодня ${escapeHtml(cat.name)}:</h1></div>${createCatSwitcher()}<div class="card cat-card"><button class="cat-avatar cat-avatar-button" onclick="openModalWithCurrentCat()" aria-label="Открыть профиль">${avatarMarkup}</button><div class="cat-info"><h2>${escapeHtml(cat.name)}</h2><p>${escapeHtml(getCatAgeText(cat))}</p></div></div><div class="section-title">План ухода</div><div class="card">${tasks.map(task => createTask(task)).join("")}</div><button class="button" onclick="openHistory()">Дневник</button><button class="button button-secondary" onclick="openModalWithCurrentCat()">Изменить профиль</button>`;
}

// Progress-only relative labels. Calendar keeps ordinary dates.
(function () {
    function diaryHistoryDateLabel(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(`${date}T00:00:00`);
        target.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today - target) / 86400000);
        if (diffDays === 0) return "Сегодня";
        if (diffDays === 1) return "Вчера";
        return formatDate(date);
    }

    window.createHistoryDay = function (date, dayData) {
        const tasks = dayData?.tasks || [];
        const completed = tasks.filter(task => task.done).length;
        const total = tasks.length;
        return `<div class="card history-day"><div class="history-day-top"><div><div class="history-date">${diaryHistoryDateLabel(date)}</div><div class="history-count">${completed} из ${total} задач выполнено</div></div></div><div class="history-task-list">${tasks.map(task => `<div class="history-task ${task.done ? "history-task-done" : ""}"><span>${task.icon}</span><span>${escapeHtml(task.name)}${task.catName ? `<small class="history-cat-name">${escapeHtml(task.catName)}</small>` : ""}</span><span class="history-check">${task.done ? "✓" : "—"}</span></div>`).join("")}</div></div>`;
    };
})();
