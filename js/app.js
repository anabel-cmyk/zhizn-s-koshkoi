// ========================================
// ЖИЗНЬ С КОШКОЙ
// APP.JS
// Запуск и отображение приложения
// ========================================

// ========================================
// START
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        migrateOldCat();

        renderApp();

    }
);


// ========================================
// APP
// ========================================

function renderApp() {

    const cats =
        getCats();


    if (!cats.length) {

        renderEmptyState();

        return;
    }


    const cat =
        getActiveCat();


    renderCatDashboard(
        cat
    );
}


// ========================================
// EMPTY
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
// DASHBOARD
// ========================================

function renderCatDashboard(
    cat
) {

    const content =
        document.getElementById(
            "content"
        );


    const tasks =
        getDailyTasks(
            cat.id
        );


    content.innerHTML = `

        <div class="welcome">

            <h1>
                Сегодня ${escapeHtml(
                    cat.name
                )}:
            </h1>

        </div>


        ${createCatSwitcher()}


        <div class="card cat-card">

            <div class="cat-avatar">
                🐈
            </div>


            <div class="cat-info">

                <h2>
                    ${escapeHtml(
                        cat.name
                    )}
                </h2>


                <p>
                    ${getCatAgeText(
                        cat
                    )}
                </p>

            </div>

        </div>


        <div class="section-title">
            План ухода
        </div>


        <div class="card">

            ${
                tasks
                    .map(
                        task =>
                            createTask(task)
                    )
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
            class="
                button
                button-secondary
            "
            onclick="
                openModalWithCurrentCat()
            "
        >
            Изменить профиль
        </button>

    `;
}


// ========================================
// AGE
// ========================================

function getCatAgeText(
    cat
) {

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


        return formatYears(
            years
        );
    }


    if (
        cat.ageValue !== null &&
        cat.ageValue !== undefined
    ) {

        if (
            cat.ageUnit ===
            "months"
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


function formatYears(
    value
) {

    return pluralize(
        value,
        "год",
        "года",
        "лет"
    );
}


function formatMonths(
    value
) {

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