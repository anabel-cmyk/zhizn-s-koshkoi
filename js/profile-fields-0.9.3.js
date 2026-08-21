// 0.9.3 — profile fields: avatar + gender.
// Статус кастрации/стерилизации пока намеренно не добавляем:
// он не используется в ближайшей логике приложения.
let pendingCatAvatar = "";

(function () {
    const originalOpenModal = window.openModal;
    const originalOpenModalWithCurrentCat = window.openModalWithCurrentCat;
    const originalSaveCat = window.saveCat;

    function applyProfileFields(cat) {
        const gender = document.getElementById("catGender");
        const preview = document.getElementById("catAvatarPreview");
        const avatar = cat?.avatar || "";

        if (gender) gender.value = cat?.gender || "";
        if (preview) preview.innerHTML = avatar ? `<img src="${avatar}" alt="">` : "🐈";
        pendingCatAvatar = "";
    }

    window.chooseProfileAvatar = function (input) {
        const file = input?.files?.[0];
        if (!file) return;
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

    window.saveCat = function () {
        const gender = document.getElementById("catGender")?.value || "";
        const avatar = pendingCatAvatar;
        const editingId = typeof editingCatId !== "undefined" ? editingCatId : null;

        // Сохраняем базовые поля через существующую систему.
        originalSaveCat();

        const cats = getCats();
        const targetId = editingId || getActiveCatId();
        const savedCat = cats.find(item => item.id === targetId);
        if (!savedCat) return;

        savedCat.gender = gender;
        // При редактировании старый аватар сохраняется, если новый не выбран.
        if (avatar) savedCat.avatar = avatar;

        saveCats(cats);
        setActiveCatId(savedCat.id);
        pendingCatAvatar = "";
        renderApp();
    };
})();
