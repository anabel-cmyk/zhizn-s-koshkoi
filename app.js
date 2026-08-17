// ========================================
// ЖИЗНЬ С КОШКОЙ
// MVP 0.6
// Профиль + задачи + история
// ========================================

const STORAGE_KEY = "cat";
const TASKS_KEY = "dailyTasks";
const HISTORY_KEY = "taskHistory";


// ========================================
// START
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        renderApp();
    }
);


// ========================================
// MODAL
// ========================================

function openModal() {

    const modal =
        document.getElementById("modal");

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(() => {

        const input =
            document.getElementById("catName");

        if (input) {
            input.focus();
        }

    }, 100);
}


function closeModal() {

    const modal =
        document.getElementById("modal");

    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    resetForm();
}


// ========================================
// FORM
// ========================================

function resetForm() {

    document.getElementById(
        "catName"
    ).value = "";

    document.getElementById(
        "catBirthDate"
    ).value = "";

    document.getElementById(
        "catAgeValue"
    ).value = "";

    document.getElementById(
        "catAgeUnit"
    ).value = "years";

    showBirthDateInput();
}


function showAgeInput() {

    document.getElementById(
        "birthDateField"
    ).hidden = true;

    document.getElementById(
        "ageField"
    ).hidden = false;

    document.getElementById(
        "catBirthDate"
    ).value = "";

    document.getElementById(
        "catAgeValue"
    ).focus();
}


function showBirthDateInput() {

    document.getElementById(
        "birthDateField"
    ).hidden = false;

    document.getElementById(
        "ageField"
    ).hidden = true;

    document.getElementById(
        "catAgeValue"
    ).value = "";

    document.getElementById(
        "catBirthDate"
    ).focus();
}


// ========================================
// SAVE CAT
// ========================================

function saveCat() {

    const name =
        document
            .getElementById("catName")
            .value
            .trim();

    const birthDate =
        document.getElementById(
            "catBirthDate"
        ).value;

    const ageValue =
        document.getElementById(
            "catAgeValue"
        ).value;

    const ageUnit =
        document.getElementById(
            "catAgeUnit"
        ).value;

    const ageField =
        document.getElementById(
            "ageField"
        );


    if (!name) {

        alert(
            "Введите имя кошки"
        );

        return;
    }


    if (
        ageField.hidden &&
        !birthDate
    ) {

        alert(
            "Укажите дату рождения или возраст кошки"
        );

        return;
    }


    if (
        !ageField.hidden &&
        !ageValue
    ) {

        alert(
            "Укажите возраст кошки"
        );

        return;
    }


    const oldCat =
        localStorage.getItem(
            STORAGE_KEY
        );


    const previousCat =
        oldCat
            ? JSON.parse(oldCat)
            : null;


    const cat = {

        name: name,

        birthDate:
            ageField.hidden
                ? birthDate
                : null,

        ageValue:
            ageField.hidden
                ? null
                : Number(ageValue),

        ageUnit:
            ageField.hidden
                ? null
                : ageUnit,

        createdAt:
            previousCat?.createdAt ||
            new Date().toISOString()

    };


    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(cat)
    );


    closeModal();

    renderApp();
}


// ========================================
// APP
// ========================================

function renderApp() {

    const savedCat =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!savedCat) {

        renderEmptyState();

        return;
    }


    const cat =
        JSON.parse(savedCat);


    renderCatDashboard(cat);
}


// ========================================
// EMPTY STATE
// ========================================

function renderEmptyState() {

    const content =
        document.getElementById(
            "content"
        );


    content.innerHTML = `

        <div class="welcome">

            <h1>
                Спокойная<br>
                жизнь с кошкой.
            </h1>

            <p>
                Уход, здоровье и поведение —
                в одном месте.
            </p>

        </div>


        <div class="card empty">

            <div class="empty-icon">
                🐾
            </div>

            <h2>
                Добавьте первую кошку
            </h2>

            <p>
                Создадим её профиль и постепенно
                соберём всю важную информацию.
            </p>

            <button
                class="button"
                onclick="openModal()"
            >
                ＋ Добавить кошку
            </button>

        </div>

    `;
}


