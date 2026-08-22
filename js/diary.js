// ========================================
// ЖИЗНЬ С КОШКОЙ
// DIARY.JS
// MVP 0.9.3
//
// Дневник и статистика
// + выбор кошки
// + общая картина
// ========================================

const HISTORY_KEY = "taskHistory";

let diarySelectedCatId = null;


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


// ========================================
// SAVE DAY
// ========================================

function saveDayToHistory(
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


    const history =
        getHistory();


    if (!history[catId]) {

        history[catId] = {};

    }


    history[catId][date] = {

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

                    shared:
                        task.shared === true,

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
// DIARY CAT SWITCHER
// ========================================

function createDiaryCatSwitcher() {

    const cats =
        getCats();


    if (!cats.length) {
        return "";
    }


    const selected =
        diarySelectedCatId ||
        getActiveCatId();


    return `

        <div class="diary-cat-switcher">

            <button
                class="
                    diary-cat-button
                    ${
                        selected === "all"
                            ? "active"
                            : ""
                    }
                "
                onclick="
                    switchDiaryCat('all')
                "
            >

                <span>
                    🐾
                </span>

                <span>
                    Все кошки
                </span>

            </button>


            ${
                cats
                    .map(
                        cat => `

                            <button
                                class="
                                    diary-cat-button
                                    ${
                                        selected === cat.id
                                            ? "active"
                                            : ""
                                    }
                                "
                                onclick="
                                    switchDiaryCat(
                                        '${cat.id}'
                                    )
                                "
                            >

                                <span>
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

    `;
}


// ========================================
// SWITCH DIARY CAT
// ========================================

function switchDiaryCat(
    catId
) {

    if (catId === "all") {

        diarySelectedCatId =
            "all";

        openHistory();

        return;
    }


    const cats =
        getCats();


    const exists =
        cats.some(
            cat =>
                cat.id === catId
        );


    if (!exists) {
        return;
    }


    diarySelectedCatId =
        catId;


    setActiveCatId(
        catId
    );


    openHistory();
}


// ========================================
// OPEN DIARY
// ========================================

function openHistory() {

    const content =
        document.getElementById(
            "content"
        );


    if (!content) {
        return;
    }


    const cats =
        getCats();


    if (!cats.length) {

        renderEmptyState();

        return;
    }


    const selected =
        diarySelectedCatId ||
        getActiveCatId();


    const history =
        getHistory();


    // ====================================
    // ALL CATS
    // ====================================

    if (selected === "all") {

        renderAllCatsDiary(
            content,
            cats,
            history
        );

        return;
    }


    // ====================================
    // SINGLE CAT
    // ====================================

    const cat =
        cats.find(
            item =>
                item.id === selected
        ) ||
        getActiveCat();


    if (!cat) {

        renderEmptyState();

        return;
    }


    const today =
        getTodayKey();


    const currentTasks =
        getDailyTasks(
            cat.id
        );


    saveDayToHistory(
        cat.id,
        today,
        currentTasks
    );


    const updatedHistory =
        getHistory();


    const catHistory =
        getCatHistory(
            updatedHistory,
            cat.id
        );


    const currentMonth =
        today.slice(0, 7);


    const previousMonth =
        getPreviousMonth(
            currentMonth
        );


    const statisticTasks =
        getStatisticTasks(
            currentTasks,
            catHistory,
            currentMonth
        );


    const hasEntries =
        hasDiaryEntries(
            catHistory
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


        ${createDiaryCatSwitcher()}


        <div class="diary-subtitle">

            История ухода за
            <strong>
                ${escapeHtml(
                    cat.name
                )}
            </strong>

        </div>


        ${
            statisticTasks.length ||
            hasEntries

                ? statisticTasks
                    .map(
                        task =>
                            createStatisticCard(
                                task,
                                catHistory,
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
                            Отмечайте выполненные задачи —
                            <br>
                            они появятся здесь.
                        </p>

                    </div>

                  `
        }


        <div class="section-title">
            Последние 7 дней
        </div>


        ${createLastSevenDays(
            catHistory
        )}

    `;
}


// ========================================
// ALL CATS DIARY
// ========================================

function renderAllCatsDiary(
    content,
    cats,
    history
) {

    const today =
        getTodayKey();


    const currentMonth =
        today.slice(0, 7);


    const previousMonth =
        getPreviousMonth(
            currentMonth
        );


    const allTasks =
        getAllCatsStatisticTasks(
            cats,
            history,
            currentMonth
        );


    const hasEntries =
        cats.some(
            cat =>
                hasDiaryEntries(
                    getCatHistory(
                        history,
                        cat.id
                    )
                )
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


        ${createDiaryCatSwitcher()}


        <div class="diary-subtitle">

            Общая картина ухода за всеми кошками

        </div>


        ${
            allTasks.length ||
            hasEntries

                ? allTasks
                    .map(
                        item =>
                            createAllCatsStatisticCard(
                                item,
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
                            Отмечайте выполненные задачи —
                            <br>
                            они появятся здесь.
                        </p>

                    </div>

                  `
        }


        <div class="section-title">
            Последние 7 дней
        </div>


        ${createAllCatsLastSevenDays(
            cats,
            history
        )}

    `;
}


// ========================================
// GET CAT HISTORY
// ========================================

function getCatHistory(
    history,
    catId
) {

    if (!history) {
        return {};
    }


    if (
        history[catId] &&
        typeof history[catId] === "object"
    ) {

        return history[catId];

    }


    // Старый формат.

    const dates =
        Object.keys(history);


    const looksOld =
        dates.some(
            key =>
                /^\d{4}-\d{2}-\d{2}$/.test(
                    key
                )
        );


    if (looksOld) {

        return history;

    }


    return {};
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

    const knownIds =
        new Set();


    currentTasks.forEach(task => {

        if (
            task.statistics === "none"
        ) {
            return;
        }


        knownIds.add(
            task.id
        );


        const count =
            countTaskForMonth(
                history,
                currentMonth,
                task.id
            );


        if (count > 0) {

            result.push(
                task
            );

        }

    });


    Object.keys(history)
        .forEach(date => {

            const tasks =
                history[date]?.tasks ||
                [];


            tasks.forEach(task => {

                if (
                    knownIds.has(
                        task.id
                    )
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

                    result.push(
                        task
                    );

                    knownIds.add(
                        task.id
                    );

                }

            });

        });


    return result;
}


// ========================================
// ALL CATS STATISTIC TASKS
// ========================================

function getAllCatsStatisticTasks(
    cats,
    history,
    currentMonth
) {

    const result = [];

    const knownIds =
        new Set();


    cats.forEach(
        cat => {

            const catHistory =
                getCatHistory(
                    history,
                    cat.id
                );


            const tasks =
                getTasksForHistory(
                    catHistory
                );


            tasks.forEach(task => {

                if (
                    task.statistics ===
                    "none"
                ) {
                    return;
                }


                if (
                    knownIds.has(
                        task.id
                    )
                ) {
                    return;
                }


                const total =
                    countTaskAcrossCats(
                        cats,
                        history,
                        currentMonth,
                        task.id,
                        task.shared === true
                    );


                if (total > 0) {

                    result.push(
                        task
                    );

                    knownIds.add(
                        task.id
                    );

                }

            });

        }
    );


    return result;
}


// ========================================
// GET TASKS FROM HISTORY
// ========================================

function getTasksForHistory(
    history
) {

    const result = [];

    const ids =
        new Set();


    Object.keys(history)
        .forEach(date => {

            const tasks =
                history[date]?.tasks ||
                [];


            tasks.forEach(task => {

                if (
                    ids.has(task.id)
                ) {
                    return;
                }


                ids.add(
                    task.id
                );


                result.push(
                    task
                );

            });

        });


    return result;
}


// ========================================
// ALL CATS COUNT
// ========================================

function countTaskAcrossCats(
    cats,
    history,
    month,
    taskId,
    shared
) {

    // Общая задача считается один раз.
    if (shared) {

        for (
            const cat of cats
        ) {

            const catHistory =
                getCatHistory(
                    history,
                    cat.id
                );


            const count =
                countTaskForMonth(
                    catHistory,
                    month,
                    taskId
                );


            if (count > 0) {

                return count;

            }

        }


        return 0;
    }


    // Индивидуальная задача —
    // складываем по кошкам.

    let total = 0;


    cats.forEach(
        cat => {

            const catHistory =
                getCatHistory(
                    history,
                    cat.id
                );


            total +=
                countTaskForMonth(
                    catHistory,
                    month,
                    taskId
                );

        }
    );


    return total;
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
        task.statistics ===
        "monthly";


    const isSessions =
        task.statistics ===
        "sessions";


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


    let caption = "";


    if (isMonthly) {

        caption =
            `выполнено в ${monthName}`;

    } else if (isSessions) {

        caption =
            getSessionsCaption(
                currentCount,
                monthName
            );

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
                                class="
                                    history-progress
                                "
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
                                currentCount >=
                                target

                                    ? `

                                        <div
                                            class="
                                                goal-message
                                            "
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

                        <div
                            class="
                                previous-result
                            "
                        >

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

                                            : getSessionsCaption(
                                                previousCount,
                                                previousMonthName
                                            )

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
// ALL CATS STATISTIC CARD
// ========================================

function createAllCatsStatisticCard(
    task,
    history,
    currentMonth,
    previousMonth
) {

    const cats =
        getCats();


    const currentCount =
        countTaskAcrossCats(
            cats,
            history,
            currentMonth,
            task.id,
            task.shared === true
        );


    const previousCount =
        countTaskAcrossCats(
            cats,
            history,
            previousMonth,
            task.id,
            task.shared === true
        );


    const monthName =
        getMonthPrepositional(
            currentMonth
        );


    const previousMonthName =
        getMonthPrepositional(
            previousMonth
        );


    const isMonthly =
        task.statistics ===
        "monthly";


    const isSessions =
        task.statistics ===
        "sessions";


    let caption = "";


    if (isMonthly) {

        caption =
            `выполнено в ${monthName}`;

    } else if (isSessions) {

        caption =
            getSessionsCaption(
                currentCount,
                monthName
            );

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


                    ${
                        task.shared
                            ? `
                                <small class="statistic-shared-label">
                                    Общее для всех кошек
                                </small>
                              `
                            : ""
                    }

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
                previousCount > 0

                    ? `

                        <div
                            class="
                                previous-result
                            "
                        >

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
                                        isSessions
                                            ? getSessionsCaption(
                                                previousCount,
                                                previousMonthName
                                            )

                                            : `выполнено в ${previousMonthName}`
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
// SESSIONS CAPTION
// ========================================

function getSessionsCaption(
    count,
    monthName
) {

    let word;

    const n =
        Math.abs(count) % 100;

    const last =
        n % 10;


    if (
        n >= 11 &&
        n <= 19
    ) {

        word =
            "игровых сессий";

    } else if (
        last === 1
    ) {

        word =
            "игровая сессия";

    } else if (
        last >= 2 &&
        last <= 4
    ) {

        word =
            "игровые сессии";

    } else {

        word =
            "игровых сессий";

    }


    return `${word} в ${monthName}`;
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
                history[date]?.tasks ||
                [];


            const task =
                tasks.find(
                    item =>
                        item.id === taskId
                );


            if (
                task?.done === true
            ) {

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
            history[date]?.tasks ||
            [];


        const task =
            tasks.find(
                item =>
                    item.id === taskId
            );


        if (
            task?.targetPerMonth
        ) {

            return task.targetPerMonth;

        }

    }


    return 8;
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

function createLastSevenDays(
    history
) {

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
// ALL CATS LAST 7 DAYS
// ========================================

function createAllCatsLastSevenDays(
    cats,
    history
) {

    const result = [];

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


        const merged =
            mergeHistoryForDate(
                cats,
                history,
                key
            );


        if (
            merged.tasks.length
        ) {

            result.push(
                createHistoryDay(
                    key,
                    merged
                )
            );

        }

    }


    if (!result.length) {

        return `

            <div class="card history-empty">

                <p>
                    Отмеченные задачи появятся здесь.
                </p>

            </div>

        `;

    }


    return result.join("");
}


// ========================================
// MERGE ONE DAY FOR ALL CATS
// ========================================

function mergeHistoryForDate(
    cats,
    history,
    date
) {

    const tasks = [];

    const seenShared =
        new Set();


    cats.forEach(
        cat => {

            const catHistory =
                getCatHistory(
                    history,
                    cat.id
                );


            const day =
                catHistory[date];


            if (!day) {
                return;
            }


            const dayTasks =
                day.tasks ||
                [];


            dayTasks.forEach(
                task => {

                    // Общую задачу показываем
                    // только один раз.

                    if (
                        task.shared === true
                    ) {

                        if (
                            seenShared.has(
                                task.id
                            )
                        ) {

                            return;

                        }


                        seenShared.add(
                            task.id
                        );


                        tasks.push({
                            ...task
                        });

                        return;
                    }


                    // Индивидуальная задача
                    // сохраняется отдельно.

                    tasks.push({
                        ...task,
                        catName:
                            cat.name
                    });

                }
            );

        }
    );


    return {
        tasks
    };
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
                            date ===
                            getTodayKey()

                                ? "Сегодня"

                                : date === getYesterdayKey()
                                    ? "Вчера"
                                    : formatDate(
                                        date
                                    )
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

                                        ${
                                            task.catName
                                                ? `
                                                    <small class="history-cat-name">
                                                        ${escapeHtml(
                                                            task.catName
                                                        )}
                                                    </small>
                                                  `
                                                : ""
                                        }

                                    </span>


                                    <span
                                        class="
                                            history-check
                                        "
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
// DELETE CAT HISTORY
// ========================================

function deleteCatHistory(
    catId
) {

    if (!catId) {
        return;
    }


    const history =
        getHistory();


    if (
        Object.prototype.hasOwnProperty.call(
            history,
            catId
        )
    ) {

        delete history[catId];

        saveHistory(
            history
        );

    }
}


// ========================================
// HAS DIARY ENTRIES
// ========================================

function hasDiaryEntries(
    history
) {

    if (!history) {
        return false;
    }


    return Object.keys(history).some(
        date => {

            const tasks =
                history[date]?.tasks ||
                [];


            return tasks.some(
                task =>
                    task.done === true
            );

        }
    );

}


// ========================================
// DATE HELPERS
// ========================================

function getTodayKey() {

    return formatDateKey(
        new Date()
    );
}


function getYesterdayKey() {

    const date =
        new Date();


    date.setDate(
        date.getDate() - 1
    );


    return formatDateKey(
        date
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