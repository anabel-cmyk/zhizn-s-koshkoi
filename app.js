// ========================================
// ЖИЗНЬ С КОШКОЙ
// MVP 0.1
// ========================================


// ---------- INITIALIZATION ----------

document.addEventListener("DOMContentLoaded", () => {
    renderApp();
});


// ---------- MODAL ----------

function openModal() {

    const modal = document.getElementById("modal");

    modal.classList.add("active");

    modal.setAttribute("aria-hidden", "false");

    setTimeout(() => {

        document
            .getElementById("catName")
            .focus();

    }, 100);
}


function closeModal() {

    const modal = document.getElementById("modal");

    modal.classList.remove("active");

    modal.setAttribute("aria-hidden", "true");

    document.getElementById("catName").value = "";
    document.getElementById("catAge").value = "";
}


// ---------- CAT PROFILE ----------

function saveCat() {

    const name =
        document
            .getElementById("catName")
            .value
            .trim();

    const age =
        document
            .getElementById("catAge")
            .value
            .trim();


    if (!name) {

        alert("Введите имя кошки");

        return;
    }


    const cat = {

        name: name,

        age: age || "Возраст не указан",

        createdAt:
            new Date().toISOString()

    };


    localStorage.setItem(
        "cat",
        JSON.stringify(cat)
    );


    closeModal();

    renderApp();
}


// ---------- APP RENDER ----------

function renderApp() {

    const savedCat =
        localStorage.getItem("cat");


    if (!savedCat) {

        renderEmptyState();

        return;
    }


    const cat =
        JSON.parse(savedCat);


    renderCatDashboard(cat);
}


// ---------- EMPTY STATE ----------

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


// ---------- CAT DASHBOARD ----------

function renderCatDashboard(cat) {

    const content =
        document.getElementById("content");


    content.innerHTML = `

        <div class="welcome">

            <h1>
                Сегодня<br>
                с ${escapeHtml(cat.name)}.
            </h1>

            <p>
                Небольшие заботы каждый день —
                большая польза для кошки.
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
                    ${escapeHtml(cat.age)}
                </p>

            </div>

        </div>


        <div class="section-title">
            Сегодня
        </div>


        <div class="card">

            ${createTask(
                "🎾",
                "Поиграть",
                "15–30 минут"
            )}

            ${createTask(
                "💧",
                "Проверить воду",
                "Свежая вода"
            )}

            ${createTask(
                "🦷",
                "Уход за зубами",
                "По вашему графику"
            )}

        </div>


        <button
            class="button"
            onclick="resetCat()"
        >
            Изменить профиль
        </button>

    `;
}


// ---------- TASKS ----------

function createTask(
    icon,
    name,
    description
) {

    return `

        <div class="task">

            <div class="task-icon">
                ${icon}
            </div>

            <div class="task-text">

                <div class="task-name">
                    ${name}
                </div>

                <div class="task-time">
                    ${description}
                </div>

            </div>

            <div
                class="check"
                onclick="completeTask(this)"
                role="button"
                aria-label="Отметить выполненным"
            ></div>

        </div>

    `;
}


function completeTask(element) {

    element.classList.toggle("done");

}


// ---------- RESET ----------

function resetCat() {

    const confirmed =
        confirm(
            "Удалить текущий профиль кошки?"
        );


    if (!confirmed) {
        return;
    }


    localStorage.removeItem("cat");

    renderApp();

}


// ---------- SECURITY ----------

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}