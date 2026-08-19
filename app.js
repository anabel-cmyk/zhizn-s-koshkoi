// ========================================
// ЖИЗНЬ С КОШКОЙ
// MVP 0.8.1
// Профиль + несколько кошек + задачи + дневник
// ========================================

const CATS_KEY = "cats";
const ACTIVE_CAT_KEY = "activeCatId";
const TASKS_KEY = "dailyTasks";
const HISTORY_KEY = "taskHistory";


// ========================================
// START
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    migrateOldCat();
    renderApp();
});


// ========================================
// CATS
// ========================================

function getCats() {

    const saved = localStorage.getItem(CATS_KEY);

    if (!saved) {
        return [];
    }

    try {
        const cats = JSON.parse(saved);

        return Array.isArray(cats)
            ? cats
            : [];

    } catch {
        return [];
    }
}


function saveCats(cats) {

    localStorage.setItem(
        CATS_KEY,
        JSON.stringify(cats)
    );
}


function getActiveCatId() {

    return localStorage.getItem(
        ACTIVE_CAT_KEY
    );
}


function setActiveCatId(id) {

    localStorage.setItem(
        ACTIVE_CAT_KEY,
        id
    );
}


function getActiveCat() {

    const cats = getCats();

    if (!cats.length) {
        return null;
    }

    const activeId = getActiveCatId();

    return (
        cats.find(cat => cat.id === activeId)
        || cats[0]
    );
}


// ========================================
// MIGRATION FROM MVP 0.7
// ========================================

function migrateOldCat() {

    const oldCat = localStorage.getItem("cat");

    if (!oldCat) {
        return;
    }

    const existingCats = getCats();

    if (existingCats.length) {
        return;
    }

    try {

        const cat = JSON.parse(oldCat);

        const migratedCat = {
            ...cat,
            id: createId(),
            createdAt:
                cat.createdAt
                || new Date().toISOString()
        };

        saveCats([migratedCat]);

        setActiveCatId(
            migratedCat.id
        );

    } catch {
        // ничего не делаем
    }
}