// ========================================
// CAT DASHBOARD
// ========================================

function renderCatDashboard(cat) {

    const content =
        document.getElementById(
            "content"
        );


    const tasks =
        getDailyTasks();


    content.innerHTML = `

        <div class="welcome">

            <h1>
                Сегодня<br>
                с ${escapeHtml(cat.name)}.
            </h1>

            <p>
                Небольшие заботы каждый день —
                большая польза.
            </p>

        </div>


        <div class="card cat-card">

            <div class="cat-avatar">
                🐈
            </div>


            <div class="cat-info">

                <h2>
                    ${escapeHtml(cat.name)}
                </h2>

                <p>
                    ${getCatAgeText(cat)}
                </p>

            </div>

        </div>


        <div class="section-title">
            Сегодня
        </div>


        <div class="card">

            ${tasks
                .map(task =>
                    createTask(task)
                )
                .join("")}

        </div>


        <button
            class="button"
            onclick="openHistory()"
        >
            История
        </button>


        <button
            class="button button-secondary"
            onclick="openModalWithCurrentCat()"
        >
            Изменить профиль
        </button>

    `;
}


// ========================================
// AGE
// ========================================

function getCatAgeText(cat) {

    if (cat.birthDate) {

        const birth =
            new Date(cat.birthDate);

        const now =
            new Date();

        let years =
            now.getFullYear()
            -
            birth.getFullYear();

        let months =
            now.getMonth()
            -
            birth.getMonth();


        if (
            now.getDate()
            <
            birth.getDate()
        ) {

            months--;

        }


        if (months < 0) {

            years--;

            months += 12;
        }


        if (years < 1) {

            const totalMonths =
                Math.max(
                    0,
                    (
                        now.getFullYear()
                        -
                        birth.getFullYear()
                    ) * 12
                    +
                    (
                        now.getMonth()
                        -
                        birth.getMonth()
                    )
                );


            return formatMonths(
                totalMonths
            );
        }


        return formatYears(
            years
        );
    }


    if (
        cat.ageValue !== null &&
        cat.ageValue !== undefined
    ) {

        if (
            cat.ageUnit === "months"
        ) {

            return formatMonths(
                cat.ageValue
            );
        }


        return formatYears(
            cat.ageValue
        );
    }


    return "Возраст не указан";
}


function formatYears(value) {

    return pluralize(
        value,
        "год",
        "года",
        "лет"
    );
}


function formatMonths(value) {

    return pluralize(
        value,
        "месяц",
        "месяца",
        "месяцев"
    );
}


function pluralize(
    number,
    one,
    few,
    many
) {

    const n =
        Math.abs(number) % 100;

    const last =
        n % 10;


    if (
        n >= 11 &&
        n <= 19
    ) {

        return `${number} ${many}`;
    }


    if (
        last === 1
    ) {

        return `${number} ${one}`;
    }


    if (
        last >= 2 &&
        last <= 4
    ) {

        return `${number} ${few}`;
    }


    return `${number} ${many}`;
}


// ========================================
// EDIT PROFILE
// ========================================

function openModalWithCurrentCat() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {

        openModal();

        return;
    }


    const cat =
        JSON.parse(saved);


    document.getElementById(
        "catName"
    ).value =
        cat.name || "";


    if (cat.birthDate) {

        showBirthDateInput();


        document.getElementById(
            "catBirthDate"
        ).value =
            cat.birthDate;

    } else {

        showAgeInput();


        document.getElementById(
            "catAgeValue"
        ).value =
            cat.ageValue || "";


        document.getElementById(
            "catAgeUnit"
        ).value =
            cat.ageUnit || "years";
    }


    const modal =
        document.getElementById(
            "modal"
        );


    modal.classList.add("active");


    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


