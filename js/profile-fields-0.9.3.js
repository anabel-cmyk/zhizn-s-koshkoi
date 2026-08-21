// 0.9.3 — profile-only fields: avatar, gender, neutered status
let pendingCatAvatar = "";
(function () {
    const originalOpenModal = window.openModal;
    const originalOpenModalWithCurrentCat = window.openModalWithCurrentCat;
    const originalSaveCat = window.saveCat;
    function setProfileFields(cat) {
        const gender = document.getElementById("catGender");
        const neutered = document.getElementById("catNeutered");
        const preview = document.getElementById("catAvatarPreview");
        const avatarInput = document.getElementById("catAvatarInput");
        if (gender) gender.value = cat?.gender || "";
        if (neutered) neutered.checked = cat?.neutered === true;
        updateNeuteredLabel();
        const avatar = cat?.avatar || (cat && typeof getCatHealth === "function" ? getCatHealth(cat.id).avatar : "");
        if (preview) preview.innerHTML = avatar ? `<img src="${avatar}" alt="">` : "🐈";
        if (avatarInput) avatarInput.value = "";
    }
    window.updateNeuteredLabel = function () {
        const gender = document.getElementById("catGender")?.value || "";
        const label = document.getElementById("catNeuteredLabel");
        if (label) label.textContent = gender === "Кот" ? "Кастрирован" : gender === "Кошка" ? "Стерилизована" : "Кастрирован(а)";
    };
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
        setTimeout(() => setProfileFields(null), 0);
    };
    window.openModalWithCurrentCat = function () {
        const cat = getActiveCat();
        pendingCatAvatar = "";
        originalOpenModalWithCurrentCat();
        setTimeout(() => setProfileFields(cat), 0);
    };
    window.saveCat = function () {
        originalSaveCat();
        const cat = getActiveCat();
        if (!cat) return;
        const cats = getCats();
        const savedCat = cats.find(item => item.id === cat.id);
        if (!savedCat) return;
        savedCat.gender = document.getElementById("catGender")?.value || "";
        savedCat.neutered = document.getElementById("catNeutered")?.checked === true;
        if (pendingCatAvatar) savedCat.avatar = pendingCatAvatar;
        saveCats(cats);
        pendingCatAvatar = "";
        renderApp();
    };
})();
