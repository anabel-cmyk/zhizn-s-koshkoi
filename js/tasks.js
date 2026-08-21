// ========================================
// ЖИЗНЬ С КОШКОЙ
// TASKS.JS
// MVP 0.9.2
//
// Индивидуальные задачи для каждой кошки
// + общие задачи для всех кошек
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

            targetPerWeek:
                null,

            targetPerMonth:
                null,

            // false = отдельно для каждой кошки
            // true = одна отметка для всех кошек
            shared:
                false,

            done:
                false
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

            targetPerWeek:
                null,

            targetPerMonth:
                null,

            // По умолчанию индивидуальная.
            shared:
                false,

            done:
                false
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

            shared:
                false,

            done:
                false
        }

    ];
}


// ========================================
// TASK STORAGE
//
// {
//     "cat_123": {
//         date: "2026-08-21",
//         tasks: [...]
//     },
//
//     "cat_456": {
//         date: "2026-08-21",
//         tasks: [...]
//     }
// }
//
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

        const data =
            JSON.parse(saved);


        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data)
        ) {

            return {};

        }


        return data;

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
// LEGACY MIGRATION
// ========================================

function migrateOldTasks() {

    const saved =
        localStorage.getItem(
            TASKS_KEY
        );


    if (!saved) {
        return;
    }


    try {

        const data =
            JSON.parse(saved);


        // Уже новая структура.
        if (
            data &&
            typeof data === "object" &&
            !Array.isArray(data) &&
            !data.date &&
            !Array.isArray(data.tasks)
        ) {

            return;

        }


        // Старый формат.
        if (
            data &&
            data.date &&
            Array.isArray(data.tasks)
        ) {

            const activeCatId =
                typeof getActiveCatId === "function"
                    ? getActiveCatId()
                    : null;


            if (!activeCatId) {
                return;
            }


            const storage = {};


            storage[activeCatId] = {

                date:
                    data.date,

                tasks:
                    normalizeTasks(
                        data.tasks
                    )

            };


            saveTasksStorage(
                storage
            );

        }

    } catch {

        // Ничего не делаем.

    }
}


// ========================================
// TASK NORMALIZATION
// ========================================

function normalizeTasks(tasks) {

    const defaults =
        getDefaultTasks();


    if (!Array.isArray(tasks)) {

        return defaults;

    }


    const result =
        tasks.map(
            oldTask => {

                const defaultTask =
                    defaults.find(
                        task =>
                            task.id ===
                            oldTask.id
                    );


                if (!defaultTask) {

                    return {

                        ...oldTask,

                        shared:
                            oldTask.shared === true,

                        done:
                            oldTask.done === true

                    };

                }


                return {

                    ...defaultTask,

                    ...oldTask,

                    shared:
                        oldTask.shared === true,

                    done:
                        oldTask.done === true

                };

            }
        );


    // Добавляем новые системные задачи.
    defaults.forEach(
        defaultTask => {

            const exists =
                result.some(
                    task =>
                        task.id ===
                        defaultTask.id
                );


            if (!exists) {

                result.push(
                    {
                        ...defaultTask
                    }
                );

            }

        }
    );


    return result;
}


// ========================================
// GET DAILY TASKS
// ========================================

function getDailyTasks(
    catId = null
) {

    migrateOldTasks();


    const activeCatId =
        catId ||
        (
            typeof getActiveCatId === "function"
                ? getActiveCatId()
                : null
        );


    if (!activeCatId) {
        return [];
    }


    const today =
        getTodayKey();


    const storage =
        getTasksStorage();


    const catData =
        storage[activeCatId];


    // У кошки ещё нет задач.
    if (!catData) {

        const tasks =
            getDefaultTasks();


        storage[activeCatId] = {

            date:
                today,

            tasks

        };


        saveTasksStorage(
            storage
        );


        return tasks;
    }


    // Наступил новый день.
    if (
        catData.date !== today
    ) {

        saveTasksToHistory(
            activeCatId,
            catData.date,
            catData.tasks
        );


        const tasks =
            getDefaultTasks();


        storage[activeCatId] = {

            date:
                today,

            tasks

        };


        saveTasksStorage(
            storage
        );


        return tasks;
    }


    const updatedTasks =
        normalizeTasks(
            catData.tasks
        );


    storage[activeCatId] = {

        date:
            today,

        tasks:
            updatedTasks

    };


    saveTasksStorage(
        storage
    );


    return updatedTasks;
}


// ========================================
// SAVE DAILY TASKS
// ========================================

