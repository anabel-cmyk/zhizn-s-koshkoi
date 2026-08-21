// 0.9.3 — precise dental task naming without changing its existing progress settings
(function () {
    const originalGetDailyTasks = window.getDailyTasks;
    window.getDailyTasks = function (catId) {
        const tasks = originalGetDailyTasks(catId);
        return tasks.map(task => task.id === "teeth" ? {
            ...task,
            name: "Ультразвуковая чистка зубов под наркозом",
            description: "Регулярная процедура"
        } : task);
    };
})();