function createId() {

    return (
        "cat_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}


// ========================================
// MODAL
// ========================================

function openModal() {

    const modal =
        document.getElementById("modal");

    if (!modal) {
        return;
    }

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    resetForm();

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

    if (!modal) {
        return;
    }

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

    const name =
        document.getElementById("catName");

    const birthDate =
        document.getElementById("catBirthDate");

    const ageValue =
        document.getElementById("catAgeValue");

    const ageUnit =
        document.getElementById("catAgeUnit");

    if (name) {
        name.value = "";
    }

    if (birthDate) {
        birthDate.value = "";
    }

    if (ageValue) {
        ageValue.value = "";
    }

    if (ageUnit) {
        ageUnit.value = "years";
    }

    showBirthDateInput();
}


function showAgeInput() {

    const birthDateField =
        document.getElementById("birthDateField");

    const ageField =
        document.getElementById("ageField");

    const birthDate =
        document.getElementById("catBirthDate");

    const ageValue =
        document.getElementById("catAgeValue");

    if (birthDateField) {
        birthDateField.hidden = true;
    }

    if (ageField) {
        ageField.hidden = false;
    }

    if (birthDate) {
        birthDate.value = "";
    }

    if (ageValue) {
        ageValue.focus();
    }
}


function showBirthDateInput() {

    const birthDateField =
        document.getElementById("birthDateField");

    const ageField =
        document.getElementById("ageField");

    const ageValue =
        document.getElementById("catAgeValue");

    if (birthDateField) {
        birthDateField.hidden = false;
    }

    if (ageField) {
        ageField.hidden = true;
    }

    if (ageValue) {
        ageValue.value = "";
    }
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
        document.getElementById("catBirthDate")
            .value;

    const ageValue =
        document.getElementById("catAgeValue")
            .value;

    const ageUnit =
        document.getElementById("catAgeUnit")
            .value;

    const ageField =
        document.getElementById("ageField");


    if (!name) {

        alert("Введите имя кошки");

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

        alert("Укажите возраст кошки");

        return;
    }


    const cats = getCats();

    const activeCat =
        getActiveCat();


    const cat = {

        id:
            activeCat?.id
            || createId(),

        name,

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
            activeCat?.createdAt
            || new Date().toISOString()

    };


    const index =
        cats.findIndex(
            item =>
                item.id === cat.id
        );


    if (index >= 0) {

        cats[index] = cat;

    } else {

        cats.push(cat);

    }


    saveCats(cats);

    setActiveCatId(cat.id);

    closeModal();

    renderApp();
}


// ========================================
// ADD NEW CAT
// ========================================

function addNewCat() {

    resetForm();

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


// ========================================
// EDIT CURRENT CAT
// ========================================

function openModalWithCurrentCat() {

    const cat = getActiveCat();

    if (!cat) {

        openModal();

        return;
    }


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
        document.getElementById("modal");

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


// ========================================
// SWITCH CAT
// ========================================

function switchCat(id) {

    if (!id) {
        return;
    }

    setActiveCatId(id);

    renderApp();
}


// ========================================
// APP
// ========================================

function renderApp() {

    const cats = getCats();

    if (!cats.length) {

        renderEmptyState();

        return;
    }


    const cat = getActiveCat();

    renderCatDashboard(cat);
}


// ========================================
// EMPTY
// ========================================

function renderEmptyState() {

    const content =
        document.getElementById("content");

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
// DASHBOARD
// ========================================

function renderCatDashboard(cat) {

    const content =
        document.getElementById("content");

    const tasks =
        getDailyTasks();


    content.innerHTML = `

        <div class="welcome">

            <h1>
                Сегодня
            </h1>

            <p class="welcome-subtitle">
                План ухода за
                ${escapeHtml(cat.name)}.
            </p>

        </div>


        ${createCatSwitcher()}


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

            ${
                tasks
                    .map(task => createTask(task))
                    .join("")
            }

        </div>


        <button
            class="button"
            onclick="openHistory()"
        >
            Дневник
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
// CAT SWITCHER
// ========================================

function createCatSwitcher() {

    const cats = getCats();

    if (!cats.length) {
        return "";
    }


    const activeId =
        getActiveCatId();


    return `

        <div class="cat-switcher">

            <div class="cat-switcher-list">

                ${
                    cats
                        .map(
                            cat => `

                                <button
                                    class="
                                        cat-switcher-item
                                        ${
                                            cat.id === activeId
                                                ? "active"
                                                : ""
                                        }
                                    "
                                    onclick="
                                        switchCat(
                                            '${cat.id}'
                                        )
                                    "
                                >

                                    <span
                                        class="cat-switcher-avatar"
                                    >
                                        🐈
                                    </span>

                                    <span>
                                        ${escapeHtml(
                                            cat.name
                                        )}
                                    </span>

                                </button>

                            `
                        )
                        .join("")
                }

            </div>


            <button
                class="add-cat-button"
                onclick="addNewCat()"
            >
                ＋ Добавить кошку
            </button>

        </div>

    `;
}


// ========================================
// AGE
// ========================================

function getCatAgeText(cat) {

    if (cat.birthDate) {

        const birth =
            new Date(
                `${cat.birthDate}T12:00:00`
            );

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
            now.getDate() <
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


        return formatYears(years);
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


    if (last === 1) {

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


function formatDateKey(date) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");
}


// ========================================
// TASKS
// ========================================

function getDailyTasks() {

    const today =
        getTodayKey();

    const saved =
        localStorage.getItem(TASKS_KEY);


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


    if (data.date !== today) {

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

            date,
            tasks

        })
    );
}


// ========================================
// TASK UI
// ========================================

function createTask(task) {

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

    `;
}


// ========================================
// TOGGLE
// ========================================

function toggleTask(taskId) {

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

        return JSON.parse(saved);

    } catch {

        return {};

    }
}


function saveHistory(history) {

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );
}


function saveDayToHistory(
    date,
    tasks
) {

    if (!date || !tasks) {
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

                    statistics:
                        task.statistics ||
                        null,

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


    saveHistory(history);
}


// ========================================
// DIARY
// ========================================

function openHistory() {

    const content =
        document.getElementById("content");


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
        today.slice(0, 7);


    const previousMonth =
        getPreviousMonth(
            currentMonth
        );


    const statisticTasks =
        getStatisticTasks(
            currentTasks,
            history,
            currentMonth
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
                Дневник
            </h1>

        </div>


        ${
            statisticTasks.length

                ? statisticTasks
                    .map(
                        task =>
                            createStatisticCard(
                                task,
                                history,
                                currentMonth,
                                previousMonth
                            )
                    )
                    .join("")

                : `

                    <div class="card history-empty">

                        <div class="empty-icon">
                            📋
                        </div>

                        <h2>
                            Дневник пока пуст
                        </h2>

                        <p>
                            Отмечайте выполненные
                            задачи — они появятся здесь.
                        </p>

                    </div>

                  `
        }


        <div class="section-title">
            Последние 7 дней
        </div>


        ${createLastSevenDays(history)}

    `;
}


// ========================================
// STATISTICS
// ========================================

function getStatisticTasks(
    currentTasks,
    history,
    currentMonth
) {

    const result = [];

    const knownIds = new Set();


    currentTasks.forEach(task => {

        if (
            task.statistics ===
            "none"
        ) {
            return;
        }


        knownIds.add(task.id);


        const count =
            countTaskForMonth(
                history,
                currentMonth,
                task.id
            );


        if (count > 0) {

            result.push(task);

        }

    });


    Object.keys(history)
        .forEach(date => {

            const tasks =
                history[date]?.tasks || [];


            tasks.forEach(task => {

                if (
                    knownIds.has(task.id)
                ) {
                    return;
                }


                if (
                    task.statistics ===
                    "none"
                ) {
                    return;
                }


                const count =
                    countTaskForMonth(
                        history,
                        currentMonth,
                        task.id
                    );


                if (count > 0) {

                    result.push(task);

                    knownIds.add(task.id);

                }

            });

        });


    return result;
}


// ========================================
// STATISTIC CARD
// ========================================

function createStatisticCard(
    task,
    history,
    currentMonth,
    previousMonth
) {

    const currentCount =
        countTaskForMonth(
            history,
            currentMonth,
            task.id
        );


    const previousCount =
        countTaskForMonth(
            history,
            previousMonth,
            task.id
        );


    const monthName =
        getMonthPrepositional(
            currentMonth
        );


    const previousMonthName =
        getMonthPrepositional(
            previousMonth
        );


    const target =
        task.targetPerMonth ||
        getMonthlyTarget(
            history,
            currentMonth,
            task.id
        );


    const isMonthly =
        task.statistics === "monthly";


    const isSessions =
        task.statistics === "sessions";


    let progress = null;


    if (
        isMonthly &&
        target
    ) {

        progress =
            Math.min(
                currentCount /
                target *
                100,
                100
            );

    }


    /*
     * ВАЖНО:
     * Большая цифра теперь сама является
     * основным показателем.
     *
     * В подписи не повторяем эту цифру.
     */

    let caption = "";


    if (isMonthly) {

        caption =
            `выполнено в ${monthName}`;

    } else if (isSessions) {

        caption =
            `игровые сессии в ${monthName}`;

    }


    return `

        <div class="card statistic-card">

            <div class="statistic-top">

                <div class="statistic-icon">
                    ${task.icon}
                </div>


                <div class="statistic-title">

                    <h2>
                        ${escapeHtml(
                            task.name
                        )}
                    </h2>

                    <span>
                        ${escapeHtml(
                            task.description
                        )}
                    </span>

                </div>

            </div>


            <div class="statistic-main">

                <div class="statistic-number">
                    ${currentCount}
                </div>


                <div class="statistic-caption">
                    ${caption}
                </div>

            </div>


            ${
                isMonthly

                    ? `

                        <div class="statistic-goal">

                            <div
                                class="
                                    statistic-goal-line
                                "
                            >

                                <span>
                                    Цель на месяц
                                </span>

                                <strong>
                                    ${target}+
                                </strong>

                            </div>


                            <div
                                class="history-progress"
                            >

                                <div
                                    class="
                                        history-progress-fill
                                        ${
                                            currentCount >=
                                            target
                                                ? "goal-reached"
                                                : ""
                                        }
                                    "
                                    style="
                                        width:
                                        ${progress}%
                                    "
                                ></div>

                            </div>


                            ${
                                currentCount >= target

                                    ? `
                                        <div
                                            class="goal-message"
                                        >
                                            ✓ Цель достигнута
                                        </div>
                                      `

                                    : ""
                            }

                        </div>

                      `

                    : ""

            }


            ${
                previousCount > 0

                    ? `

                        <div class="previous-result">

                            <div
                                class="
                                    previous-result-label
                                "
                            >
                                Прошлый месяц
                            </div>


                            <div
                                class="
                                    previous-result-content
                                "
                            >

                                <strong>
                                    ${previousCount}
                                </strong>


                                <span>

                                    ${
                                        isMonthly
                                            ? (
                                                previousCount >=
                                                (
                                                    task.targetPerMonth ||
                                                    getMonthlyTarget(
                                                        history,
                                                        previousMonth,
                                                        task.id
                                                    )
                                                )
                                                    ? "цель достигнута"
                                                    : `выполнено в ${previousMonthName}`
                                            )

                                            : `игровые сессии в ${previousMonthName}`

                                    }

                                </span>

                            </div>


                        </div>

                      `

                    : ""

            }

        </div>

    `;
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
        .forEach(date => {

            if (
                !date.startsWith(month)
            ) {
                return;
            }


            const tasks =
                history[date]?.tasks || [];


            const task =
                tasks.find(
                    item =>
                        item.id === taskId
                );


            if (task?.done === true) {
                count++;
            }

        });


    return count;
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
            !date.startsWith(month)
        ) {
            continue;
        }


        const tasks =
            history[date]?.tasks || [];


        const task =
            tasks.find(
                item =>
                    item.id === taskId
            );


        if (task?.targetPerMonth) {

            return task.targetPerMonth;

        }

    }


    return 8;
}


// ========================================
// PREVIOUS MONTH
// ========================================

function getPreviousMonth(monthKey) {

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
        ).padStart(2, "0")

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

function createLastSevenDays(history) {

    const days = [];

    const today =
        new Date();


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(today);


        date.setDate(
            today.getDate() - i
        );


        const key =
            formatDateKey(date);


        if (history[key]) {

            days.push(
                createHistoryDay(
                    key,
                    history[key]
                )
            );

        }

    }


    if (!days.length) {

        return `

            <div class="card history-empty">

                <p>
                    Отмеченные задачи появятся здесь.
                </p>

            </div>

        `;

    }


    return days.join("");
}


// ========================================
// HISTORY DAY
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

                        ${completed}
                        из
                        ${total}
                        задач выполнено

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

function formatDate(dateString) {

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

function escapeHtml(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value;


    return div.innerHTML;
}