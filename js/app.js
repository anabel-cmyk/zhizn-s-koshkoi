// ========================================
// ЖИЗНЬ С КОШКОЙ
// APP.JS
// 0.9.6 — запуск, навигация и UI hooks
// ========================================


// ========================================
// APP START
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    migrateOldCat();
    renderApp();
});


function renderApp() {

    const cats =
        getCats();

    if (!cats.length) {
        renderEmptyState();
        return;
    }

    renderCatDashboard(
        getActiveCat()
    );
}


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
                Уход, здоровье и поведение — в одном месте.
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
                Создадим её профиль и постепенно соберём всю важную информацию.
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


function renderCatDashboard(cat) {

    const content =
        document.getElementById(
            "content"
        );

    const tasks =
        getDailyTasks(
            cat.id
        );

    const profile =
        typeof getCatHealth === "function"
            ? getCatHealth(cat.id)
            : { avatar: "" };

    const avatar =
        cat.avatar ||
        profile.avatar;

    const avatarMarkup =
        avatar
            ? `
                <img
                    src="${avatar}"
                    alt="${escapeHtml(cat.name)}"
                    class="cat-avatar-image"
                >
              `
            : "🐈";

    content.innerHTML = `

        <div class="welcome">

            <h1>
                Сегодня ${escapeHtml(cat.name)}:
            </h1>

        </div>

        ${createCatSwitcher()}

        <div class="card cat-card">

            <button
                class="cat-avatar cat-avatar-button"
                onclick="openModalWithCurrentCat()"
                aria-label="Открыть профиль"
            >
                ${avatarMarkup}
            </button>

            <div class="cat-info">

                <h2>
                    ${escapeHtml(cat.name)}
                </h2>

                <p>
                    ${escapeHtml(
                        getCatAgeText(cat)
                    )}
                </p>

            </div>

        </div>

        <div class="section-title">
            План ухода
        </div>

        <div class="card">
            ${tasks
                .map(
                    task => createTask(task)
                )
                .join("")}
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