function saveDailyTasks(
    date,
    tasks,
    catId = null
) {

    const activeCatId =
        catId ||
        (
            typeof getActiveCatId === "function"
                ? getActiveCatId()
                : null
        );


    if (!activeCatId) {
        return;
    }


    const storage =
        getTasksStorage();


    storage[activeCatId] = {

        date,

        tasks:
            normalizeTasks(tasks)

    };


    saveTasksStorage(
        storage
    );
}


// ========================================
// SAVE DAY TO HISTORY
// ========================================

function saveTasksToHistory(
    catId,
    date,
    tasks
) {

    if (
        !catId ||
        !date ||
        !tasks
    ) {

        return;

    }


    /*
     * diary.js:
     *
     * saveDayToHistory(
     *     catId,
     *     date,
     *     tasks
     * )
     */

    if (
        typeof saveDayToHistory ===
        "function"
    ) {

        try {

            saveDayToHistory(
                catId,
                date,
                tasks
            );

        } catch {

            // История не должна ломать
            // работу ежедневных задач.

        }

    }
}


// ========================================
// SAVE CURRENT TASKS TO HISTORY
// ========================================

function saveCurrentTasksToHistory(
    catId = null
) {

    const activeCatId =
        catId ||
        (
            typeof getActiveCatId === "function"
                ? getActiveCatId()
                : null
        );


    if (!activeCatId) {
        return;
    }


    const storage =
        getTasksStorage();


    const catData =
        storage[activeCatId];


    if (!catData) {
        return;
    }


    saveTasksToHistory(
        activeCatId,
        catData.date,
        catData.tasks
    );
}


// ========================================
// TASK UI
// ========================================

function createTask(task) {

    return `

        <div class="task">

            <div class="task-main">

                <div class="task-icon">
                    ${task.icon}
                </div>


                <div class="task-text">

                    <div class="task-name">
                        ${escapeHtml(
                            task.name
                        )}
                    </div>


                    <div class="task-time">
                        ${escapeHtml(
                            task.description
                        )}
                    </div>

                </div>


                <button
                    class="task-settings-button"
                    type="button"
                    onclick="
                        toggleTaskSettings(
                            '${task.id}'
                        )
                    "
                    aria-label="Настройки задачи"
                    aria-expanded="false"
                >
                    ⚙
                </button>


                <div
                    class="
                        check
                        ${
                            task.done
                                ? "done"
                                : ""
                        }
                    "
                    onclick="
                        toggleTask(
                            '${task.id}'
                        )
                    "
                    role="button"
                    aria-label="Отметить выполненным"
                ></div>

            </div>


            <div
                id="task-settings-${task.id}"
                class="task-settings"
                hidden
            >

                <label
                    class="task-setting-row"
                >

                    <span class="task-setting-text">

                        <strong>
                            Общая для всех кошек
                        </strong>

                        <small>
                            Одна отметка будет применяться
                            ко всем кошкам
                        </small>

                    </span>


                    <input
                        type="checkbox"
                        class="task-shared-checkbox"
                        ${
                            task.shared === true
                                ? "checked"
                                : ""
                        }
                        onchange="
                            toggleTaskShared(
                                '${task.id}',
                                this.checked
                            )
                        "
                    >

                </label>

            </div>

        </div>

    `;
}

// ========================================
// TASK SETTINGS
// ========================================

function toggleTaskSettings(taskId) {

    const settings =
        document.getElementById(
            `task-settings-${taskId}`
        );

    if (!settings) {
        return;
    }


    const button =
        settings
            .closest(".task")
            ?.querySelector(
                ".task-settings-button"
            );


    const isHidden =
        settings.hidden;


    settings.hidden =
        !isHidden;


    if (button) {

        button.setAttribute(
            "aria-expanded",
            String(isHidden)
        );

    }

}


// ========================================
// SHARED TASK
// ========================================

