// 0.9.3 — profile fields: avatar + gender.
// Статус кастрации/стерилизации пока намеренно не добавляем.
let pendingCatAvatar = "";

(function () {
    const originalOpenModal = window.openModal;
    const originalOpenModalWithCurrentCat = window.openModalWithCurrentCat;
    const originalSaveCat = window.saveCat;

    function applyProfileFields(cat) {
        const gender = document.getElementById("catGender");
        const preview = document.getElementById("catAvatarPreview");
        if (gender) gender.value = cat?.gender || "";
        if (preview) preview.innerHTML = cat?.avatar ? `<img src="${cat.avatar}" alt="">` : "🐈";
        pendingCatAvatar = "";
    }

    window.chooseProfileAvatar = function (input) {
        const file = input?.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
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
        // ВАЖНО: cats.js сбрасывает editingCatId внутри originalSaveCat(),
        // поэтому все данные текущего профиля запоминаем ДО вызова оригинала.
        const editingId = typeof editingCatId !== "undefined" ? editingCatId : null;
        const beforeCats = getCats();
        const beforeCat = editingId ? beforeCats.find(cat => cat.id === editingId) : null;
        const gender = document.getElementById("catGender")?.value || "";
        const avatar = pendingCatAvatar;
        const preservedAvatar = avatar || beforeCat?.avatar || "";

        originalSaveCat();

        const cats = getCats();
        const targetId = editingId || getActiveCatId();
        const savedCat = cats.find(item => item.id === targetId);
        if (!savedCat) return;

        savedCat.gender = gender;
        if (preservedAvatar) savedCat.avatar = preservedAvatar;
        else delete savedCat.avatar;

        saveCats(cats);
        setActiveCatId(savedCat.id);
        pendingCatAvatar = "";
        renderApp();
    };
})();
