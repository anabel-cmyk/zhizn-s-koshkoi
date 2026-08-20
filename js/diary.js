// ========================================
// ЖИЗНЬ С КОШКОЙ
// DIARY.JS
// Дневник и статистика
// ========================================

// ========================================
// DIARY
// ========================================

const HISTORY_KEY = "taskHistory";


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

                    done:
                        task.done === true

                })
            )

    };


    saveHistory(history);
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


    const activeId =
        getActiveCatId();


    return `

        <div class="diary-cat-switcher">

            ${
                cats
                    .map(
                        cat => `

                            <button
                                class="
                                    diary-cat-button
                                    ${
                                        cat.id === activeId
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

function switchDiaryCat(catId) {

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


    setActiveCatId(catId);

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


    const cat =
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


    const history =
        getHistory();


    const catHistory =
        getCatHistory(
            history,
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
            План и история ухода за
            <strong>
                ${escapeHtml(cat.name)}
            </strong>
        </div>


        ${
            statisticTasks.length

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
                            Отмечайте выполненные
                            задачи — они появятся здесь.
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
// GET CAT HISTORY
// ========================================

function getCatHistory(
    history,
    catId
) {

    if (!history) {
        return {};
    }


    /*
     * Новый формат:
     *
     * history[catId][date]
     */

    if (
        history[catId] &&
        typeof history[catId] === "object"
    ) {

        return history[catId];

    }


    /*
     * Старый формат:
     *
     * history[date]
     *
     * Используем его только для
     * активной кошки.
     */

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
                history[date]?.tasks ||
                [];


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

                    knownIds.add(
                        task.id
                    );

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

        saveHistory(history);

    }
}