// ========================================
// TASK MODEL
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


function formatDateKey(
    date
) {

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


// ========================================
// TASKS
// ========================================

function getDailyTasks() {

    const today =
        getTodayKey();


    const saved =
        localStorage.getItem(
            TASKS_KEY
        );


    if (!saved) {

        const tasks =
            getDefaultTasks();


        saveDailyTasks(
            today,
            tasks
        );


        return tasks;
    }


    const data =
        JSON.parse(saved);


    if (
        data.date !== today
    ) {

        saveDayToHistory(
            data.date,
            data.tasks
        );


        const tasks =
            getDefaultTasks();


        saveDailyTasks(
            today,
            tasks
        );


        return tasks;
    }


    const defaultTasks =
        getDefaultTasks();


    const updatedTasks =
        data.tasks.map(
            oldTask => {

                const currentTask =
                    defaultTasks.find(
                        task =>
                            task.id
                            ===
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
                        task.id
                        ===
                        defaultTask.id
                );


            if (!exists) {

                updatedTasks.push(
                    defaultTask
                );

            }

        }
    );


    saveDailyTasks(
        today,
        updatedTasks
    );


    return updatedTasks;
}


function saveDailyTasks(
    date,
    tasks
) {

    localStorage.setItem(
        TASKS_KEY,
        JSON.stringify({

            date: date,

            tasks: tasks

        })
    );
}


// ========================================
// TASK UI
// ========================================

function createTask(
    task
) {

    return `

        <div class="task">

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


            <div
                class="check ${
                    task.done
                        ? "done"
                        : ""
                }"
                onclick="toggleTask('${task.id}')"
                role="button"
                aria-label="Отметить выполненным"
            ></div>

        </div>

    `;
}


// ========================================
// TOGGLE TASK
// ========================================

function toggleTask(
    taskId
) {

    const saved =
        localStorage.getItem(
            TASKS_KEY
        );


    if (!saved) {
        return;
    }


    const data =
        JSON.parse(saved);


    const task =
        data.tasks.find(
            item =>
                item.id === taskId
        );


    if (!task) {
        return;
    }


    task.done =
        !task.done;


    saveDailyTasks(
        data.date,
        data.tasks
    );


    saveDayToHistory(
        data.date,
        data.tasks
    );


    renderApp();
}


// ========================================
// HISTORY STORAGE
// ========================================

function getHistory() {

    const saved =
        localStorage.getItem(
            HISTORY_KEY
        );


    if (!saved) {
        return {};
    }


    try {

        return JSON.parse(
            saved
        );

    } catch {

        return {};

    }
}


function saveHistory(
    history
) {

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(
            history
        )
    );
}


function saveDayToHistory(
    date,
    tasks
) {

    if (
        !date ||
        !tasks
    ) {

        return;
    }


    const history =
        getHistory();


    history[date] = {

        tasks:
            tasks.map(
                task => ({

                    id:
                        task.id,

                    icon:
                        task.icon,

                    name:
                        task.name,

                    description:
                        task.description,

                    frequency:
                        task.frequency,

                    targetPerWeek:
                        task.targetPerWeek ||
                        null,

                    targetPerMonth:
                        task.targetPerMonth ||
                        null,

                    done:
                        task.done === true

                })
            )

    };


    saveHistory(
        history
    );
}


// ========================================
// HISTORY
// ========================================

