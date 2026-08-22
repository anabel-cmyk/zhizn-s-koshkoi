// 0.9.3 — Progress relative date labels
// Только для блока «Последние 7 дней» в Прогрессе.
// Сегодня остаётся «Сегодня», вчера — «Вчера», остальные даты обычные.
(function(){
    function diaryHistoryDateLabel(date){
        const today = new Date();
        today.setHours(0,0,0,0);
        const target = new Date(`${date}T00:00:00`);
        target.setHours(0,0,0,0);
        const diffDays = Math.round((today - target) / 86400000);
        if(diffDays === 0) return "Сегодня";
        if(diffDays === 1) return "Вчера";
        return formatDate(date);
    }

    window.createHistoryDay = function(date, dayData){
        const tasks = dayData?.tasks || [];
        const completed = tasks.filter(task => task.done).length;
        const total = tasks.length;

        return `
            <div class="card history-day">
                <div class="history-day-top">
                    <div>
                        <div class="history-date">${diaryHistoryDateLabel(date)}</div>
                        <div class="history-count">
                            ${completed} из ${total} задач выполнено
                        </div>
                    </div>
                </div>
                <div class="history-task-list">
                    ${tasks.map(task => `
                        <div class="history-task ${task.done ? "history-task-done" : ""}">
                            <span>${task.icon}</span>
                            <span>
                                ${escapeHtml(task.name)}
                                ${task.catName ? `<small class="history-cat-name">${escapeHtml(task.catName)}</small>` : ""}
                            </span>
                            <span class="history-check">${task.done ? "✓" : "—"}</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    };
})();
