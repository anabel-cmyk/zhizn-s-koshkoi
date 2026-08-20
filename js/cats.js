// ========================================
// ЖИЗНЬ С КОШКОЙ
// CATS
// ========================================

const CATS_KEY = "cats";
const ACTIVE_CAT_KEY = "activeCatId";

let editingCatId = null;


// ========================================
// GET / SAVE
// ========================================

function getCats() {

    const saved =
        localStorage.getItem(CATS_KEY);

    if (!saved) {
        return [];
    }

    try {

        const cats =
            JSON.parse(saved);

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


// ========================================
// ACTIVE CAT
// ========================================

function getActiveCatId() {

    return localStorage.getItem(
        ACTIVE_CAT_KEY
    );
}


function setActiveCatId(id) {

    if (!id) {
        localStorage.removeItem(
            ACTIVE_CAT_KEY
        );

        return;
    }

    localStorage.setItem(
        ACTIVE_CAT_KEY,
        id
    );
}


function getActiveCat() {

    const cats =
        getCats();

    if (!cats.length) {
        return null;
    }

    const activeId =
        getActiveCatId();

    const activeCat =
        cats.find(
            cat =>
                cat.id === activeId
        );

    if (activeCat) {
        return activeCat;
    }

    setActiveCatId(
        cats[0].id
    );

    return cats[0];
}


// ========================================
// ID
// ========================================

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
// MIGRATION FROM MVP 0.7
// ========================================

function migrateOldCat() {

    const oldCat =
        localStorage.getItem("cat");

    if (!oldCat) {
        return;
    }

    const existingCats =
        getCats();

    if (existingCats.length) {
        return;
    }

    try {

        const cat =
            JSON.parse(oldCat);

        const migratedCat = {

            ...cat,

            id:
                cat.id ||
                createId(),

            createdAt:
                cat.createdAt ||
                new Date().toISOString()

        };

        saveCats([
            migratedCat
        ]);

        setActiveCatId(
            migratedCat.id
        );

    } catch {

        // Ничего не делаем.

    }
}


// ========================================
// MODAL — ADD NEW CAT
// ========================================

function openModal() {

    const modal =
        document.getElementById("modal");

    if (!modal) {
        return;
    }

    /*
     * Новая кошка.
     * Ничего из текущего профиля
     * в форму не переносим.
     */

    editingCatId = null;

    const deleteButton =
        document.getElementById(
            "deleteProfileButton"
        );

    if (deleteButton) {
        deleteButton.hidden = true;
    }

    resetForm();

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    setTimeout(() => {

        const input =
            document.getElementById(
                "catName"
            );

        if (input) {
            input.focus();
        }

    }, 100);
}


// ========================================
// CLOSE MODAL
// ========================================

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

    editingCatId = null;

    resetForm();
}


// ========================================
// FORM RESET
// ========================================

function resetForm() {

    const name =
        document.getElementById(
            "catName"
        );

    const birthDate =
        document.getElementById(
            "catBirthDate"
        );

    const ageValue =
        document.getElementById(
            "catAgeValue"
        );

    const ageUnit =
        document.getElementById(
            "catAgeUnit"
        );

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


// ========================================
// SHOW AGE INPUT
// ========================================

function showAgeInput() {

    const birthDateField =
        document.getElementById(
            "birthDateField"
        );

    const ageField =
        document.getElementById(
            "ageField"
        );

    const birthDate =
        document.getElementById(
            "catBirthDate"
        );

    const ageValue =
        document.getElementById(
            "catAgeValue"
        );

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


// ========================================
// SHOW BIRTH DATE INPUT
// ========================================

function showBirthDateInput() {

    const birthDateField =
        document.getElementById(
            "birthDateField"
        );

    const ageField =
        document.getElementById(
            "ageField"
        );

    const ageValue =
        document.getElementById(
            "catAgeValue"
        );

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

    const nameInput =
        document.getElementById(
            "catName"
        );

    const birthDateInput =
        document.getElementById(
            "catBirthDate"
        );

    const ageValueInput =
        document.getElementById(
            "catAgeValue"
        );

    const ageUnitInput =
        document.getElementById(
            "catAgeUnit"
        );

    const ageField =
        document.getElementById(
            "ageField"
        );

    if (
        !nameInput ||
        !birthDateInput ||
        !ageValueInput ||
        !ageUnitInput ||
        !ageField
    ) {
        return;
    }


    const name =
        nameInput.value.trim();

    const birthDate =
        birthDateInput.value;

    const ageValue =
        ageValueInput.value;

    const ageUnit =
        ageUnitInput.value;


    // ------------------------------------
    // VALIDATION
    // ------------------------------------

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


    // ------------------------------------
    // FIND EXISTING
    // ------------------------------------

    const cats =
        getCats();

    const existingCat =
        editingCatId
            ? cats.find(
                cat =>
                    cat.id ===
                    editingCatId
            )
            : null;


    // ------------------------------------
    // CREATE OBJECT
    // ------------------------------------

    const cat = {

        id:
            existingCat?.id ||
            createId(),

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
            existingCat?.createdAt ||
            new Date().toISOString()

    };


    // ------------------------------------
    // SAVE
    // ------------------------------------

    const index =
        cats.findIndex(
            item =>
                item.id === cat.id
        );


    if (index >= 0) {

        cats[index] =
            cat;

    } else {

        cats.push(cat);

    }


    saveCats(cats);

    /*
     * После создания или редактирования
     * эта кошка становится активной.
     */

    setActiveCatId(
        cat.id
    );

    editingCatId = null;

    closeModal();

    renderApp();
}


// ========================================
// ADD NEW CAT
// ========================================

function addNewCat() {

    openModal();
}


// ========================================
// EDIT CURRENT CAT
// ========================================

function openModalWithCurrentCat() {

    const cat =
        getActiveCat();


    // Если кошки нет —
    // открываем форму новой кошки.

    if (!cat) {

        openModal();

        return;
    }


    editingCatId =
        cat.id;


    // ------------------------------------
    // DELETE BUTTON
    // ------------------------------------

    const deleteButton =
        document.getElementById(
            "deleteProfileButton"
        );

    if (deleteButton) {
        deleteButton.hidden = false;
    }


    // ------------------------------------
    // NAME
    // ------------------------------------

    const nameInput =
        document.getElementById(
            "catName"
        );

    if (nameInput) {

        nameInput.value =
            cat.name || "";

    }


    // ------------------------------------
    // AGE / BIRTH DATE
    // ------------------------------------

    if (cat.birthDate) {

        showBirthDateInput();

        const birthDateInput =
            document.getElementById(
                "catBirthDate"
            );

        if (birthDateInput) {

            birthDateInput.value =
                cat.birthDate;

        }

    } else {

        showAgeInput();

        const ageValueInput =
            document.getElementById(
                "catAgeValue"
            );

        const ageUnitInput =
            document.getElementById(
                "catAgeUnit"
            );


        if (ageValueInput) {

            ageValueInput.value =
                cat.ageValue ?? "";

        }


        if (ageUnitInput) {

            ageUnitInput.value =
                cat.ageUnit ||
                "years";

        }

    }


    // ------------------------------------
    // OPEN MODAL
    // ------------------------------------

    const modal =
        document.getElementById(
            "modal"
        );

    if (!modal) {
        return;
    }


    modal.classList.add(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


// ========================================
// DELETE CURRENT CAT
// ========================================

function deleteCurrentCat() {

    const cat =
        getActiveCat();

    if (!cat) {
        return;
    }


    const cats =
        getCats();


    const message =
        cats.length === 1

            ? `Удалить профиль ${cat.name}? После удаления кошек в приложении не останется.`

            : `Удалить профиль ${cat.name}?`;


    const confirmed =
        confirm(message);


    if (!confirmed) {
        return;
    }


    // ------------------------------------
    // REMOVE CAT
    // ------------------------------------

    const updatedCats =
        cats.filter(
            item =>
                item.id !== cat.id
        );


    saveCats(
        updatedCats
    );


    // ------------------------------------
    // REMOVE CAT DATA
    // ------------------------------------

    if (
        typeof deleteCatTasks ===
        "function"
    ) {

        deleteCatTasks(
            cat.id
        );

    }


    if (
        typeof deleteCatHistory ===
        "function"
    ) {

        deleteCatHistory(
            cat.id
        );

    }


    // ------------------------------------
    // SELECT NEXT CAT
    // ------------------------------------

    if (updatedCats.length) {

        setActiveCatId(
            updatedCats[0].id
        );

    } else {

        setActiveCatId(
            null
        );

    }


    // ------------------------------------
    // CLOSE
    // ------------------------------------

    closeModal();

    renderApp();
}


// ========================================
// SWITCH CAT
// ========================================

function switchCat(id) {

    if (!id) {
        return;
    }


    const cats =
        getCats();


    const exists =
        cats.some(
            cat =>
                cat.id === id
        );


    if (!exists) {
        return;
    }


    setActiveCatId(id);

    renderApp();
}


// ========================================
// CAT SWITCHER
// ========================================

function createCatSwitcher() {

    const cats =
        getCats();

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
                                    type="button"
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
                                        class="
                                            cat-switcher-avatar
                                        "
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
                type="button"
                class="add-cat-button"
                onclick="addNewCat()"
            >
                ＋ Добавить кошку
            </button>

        </div>

    `;
}