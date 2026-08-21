// 0.9.3 — ежедневная задача остаётся «Уход за зубами».
// Медицинская «Ультразвуковая чистка зубов под наркозом» существует
// только как тип медицинского события в календаре.
(function () {
    const originalGetDailyTasks = window.getDailyTasks;
    window.getDailyTasks = function (catId) {
        const tasks = originalGetDailyTasks(catId);
        return tasks.map(task => task.id === "teeth" ? {
            ...task,
            name: "Уход за зубами",
            description: "Регулярный уход"
        } : task);
    };
})();