function openHistory() {

    const content =
        document.getElementById(
            "content"
        );


    const today =
        getTodayKey();


    const currentTasks =
        getDailyTasks();


    saveDayToHistory(
        today,
        currentTasks
    );


    const history =
        getHistory();


    const currentMonth =
        today.slice(
            0,
            7
        );


    const previousMonth =
        getPreviousMonth(
            currentMonth
        );


    const teethCurrent =
        countTaskForMonth(
            history,
            currentMonth,
            "teeth"
        );


    const teethPrevious =
        countTaskForMonth(
            history,
            previousMonth,
            "teeth"
        );


    const target =
        getMonthlyTarget(
            history,
            currentMonth,
            "teeth"
        );


    const previousTarget =
        getMonthlyTarget(
            history,
            previousMonth,
            "teeth"
        );


    const currentMonthName =
        getMonthPrepositional(
            currentMonth
        );


    const previousMonthName =
        getMonthPrepositional(
            previousMonth
        );


    const last7 =
        getLastDays(
            history,
            7
        );


    content.innerHTML = `

        <div class="history-header">

            <button
                class="back-button"
                onclick="renderApp()"
            >
                ← Назад
            </button>


            <h1>
                История
            </h1>

        </div>


        <div class="card history-summary">

            <div class="history-summary-label">
                Уход за зубами
            </div>


            <div class="history-summary-number">
                ${teethCurrent}
            </div>


            <div class="history-summary-caption">

                ${formatCompletedText(
                    teethCurrent,
                    currentMonthName
                )}

            </div>


            <div class="history-target">

                ${
                    teethCurrent >= target

                        ? `
                            <span class="history-target-success">
                                ✓ Цель достигнута · ${target} раз
                            </span>
                          `

                        : `
                            <span>
                                Цель · ${target}+ раз
                            </span>
                          `
                }

            </div>


            <div class="history-progress">

                <div
                    class="history-progress-fill"
                    style="
                        width:
                        ${Math.min(
                            teethCurrent /
                            target *
                            100,
                            100
                        )}%
                    "
                ></div>

            </div>

        </div>


        ${
            teethPrevious !== null

                ? `

                    <div class="card history-previous">

                        <div class="history-summary-label">
                            ${previousMonthName}
                        </div>


                        <div class="history-summary-number small">
                            ${teethPrevious}
                        </div>


                        <div class="history-summary-caption">

                            ${formatCompletedText(
                                teethPrevious,
                                previousMonthName
                            )}

                        </div>


                        <div class="history-target">

                            ${
                                teethPrevious >=
                                previousTarget

                                    ? `
                                        <span class="history-target-success">
                                            ✓ Цель достигнута
                                        </span>
                                      `

                                    : `
                                        <span>
                                            Цель · ${previousTarget}+ раз
                                        </span>
                                      `
                            }

                        </div>

                    </div>

                  `

                : ""
        }


        <div class="section-title">
            Последние 7 дней
        </div>


        ${
            last7.length

                ? last7
                    .map(
                        item =>
                            createHistoryDay(
                                item.date,
                                item.data
                            )
                    )
                    .join("")

                : `
                    <div class="card history-empty">

                        <div class="empty-icon">
                            📋
                        </div>

                        <h2>
                            История пока пуста
                        </h2>

                        <p>
                            Отмечайте выполненные
                            задачи — они появятся здесь.
                        </p>

                    </div>
                  `
        }

    `;
}


// ========================================
// TEXT
// ========================================

function pluralizeText(
    number,
    one,
    few,
    many
) {

    const n =
        Math.abs(number) % 100;

    const last =
        n % 10;


    if (
        n >= 11 &&
        n <= 19
    ) {

        return many;
    }


    if (
        last === 1
    ) {

        return one;
    }


    if (
        last >= 2 &&
        last <= 4
    ) {

        return few;
    }


    return many;
}


function formatCompletedText(
    count,
    monthName
) {

    return `
        ${count}
        ${pluralizeText(
            count,
            "выполнение",
            "выполнения",
            "выполнений"
        )}
        в ${monthName}
    `;
}


// ========================================
// MONTH TARGET
// ========================================

