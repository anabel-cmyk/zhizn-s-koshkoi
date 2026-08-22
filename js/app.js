// ========================================
// ЖИЗНЬ С КОШКОЙ
// APP.JS
// 0.9.4 — запуск, навигация и UI hooks
// ========================================

const LEGACY_TASK_SHARED_SETTINGS_KEY = "taskSharedSettings";


// ========================================
// LEGACY TASK SETTINGS MIGRATION
// ========================================

function migrateLegacyTaskSharedSettings() {

    const saved =
        localStorage.getItem(
            LEGACY_TASK_SHARED_SETTINGS_KEY
        );

    if (!saved) {
        return;
    }

    const cats =
        typeof getCats === "function"
            ? getCats()
            : [];

    // Если кошек ещё нет, не удаляем старые настройки.
    // Миграция выполнится после создания первой кошки.
    if (!cats.length) {
        return;
    }

    try {

        const settings =
            JSON.parse(saved);

        if (
            !settings ||
            typeof settings !== "object" ||
            Array.isArray(settings)
        ) {
            localStorage.removeItem(
                LEGACY_TASK_SHARED_SETTINGS_KEY
            );
            return;
        }

        Object.keys(settings).forEach(
            taskId => {

                const shared =
                    settings[taskId] === true;

                cats.forEach(
                    cat => {

                        if (
                            typeof getDailyTasks !== "function" ||
                            typeof saveDailyTasks !== "function"
                        ) {
                            return;
                        }

                        const tasks =
                            getDailyTasks(cat.id);

                        const task =
                            tasks.find(
                                item =>
                                    item.id === taskId
                            );

                        if (!task) {
                            return;
                        }

                        task.shared = shared;

                        saveDailyTasks(
                            getTodayKey(),
                            tasks,
                            cat.id
                        );
                    }
                );
            }
        );

        // После успешной миграции старое хранилище больше не нужно.
        localStorage.removeItem(
            LEGACY_TASK_SHARED_SETTINGS_KEY
        );

    } catch {

        // При повреждённых данных ничего не удаляем,
        // чтобы не потерять старые настройки.

    }
}


// ========================================
// APP START
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    migrateOldCat();

    migrateLegacyTaskSharedSettings();

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
