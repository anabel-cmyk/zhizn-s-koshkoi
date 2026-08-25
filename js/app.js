// ========================================
// ЖИЗНЬ С КОШКОЙ
// APP.JS
// 0.9.6 — запуск, навигация и мотивационная система
// ========================================

function updateHeaderCat() {
    const button = document.getElementById("headerCatAvatar");
    if (!button || typeof getActiveCat !== "function") return;
    const cat = getActiveCat();
    if (!cat) { button.innerHTML = "🐈"; return; }
    const profile = typeof getCatHealth === "function" ? getCatHealth(cat.id) : { avatar: "" };
    const avatar = cat.avatar || profile.avatar;
    button.innerHTML = avatar ? `<img src="${avatar}" alt="${escapeHtml(cat.name || "")}">` : "🐈";
}

function toggleHeaderMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById("headerMenu");
    const button = document.querySelector(".header-menu-button");
    if (!menu) return;
    const shouldOpen = menu.hidden;
    menu.hidden = !shouldOpen;
    if (button) button.setAttribute("aria-expanded", String(shouldOpen));
}

function closeHeaderMenu() {
    const menu = document.getElementById("headerMenu");
    const button = document.querySelector(".header-menu-button");
    if (menu) menu.hidden = true;
    if (button) button.setAttribute("aria-expanded", "false");
}

function navigateHeader(destination) {
    closeHeaderMenu();

    if (destination === "home") {
        renderApp();
        return;
    }

    if (destination === "diary") {
        // The menu item «Дневник» always opens the Progress subsection,
        // regardless of which Diary subsection was open previously.
        if (typeof window.setDiarySubsection === "function") {
            window.setDiarySubsection("progress");
        } else {
            openHistory();
        }
        return;
    }

    if (destination === "calendar") {
        if (typeof window.setDiarySubsection === "function") {
            window.setDiarySubsection("calendar");
        } else {
            openHistory();
        }
        return;
    }

    if (destination === "achievements") {
        renderAchievementsPage();
    }
}

function renderAchievementsPage() {
    const content = document.getElementById("content");
    if (!content) return;
    if (typeof getCats === "function" && !getCats().length) { renderEmptyState(); return; }
    content.innerHTML = `<div class="history-header"><button class="back-button" onclick="renderApp()">← Назад</button><h1>Достижения</h1></div>${createAchievementsSection()}`;
}

document.addEventListener("DOMContentLoaded", () => {
    migrateOldCat();
    updateHeaderCat();
    renderApp();
    document.addEventListener("click", event => {
        const menu = document.getElementById("headerMenu");
        const header = document.querySelector(".header");
        if (menu && !menu.hidden && header && !header.contains(event.target)) closeHeaderMenu();
    });
});

function renderApp() {
    const cats = getCats();
    updateHeaderCat();
    if (!cats.length) { renderEmptyState(); return; }
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
    const avatarMarkup = avatar ? `<img src="${avatar}" alt="${escapeHtml(cat.name)}" class="cat-avatar-image">` : "🐈";
    content.innerHTML = `${createCatSwitcher()}<div class="card cat-card"><button class="cat-avatar cat-avatar-button" onclick="openModalWithCurrentCat()" aria-label="Открыть профиль">${avatarMarkup}</button><div class="cat-info"><h2>${escapeHtml(cat.name)}</h2><p>${escapeHtml(getCatAgeText(cat))}</p></div></div><div class="section-title">План ухода</div><div class="card">${tasks.map(task => createTask(task)).join("")}</div><button class="button" onclick="openHistory()">Дневник</button><button class="button button-secondary" onclick="openModalWithCurrentCat()">Изменить профиль</button>${createAchievementsSection()}`;
}