function toggleTaskShared(
    taskId,
    isShared
) {

    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;


    if (!activeCatId) {
        return;
    }


    const storage =
        getTasksStorage();


    const cats =
        typeof getCats === "function"
            ? getCats()
            : [];


    /*
     * ======================================
     * НАСТРОЙКА ОБЩЕЙ ЗАДАЧИ
     * ======================================
     *
     * shared хранится одинаково
     * у всех кошек.
     */

    cats.forEach(
        cat => {

            if (!storage[cat.id]) {

                storage[cat.id] = {

                    date:
                        getTodayKey(),

                    tasks:
                        getDefaultTasks()

                };

            }


            /*
             * Если у кошки уже есть
             * задачи за сегодняшний день,
             * используем их.
             */

            if (
                storage[cat.id].date !==
                getTodayKey()
            ) {

                storage[cat.id] = {

                    date:
                        getTodayKey(),

                    tasks:
                        getDefaultTasks()

                };

            }


            const catTask =
                storage[cat.id]
                    .tasks
                    .find(
                        item =>
                            item.id ===
                            taskId
                    );


            if (catTask) {

                catTask.shared =
                    isShared;

            }

        }
    );


    /*
     * Если задача стала общей,
     * приводим отметки всех кошек
     * к состоянию активной кошки.
     *
     * Это важно, чтобы не получилось:
     *
     * Микки — ✓
     * Феникс — пусто
     *
     * после включения общего режима.
     */

    if (isShared) {

        const activeData =
            storage[activeCatId];


        const activeTask =
            activeData?.tasks?.find(
                item =>
                    item.id === taskId
            );


        const sharedDone =
            activeTask?.done === true;


        cats.forEach(
            cat => {

                const catTask =
                    storage[cat.id]
                        ?.tasks
                        ?.find(
                            item =>
                                item.id ===
                                taskId
                        );


                if (catTask) {

                    catTask.done =
                        sharedDone;

                }

            }
        );

    }


    saveTasksStorage(
        storage
    );


    /*
     * Сохраняем историю
     * каждой кошки отдельно.
     */

    cats.forEach(
        cat => {

            const catData =
                storage[cat.id];


            if (!catData) {
                return;
            }


            saveTasksToHistory(
                cat.id,
                catData.date,
                catData.tasks
            );

        }
    );


    renderApp();

}
// ========================================
// TASK SETTINGS MODAL
// ========================================

