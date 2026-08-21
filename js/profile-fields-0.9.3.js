// 0.9.3 — profile fields: avatar + gender
// Кастрацию/стерилизацию пока намеренно не добавляем.
let pendingCatAvatar = "";

(function () {
    const originalOpenModal = window.openModal;
    const originalOpenModalWithCurrentCat = window.openModalWithCurrentCat;

    function applyProfileFields(cat) {
        const gender = document.getElementById("catGender");
        const preview = document.getElementById("catAvatarPreview");
        if (gender) gender.value = cat?.gender || "";
        if (preview) {
            preview.innerHTML = cat?.avatar
                ? `<img src="${cat.avatar}" alt="">`
                : "🐈";
        }
        const input = document.getElementById("catAvatarInput");
        if (input) input.value = "";
        pendingCatAvatar = "";
    }

    window.chooseProfileAvatar = function (input) {
        const file = input?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = () => {
            pendingCatAvatar = String(reader.result || "");
            const preview = document.getElementById("catAvatarPreview");
            if (preview) preview.innerHTML = `<img src="${pendingCatAvatar}" alt="">`;
        };
        reader.readAsDataURL(file);
    };

    window.openModal = function () {
        pendingCatAvatar = "";
        originalOpenModal();
        setTimeout(() => applyProfileFields(null), 0);
    };

    window.openModalWithCurrentCat = function () {
        const cat = getActiveCat();
        pendingCatAvatar = "";
        originalOpenModalWithCurrentCat();
        setTimeout(() => applyProfileFields(cat), 0);
    };

    // Собственное сохранение профиля: не даём cats.js пересоздать объект
    // и потерять дополнительные поля avatar/gender.
    window.saveCat = function () {
        const nameInput = document.getElementById("catName");
        const birthDateInput = document.getElementById("catBirthDate");
        const ageInput = document.getElementById("catAgeValue");
        const ageUnitInput = document.getElementById("catAgeUnit");
        const ageField = document.getElementById("ageField");
        const genderInput = document.getElementById("catGender");

        const name = nameInput?.value.trim() || "";
        const birthDate = birthDateInput?.value || "";
        const ageValue = ageInput?.value || "";
        const ageUnit = ageUnitInput?.value || "years";
        const gender = genderInput?.value || "";

        if (!name) {
            alert("Введите имя кошки");
            return;
        }

        if (ageField?.hidden && !birthDate) {
            alert("Укажите дату рождения или возраст кошки");
            return;
        }
        if (!ageField?.hidden && !ageValue) {
            alert("Укажите возраст кошки");
            return;
        }

        const cats = getCats();
        const editingId = typeof editingCatId !== "undefined" ? editingCatId : null;
        const existing = editingId ? cats.find(c => c.id === editingId) : null;
        const avatar = pendingCatAvatar || existing?.avatar || "";

        const cat = {
            ...(existing || {}),
            id: existing?.id || createId(),
            name,
            birthDate: ageField?.hidden ? birthDate : null,
            ageValue: ageField?.hidden ? null : Number(ageValue),
            ageUnit: ageField?.hidden ? null : ageUnit,
            gender,
            avatar,
            createdAt: existing?.createdAt || new Date().toISOString()
        };

        const index = cats.findIndex(c => c.id === cat.id);
        if (index >= 0) cats[index] = cat;
        else cats.push(cat);

        saveCats(cats);
        setActiveCatId(cat.id);
        editingCatId = null;
        pendingCatAvatar = "";

        const modal = document.getElementById("modal");
        if (modal) {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
        }
        if (typeof resetForm === "function") resetForm();
        if (typeof setDeleteButtonVisible === "function") setDeleteButtonVisible(false);
        renderApp();
    };
})();