function getAchievementHistory() { return typeof getHistory === "function" ? getHistory() : {}; }
function getAchievementRecords() { const history = getAchievementHistory(); const records = []; Object.keys(history).forEach(catId => { const catHistory = history[catId]; if (!catHistory || typeof catHistory !== "object") return; Object.keys(catHistory).forEach(date => { const day = catHistory[date]; if (!day || !Array.isArray(day.tasks)) return; records.push({ catId, date, tasks: day.tasks }); }); }); return records; }
function getCompletedRecords(records) { return records.filter(record => record.tasks.some(task => task.done === true)); }
function getUniqueDates(records) { return [...new Set(records.map(record => record.date))].sort(); }
function getPlayDates(records) { return [...new Set(records.filter(record => record.tasks.some(task => task.id === "play" && task.done === true)).map(record => record.date))].sort(); }
function getConsecutiveDays(dates) { if (!dates.length) return 0; const sorted = [...new Set(dates)].sort(); let best = 1; let current = 1; for (let i = 1; i < sorted.length; i++) { const previous = new Date(`${sorted[i - 1]}T00:00:00`); const currentDate = new Date(`${sorted[i]}T00:00:00`); const diff = Math.round((currentDate - previous) / 86400000); if (diff === 1) { current++; best = Math.max(best, current); } else current = 1; } return best; }
function getIsoWeekKey(dateKey) { const date = new Date(`${dateKey}T00:00:00`); const day = date.getDay() || 7; date.setDate(date.getDate() + 4 - day); const yearStart = new Date(date.getFullYear(), 0, 1); const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7); return `${date.getFullYear()}-${week}`; }
function getMonthlyCareAchievement(records) { const byMonth = {}; records.forEach(record => { const month = record.date.slice(0, 7); if (!byMonth[month]) byMonth[month] = { total: 0, done: 0, days: new Set() }; const monthData = byMonth[month]; monthData.days.add(record.date); record.tasks.forEach(task => { monthData.total++; if (task.done === true) monthData.done++; }); }); return Object.values(byMonth).some(month => month.days.size >= 7 && month.total > 0 && month.done / month.total >= 0.8); }
function isProfileComplete(cat) { if (!cat || !cat.name) return false; const hasAge = Boolean(cat.birthDate) || (cat.ageValue !== null && cat.ageValue !== undefined && cat.ageValue !== ""); return hasAge; }
function hasIndividualCareForDifferentCats(records) { const completedByCat = {}; records.forEach(record => { const individualDone = record.tasks.some(task => task.done === true && task.shared !== true); if (individualDone) completedByCat[record.catId] = true; }); return Object.keys(completedByCat).length >= 2; }
function getFirstHistoryDate(records) { const dates = getUniqueDates(records); return dates[0] || null; }
function hasYearOfCare(records) { const firstDate = getFirstHistoryDate(records); if (!firstDate) return false; const start = new Date(`${firstDate}T00:00:00`); const today = new Date(); const anniversary = new Date(start); anniversary.setFullYear(anniversary.getFullYear() + 1); return today >= anniversary; }
function getAchievementStates() { const cats = typeof getCats === "function" ? getCats() : []; const records = getAchievementRecords(); const completedRecords = getCompletedRecords(records); const completedDates = getUniqueDates(completedRecords); const playDates = getPlayDates(records); const currentMonth = getTodayKey().slice(0, 7); const currentMonthPlayDates = playDates.filter(date => date.startsWith(currentMonth)); const playWeeks = new Set(playDates.map(getIsoWeekKey)); return [{icon:"🐾",title:"Первый шаг",text:"Выполнена первая задача.",unlocked:completedRecords.length>0},{icon:"🐈",title:"Познакомились",text:"Заполнен профиль кошки.",unlocked:cats.some(isProfileComplete)},{icon:"📅",title:"Вместе неделю",text:"7 дней с выполненными задачами.",unlocked:completedDates.length>=7},{icon:"🌿",title:"Хорошая привычка",text:"Задачи выполнялись 5 дней подряд.",unlocked:getConsecutiveDays(completedDates)>=5},{icon:"🤍",title:"Заботливый месяц",text:"В одном месяце выполнено не менее 80% задач.",unlocked:getMonthlyCareAchievement(records)},{icon:"🎾",title:"Первая игра",text:"Впервые отмечена игра с кошкой.",unlocked:playDates.length>=1},{icon:"🎾",title:"Любимая игра",text:"10 отмеченных игровых дней.",unlocked:playDates.length>=10},{icon:"🐾",title:"Играем регулярно",text:"7 игровых дней за месяц.",unlocked:currentMonthPlayDates.length>=7},{icon:"🗓️",title:"Вместе больше месяца",text:"Игровая активность отмечалась в 4 разные недели.",unlocked:playWeeks.size>=4},{icon:"📖",title:"Начали наблюдать",text:"Первая запись в дневнике.",unlocked:records.length>=1},{icon:"📚",title:"Наблюдатель",text:"10 записей в дневнике.",unlocked:records.length>=10},{icon:"🐈‍⬛",title:"Большая семья",text:"Добавлены 2 кошки.",unlocked:cats.length>=2},{icon:"🐾",title:"Каждому своё",text:"Индивидуальные задачи выполняются для разных кошек.",unlocked:cats.length>=2&&hasIndividualCareForDifferentCats(records)},{icon:"⭐",title:"Год заботы",text:"Приложением пользуются уже год.",unlocked:hasYearOfCare(records)}]; }
function createAchievementsSection() { const achievements=getAchievementStates(); const unlocked=achievements.filter(item=>item.unlocked).length; return `<div class="section-title achievements-section-title">Достижения</div><div class="card achievements-card"><div class="achievements-header"><div><strong>Маленькие отметки заботы</strong><span>Достижения открываются ретроспективно — без серий и штрафов.</span></div><b>${unlocked}/${achievements.length}</b></div><div class="achievements-grid">${achievements.map(item=>`<div class="achievement-item ${item.unlocked?"unlocked":"locked"}"><div class="achievement-icon">${item.icon}</div><div class="achievement-text"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.text)}</span></div></div>`).join("")}</div></div>`; }