function openTaskSettings(
    taskId
) {

    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;


    if (!activeCatId) {
        return;
    }


    const tasks =
        getDailyTasks(
            activeCatId
        );


    const task =
        tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) {
        return;
    }


    closeTaskSettings();


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "taskSettingsModal";


    modal.className =
        "task-settings-modal";


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    modal.innerHTML = `

        <div
            class="
                task-settings-overlay
            "
            onclick="
                closeTaskSettings()
            "
        ></div>


        <div
            class="
                task-settings-dialog
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="taskSettingsTitle"
        >

            <div
                class="
                    task-settings-header
                "
            >

                <div>

                    <div
                        class="
                            task-settings-icon
                        "
                    >
                        ${task.icon}
                    </div>

                </div>


                <button
                    type="button"
                    class="
                        task-settings-close
                    "
                    onclick="
                        closeTaskSettings()
                    "
                    aria-label="Закрыть"
                >
                    ×
                </button>

            </div>


            <h2
                id="taskSettingsTitle"
                class="
                    task-settings-title
                "
            >
                ${escapeHtml(
                    task.name
                )}
            </h2>


            <p
                class="
                    task-settings-description
                "
            >
                ${escapeHtml(
                    task.description
                )}
            </p>


            <div
                class="
                    task-setting-row
                "
            >

                <div
                    class="
                        task-setting-text
                    "
                >

                    <strong>
                        Общая для всех кошек
                    </strong>

                    <span>
                        Одна отметка будет применяться
                        ко всем кошкам.
                    </span>

                </div>


                <button
                    type="button"
                    class="
                        task-switch
                        ${
                            task.shared
                                ? "active"
                                : ""
                        }
                    "
                    onclick="
                        toggleTaskShared(
                            '${task.id}'
                        )
                    "
                    role="switch"
                    aria-checked="${
                        task.shared
                            ? "true"
                            : "false"
                    }"
                >

                    <span
                        class="
                            task-switch-knob
                        "
                    ></span>

                </button>

            </div>


            <button
                type="button"
                class="
                    task-settings-done
                "
                onclick="
                    closeTaskSettings()
                "
            >
                Готово
            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    requestAnimationFrame(
        () => {

            modal.classList.add(
                "active"
            );

        }
    );
}


function closeTaskSettings() {

    const modal =
        document.getElementById(
            "taskSettingsModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );


    setTimeout(
        () => {

            modal.remove();

        },
        200
    );
}


// ========================================
// TOGGLE SHARED TASK
// ========================================

function toggleTaskShared(
    taskId
) {

    const cats =
        typeof getCats === "function"
            ? getCats()
            : [];


    if (!cats.length) {
        return;
    }


    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;


    if (!activeCatId) {
        return;
    }


    const storage =
        getTasksStorage();


    /*
     * Получаем текущую задачу
     * активной кошки.
     */

    if (!storage[activeCatId]) {

        getDailyTasks(
            activeCatId
        );

    }


    const activeData =
        storage[activeCatId];


    if (!activeData) {
        return;
    }


    const activeTask =
        activeData.tasks.find(
            task =>
                task.id === taskId
        );


    if (!activeTask) {
        return;
    }


    const newSharedState =
        !activeTask.shared;


    /*
     * ======================================
     * ОБЩАЯ НАСТРОЙКА ДЛЯ ВСЕХ КОШЕК
     * ======================================
     *
     * shared хранится у каждой кошки,
     * но значение всегда синхронизируется.
     */

    cats.forEach(
        cat => {

            if (!storage[cat.id]) {

                storage[cat.id] = {

                    date:
                        getTodayKey(),

                    tasks:
                        getDefaultTasks()

                };

            }


            const catTasks =
                storage[cat.id].tasks;


            const catTask =
                catTasks.find(
                    task =>
                        task.id === taskId
                );


            if (catTask) {

                catTask.shared =
                    newSharedState;

            }

        }
    );


    /*
     * Если задача становится общей,
     * состояние выполнения активной кошки
     * становится единым для всех.
     *
     * Например:
     *
     * Микки — вода ✓
     * Чушпан — вода —
     *
     * включаем «Общая для всех» →
     * вода ✓ у обеих.
     */

    if (newSharedState) {

        const sharedDone =
            activeTask.done === true;


        cats.forEach(
            cat => {

                const catData =
                    storage[cat.id];


                if (!catData) {
                    return;
                }


                const catTask =
                    catData.tasks.find(
                        task =>
                            task.id === taskId
                    );


                if (catTask) {

                    catTask.done =
                        sharedDone;

                }

            }
        );

    }


    saveTasksStorage(
        storage
    );


    closeTaskSettings();


    /*
     * Обновляем экран,
     * чтобы состояние ⚙ и задачи
     * сразу изменились.
     */

    renderApp();
}


// ========================================
// TOGGLE TASK
// ========================================

function toggleTask(
    taskId
) {

    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;


    if (!activeCatId) {
        return;
    }


    const storage =
        getTasksStorage();


    const catData =
        storage[activeCatId];


    if (!catData) {
        return;
    }


    const task =
        catData.tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) {
        return;
    }


    const newDoneState =
        !task.done;


    /*
     * ======================================
     * ОБЩАЯ ЗАДАЧА
     * ======================================
     */

    if (task.shared === true) {

        const cats =
            typeof getCats === "function"
                ? getCats()
                : [];


        cats.forEach(
            cat => {

                if (!storage[cat.id]) {

                    storage[cat.id] = {

                        date:
                            getTodayKey(),

                        tasks:
                            getDefaultTasks()

                    };

                }


                const catTask =
                    storage[cat.id]
                        .tasks
                        .find(
                            item =>
                                item.id ===
                                taskId
                        );


                if (catTask) {

                    catTask.done =
                        newDoneState;

                    catTask.shared =
                        true;

                }

            }
        );

    } else {

        /*
         * ==================================
         * ИНДИВИДУАЛЬНАЯ ЗАДАЧА
         * ==================================
         */

        task.done =
            newDoneState;

    }


    saveTasksStorage(
        storage
    );


    /*
     * Сохраняем текущее состояние
     * в историю активной кошки.
     */

    saveCurrentTasksToHistory(
        activeCatId
    );


    /*
     * Для общей задачи сохраняем
     * состояние в историю остальных кошек.
     */

    if (task.shared === true) {

        const cats =
            typeof getCats === "function"
                ? getCats()
                : [];


        cats.forEach(
            cat => {

                if (
                    cat.id ===
                    activeCatId
                ) {

                    return;

                }


                const otherCatData =
                    storage[cat.id];


                if (!otherCatData) {
                    return;
                }


                saveTasksToHistory(
                    cat.id,
                    otherCatData.date,
                    otherCatData.tasks
                );

            }
        );

    }


    renderApp();
}


// ========================================
// DELETE CAT TASKS
// ========================================

function deleteCatTasks(
    catId
) {

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

    }


    saveTasksStorage(
        storage
    );
}


// ========================================
// DATE
// ========================================

function getTodayKey() {

    return formatDateKey(
        new Date()
    );
}


function formatDateKey(date) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");
}