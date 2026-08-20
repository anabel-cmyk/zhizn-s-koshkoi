// ========================================
// ЖИЗНЬ С КОШКОЙ
// TASKS.JS
// Ежедневные задачи
// ========================================

// ========================================
// TASKS
// ========================================

const TASKS_KEY = "dailyTasks";


// ========================================
// DEFAULT TASKS
// ========================================

function getDefaultTasks() {

    return [

        {
            id: "play",

            icon: "🎾",

            name: "Поиграть",

            description:
                "15–30 минут",

            frequency:
                "daily",

            statistics:
                "sessions",

            done: false
        },


        {
            id: "water",

            icon: "💧",

            name: "Проверить воду",

            description:
                "Свежая вода",

            frequency:
                "daily",

            statistics:
                "none",

            done: false
        },


        {
            id: "teeth",

            icon: "🦷",

            name: "Уход за зубами",

            description:
                "Регулярный уход",

            frequency:
                "weekly",

            statistics:
                "monthly",

            targetPerWeek:
                2,

            targetPerMonth:
                8,

            done: false
        }

    ];
}


// ========================================
// DATE
// ========================================

function getTodayKey() {

    return formatDateKey(
        new Date()
    );
}


// ========================================
// STORAGE
// ========================================

function getTasksStorage() {

    const saved =
        localStorage.getItem(
            TASKS_KEY
        );

    if (!saved) {
        return {};
    }

    try {

        return JSON.parse(saved);

    } catch {

        return {};

    }
}


function saveTasksStorage(data) {

    localStorage.setItem(
        TASKS_KEY,
        JSON.stringify(data)
    );
}


// ========================================
// DAILY TASKS FOR CAT
// ========================================

function getDailyTasks(
    catId = getActiveCatId()
) {

    if (!catId) {
        return [];
    }


    const today =
        getTodayKey();


    const storage =
        getTasksStorage();


    if (!storage[catId]) {

        storage[catId] = {};

    }


    /*
     * Если есть старый формат
     * dailyTasks = { date, tasks },
     * переносим его к активной кошке.
     */

    if (
        storage.date &&
        Array.isArray(storage.tasks)
    ) {

        const oldData = {
            date:
                storage.date,

            tasks:
                storage.tasks
        };


        storage[catId][oldData.date] =
            oldData.tasks;


        delete storage.date;
        delete storage.tasks;


        saveTasksStorage(storage);

    }


    /*
     * Если сегодня ещё нет данных,
     * создаём чистый набор задач.
     */

    if (
        !storage[catId][today]
    ) {

        /*
         * Если у кошки был предыдущий день,
         * сохраняем его в дневник перед
         * переходом на новый день.
         */

        const previousDates =
            Object.keys(
                storage[catId]
            );


        previousDates.forEach(
            date => {

                if (
                    date !== today &&
                    storage[catId][date]
                ) {

                    saveDayToHistory(
                        catId,
                        date,
                        storage[catId][date]
                    );

                }

            }
        );


        storage[catId][today] =
            getDefaultTasks();


        saveTasksStorage(
            storage
        );

        return storage[catId][today];
    }


    /*
     * Синхронизируем текущие задачи
     * с актуальной моделью.
     */

    const savedTasks =
        storage[catId][today];


    const defaultTasks =
        getDefaultTasks();


    const updatedTasks =
        savedTasks.map(
            oldTask => {

                const currentTask =
                    defaultTasks.find(
                        task =>
                            task.id ===
                            oldTask.id
                    );


                if (!currentTask) {
                    return oldTask;
                }


                return {

                    ...currentTask,

                    done:
                        oldTask.done === true

                };

            }
        );


    defaultTasks.forEach(
        defaultTask => {

            const exists =
                updatedTasks.some(
                    task =>
                        task.id ===
                        defaultTask.id
                );


            if (!exists) {

                updatedTasks.push(
                    defaultTask
                );

            }

        }
    );


    storage[catId][today] =
        updatedTasks;


    saveTasksStorage(
        storage
    );


    return updatedTasks;
}


// ========================================
// SAVE
// ========================================

function saveDailyTasks(
    catId,
    date,
    tasks
) {

    if (!catId || !date) {
        return;
    }


    const storage =
        getTasksStorage();


    if (!storage[catId]) {

        storage[catId] = {};

    }


    storage[catId][date] =
        tasks;


    saveTasksStorage(
        storage
    );
}


// ========================================
// TOGGLE
// ========================================

function toggleTask(taskId) {

    const cat =
        getActiveCat();

    if (!cat) {
        return;
    }


    const catId =
        cat.id;


    const today =
        getTodayKey();


    const tasks =
        getDailyTasks(catId);


    const task =
        tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) {
        return;
    }


    task.done =
        !task.done;


    saveDailyTasks(
        catId,
        today,
        tasks
    );


    saveDayToHistory(
        catId,
        today,
        tasks
    );


    renderApp();
}


// ========================================
// DELETE CAT TASKS
// ========================================

function deleteCatTasks(catId) {

    if (!catId) {
        return;
    }


    const storage =
        getTasksStorage();


    if (
        Object.prototype.hasOwnProperty.call(
            storage,
            catId
        )
    ) {

        delete storage[catId];

        saveTasksStorage(
            storage
        );

    }
}