function getMonthlyTarget(
    history,
    month,
    taskId
) {

    for (
        const date in history
    ) {

        if (
            date.startsWith(
                month
            )
        ) {

            const tasks =
                history[date]?.tasks ||
                [];


            const task =
                tasks.find(
                    item =>
                        item.id ===
                        taskId
                );


            if (
                task?.targetPerMonth
            ) {

                return task.targetPerMonth;

            }

        }

    }


    return 8;
}


// ========================================
// MONTH COUNT
// ========================================

function countTaskForMonth(
    history,
    month,
    taskId
) {

    let count = 0;


    Object.keys(history)
        .forEach(
            date => {

                if (
                    !date.startsWith(
                        month
                    )
                ) {

                    return;
                }


                const tasks =
                    history[date]?.tasks ||
                    [];


                const task =
                    tasks.find(
                        item =>
                            item.id ===
                            taskId
                    );


                if (
                    task?.done === true
                ) {

                    count++;

                }

            }
        );


    return count;
}


// ========================================
// PREVIOUS MONTH
// ========================================

function getPreviousMonth(
    monthKey
) {

    const [
        year,
        month
    ] =
        monthKey
            .split("-")
            .map(Number);


    const date =
        new Date(
            year,
            month - 2,
            1
        );


    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        )

    ].join("-");
}


// ========================================
// MONTH NAME
// ========================================

function getMonthPrepositional(
    monthKey
) {

    const [
        year,
        month
    ] =
        monthKey
            .split("-")
            .map(Number);


    const date =
        new Date(
            year,
            month - 1,
            1
        );


    const monthNames = [

        "январе",
        "феврале",
        "марте",
        "апреле",
        "мае",
        "июне",
        "июле",
        "августе",
        "сентябре",
        "октябре",
        "ноябре",
        "декабре"

    ];


    return monthNames[
        date.getMonth()
    ];
}


// ========================================
// LAST 7 DAYS
// ========================================

function getLastDays(
    history,
    numberOfDays
) {

    const result = [];

    const today =
        new Date();


    for (
        let i = 0;
        i < numberOfDays;
        i++
    ) {

        const date =
            new Date(
                today
            );


        date.setDate(
            today.getDate() - i
        );


        const key =
            formatDateKey(
                date
            );


        if (
            history[key]
        ) {

            result.push({

                date: key,

                data:
                    history[key]

            });

        }

    }


    return result;
}


// ========================================
// HISTORY DAY UI
// ========================================

function createHistoryDay(
    date,
    dayData
) {

    const tasks =
        dayData?.tasks || [];


    const completed =
        tasks.filter(
            task =>
                task.done
        ).length;


    const total =
        tasks.length;


    return `

        <div class="card history-day">

            <div class="history-day-top">

                <div>

                    <div class="history-date">

                        ${
                            date === getTodayKey()
                                ? "Сегодня"
                                : formatDate(date)
                        }

                    </div>


                    <div class="history-count">

                        ${
                            completed
                        }
                        из
                        ${
                            total
                        }
                        выполнено

                    </div>

                </div>

            </div>


            <div class="history-task-list">

                ${
                    tasks
                        .map(
                            task => `

                                <div
                                    class="
                                        history-task
                                        ${
                                            task.done
                                                ? "history-task-done"
                                                : ""
                                        }
                                    "
                                >

                                    <span>
                                        ${task.icon}
                                    </span>


                                    <span>
                                        ${escapeHtml(
                                            task.name
                                        )}
                                    </span>


                                    <span
                                        class="history-check"
                                    >

                                        ${
                                            task.done
                                                ? "✓"
                                                : "—"
                                        }

                                    </span>

                                </div>

                            `
                        )
                        .join("")
                }

            </div>

        </div>

    `;
}


// ========================================
// DATE FORMAT
// ========================================

function formatDate(
    dateString
) {

    const [
        year,
        month,
        day
    ] =
        dateString.split("-");


    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );


    return date.toLocaleDateString(
        "ru-RU",
        {
            day: "numeric",
            month: "long"
        }
    );
}


// ========================================
// SECURITY
// ========================================

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;
}