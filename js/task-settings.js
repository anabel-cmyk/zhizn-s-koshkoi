// ========================================
// ЖИЗНЬ С КОШКОЙ
// TASK SETTINGS FIXES
// 0.9.2
//
// Настройки системных задач хранятся отдельно
// от ежедневных отметок, поэтому не сбрасываются
// при смене дня.
// ========================================

const TASK_SHARED_SETTINGS_KEY = "taskSharedSettings";


function getTaskSharedSettings() {

    const saved =
        localStorage.getItem(
            TASK_SHARED_SETTINGS_KEY
        );


    if (!saved) {
        return {};
    }


    try {

        const data = JSON.parse(saved);

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


function saveTaskSharedSettings(settings) {

    localStorage.setItem(
        TASK_SHARED_SETTINGS_KEY,
        JSON.stringify(settings)
    );
}


function getTaskSharedState(taskId) {

    const settings =
        getTaskSharedSettings();


    if (
        typeof settings[taskId] === "boolean"
    ) {
        return settings[taskId];
    }


    // Совместимость с уже сохранённым 0.9.2:
    // если shared уже был включён в ежедневных данных,
    // переносим это состояние в отдельное хранилище.
    const storage =
        typeof getTasksStorage === "function"
            ? getTasksStorage()
            : {};


    const cats =
        typeof getCats === "function"
            ? getCats()
            : [];


    const hasLegacyShared =
        cats.some(
            cat =>
                storage[cat.id]
                ?.tasks
                ?.some(
                    task =>
                        task.id === taskId &&
                        task.shared === true
                )
        );


    if (hasLegacyShared) {

        settings[taskId] = true;
        saveTaskSharedSettings(settings);

        return true;
    }


    return false;
}


function ensureCatTodayData(
    catId,
    storage
) {

    const today =
        getTodayKey();


    if (
        !storage[catId] ||
        storage[catId].date !== today
    ) {

        storage[catId] = {
            date: today,
            tasks: getDefaultTasks()
        };
    }


    storage[catId].tasks =
        normalizeTasks(
            storage[catId].tasks
        );


    return storage[catId];
}


// ========================================
// TASK UI
// ========================================

function createTask(task) {

    const shared =
        getTaskSharedState(task.id);


    return `
        <div class="task">

            <div class="task-main">

                <div class="task-icon">
                    ${task.icon}
                </div>

                <div class="task-text">
                    <div class="task-name">
                        ${escapeHtml(task.name)}
                    </div>

                    <div class="task-time">
                        ${escapeHtml(task.description)}
                    </div>
                </div>

                <button
                    class="task-settings-button"
                    type="button"
                    onclick="openTaskSettings('${task.id}')"
                    aria-label="Настройки задачи"
                >
                    ⚙
                </button>

                <div
                    class="check ${task.done ? "done" : ""}"
                    onclick="toggleTask('${task.id}')"
                    role="button"
                    aria-label="Отметить выполненным"
                ></div>

            </div>

            ${
                shared
                    ? `<div class="task-shared-label">Общая для всех кошек</div>`
                    : ""
            }

        </div>
    `;
}


// ========================================
// SETTINGS MODAL
// ========================================

function openTaskSettings(taskId) {

    const cats =
        typeof getCats === "function"
            ? getCats()
            : [];


    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;


    if (!activeCatId || !cats.length) {
        return;
    }


    const tasks =
        getDailyTasks(activeCatId);


    const task =
        tasks.find(
            item => item.id === taskId
        );


    if (!task) {
        return;
    }


    closeTaskSettings();


    const shared =
        getTaskSharedState(taskId);


    const modal =
        document.createElement("div");


    modal.id = "taskSettingsModal";
    modal.className = "task-settings-modal";
    modal.setAttribute("aria-hidden", "false");


    modal.innerHTML = `
        <div
            class="task-settings-overlay"
            onclick="closeTaskSettings()"
        ></div>

        <div
            class="task-settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="taskSettingsTitle"
        >

            <div class="task-settings-header">

                <div class="task-settings-icon">
                    ${task.icon}
                </div>

                <button
                    type="button"
                    class="task-settings-close"
                    onclick="closeTaskSettings()"
                    aria-label="Закрыть"
                >
                    ×
                </button>

            </div>

            <h2
                id="taskSettingsTitle"
                class="task-settings-title"
            >
                ${escapeHtml(task.name)}
            </h2>

            <p class="task-settings-description">
                ${escapeHtml(task.description)}
            </p>

            <div class="task-setting-row">

                <div class="task-setting-text">
                    <strong>Общая для всех кошек</strong>
                    <span>
                        Одна отметка будет применяться ко всем кошкам.
                    </span>
                </div>

                <button
                    type="button"
                    class="task-switch ${shared ? "active" : ""}"
                    onclick="setTaskShared('${taskId}', !getTaskSharedState('${taskId}'))"
                    role="switch"
                    aria-checked="${shared ? "true" : "false"}"
                    aria-label="Общая для всех кошек"
                >
                    <span class="task-switch-knob"></span>
                </button>

            </div>

            <button
                type="button"
                class="task-settings-done"
                onclick="closeTaskSettings()"
            >
                Готово
            </button>

        </div>
    `;


    document.body.appendChild(modal);


    requestAnimationFrame(() => {
        modal.classList.add("active");
    });
}


// ========================================
// SHARED SETTING
// ========================================

function setTaskShared(
    taskId,
    isShared
) {

    const cats =
        typeof getCats === "function"
            ? getCats()
            : [];


    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;


    if (!cats.length || !activeCatId) {
        return;
    }


    const settings =
        getTaskSharedSettings();


    settings[taskId] =
        isShared === true;


    saveTaskSharedSettings(settings);


    const storage =
        getTasksStorage();


    // Поддерживаем legacy-поле shared синхронизированным
    // с отдельной настройкой. Само состояние настройки
    // больше не зависит от даты.
    cats.forEach(cat => {

        const catData =
            ensureCatTodayData(
                cat.id,
                storage
            );

        const catTask =
            catData.tasks.find(
                item => item.id === taskId
            );

        if (catTask) {
            catTask.shared =
                isShared === true;
        }
    });


    // При включении общей задачи используем состояние
    // активной кошки как начальное общее состояние.
    // Существующая история каждой кошки при этом
    // остаётся отдельной записью.
    if (isShared) {

        const activeData =
            ensureCatTodayData(
                activeCatId,
                storage
            );

        const activeTask =
            activeData.tasks.find(
                item => item.id === taskId
            );

        const sharedDone =
            activeTask?.done === true;


        cats.forEach(cat => {

            const catData =
                ensureCatTodayData(
                    cat.id,
                    storage
                );

            const catTask =
                catData.tasks.find(
                    item => item.id === taskId
                );

            if (catTask) {
                catTask.done = sharedDone;
            }

            saveTasksToHistory(
                cat.id,
                catData.date,
                catData.tasks
            );
        });
    }


    saveTasksStorage(storage);


    // Закрываем окно и сразу перерисовываем экран.
    closeTaskSettings();
    renderApp();
}


// ========================================
// TASK TOGGLE
// ========================================

function toggleTask(taskId) {

    const cats =
        typeof getCats === "function"
            ? getCats()
            : [];


    const activeCatId =
        typeof getActiveCatId === "function"
            ? getActiveCatId()
            : null;


    if (!cats.length || !activeCatId) {
        return;
    }


    const storage =
        getTasksStorage();


    const activeData =
        ensureCatTodayData(
            activeCatId,
            storage
        );


    const task =
        activeData.tasks.find(
            item => item.id === taskId
        );


    if (!task) {
        return;
    }


    const shared =
        getTaskSharedState(taskId);


    const newDoneState =
        !task.done;


    if (shared) {

        // Общая задача меняется одной отметкой
        // сразу для всех кошек.
        cats.forEach(cat => {

            const catData =
                ensureCatTodayData(
                    cat.id,
                    storage
                );

            const catTask =
                catData.tasks.find(
                    item => item.id === taskId
                );

            if (catTask) {
                catTask.done = newDoneState;
                catTask.shared = true;
            }

            // История остаётся отдельной для каждой кошки.
            saveTasksToHistory(
                cat.id,
                catData.date,
                catData.tasks
            );
        });

    } else {

        // Индивидуальная задача меняется только
        // у активной кошки.
        task.done = newDoneState;
        task.shared = false;

        saveTasksToHistory(
            activeCatId,
            activeData.date,
            activeData.tasks
        );
    }


    saveTasksStorage(storage);
    renderApp();
}
