// 0.9.3 — profile fields: avatar + gender
// Кастрацию/стерилизацию пока намеренно не добавляем.
let pendingCatAvatar = "";
let pendingCatAvatarPromise = null;
let profileEditingCatId = null;

(function () {
    const originalOpenModal = window.openModal;
    const originalOpenModalWithCurrentCat = window.openModalWithCurrentCat;

    function applyProfileFields(cat) {
        const gender = document.getElementById("catGender");
        const preview = document.getElementById("catAvatarPreview");
        const input = document.getElementById("catAvatarInput");
        if (gender) gender.value = cat?.gender || "";
        if (preview) preview.innerHTML = cat?.avatar ? `<img src="${cat.avatar}" alt="">` : "🐈";
        if (input) input.value = "";
        pendingCatAvatar = "";
        pendingCatAvatarPromise = null;
    }

    // Большие фотографии нельзя надёжно хранить в localStorage как исходный файл:
    // они быстро упираются в лимит хранилища. Перед сохранением уменьшаем только
    // размер данных, сохраняя нормальное качество и пропорции.
    function prepareAvatar(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith("image/")) return reject(new Error("not-image"));
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error || new Error("read-error"));
            reader.onload = () => {
                const img = new Image();
                img.onerror = () => reject(new Error("image-error"));
                img.onload = () => {
                    const maxSide = 900;
                    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
                    const width = Math.max(1, Math.round(img.naturalWidth * scale));
                    const height = Math.max(1, Math.round(img.naturalHeight * scale));
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return reject(new Error("canvas-error"));
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(blob => {
                        if (!blob) return reject(new Error("blob-error"));
                        const r = new FileReader();
                        r.onerror = () => reject(r.error || new Error("blob-read-error"));
                        r.onload = () => resolve(String(r.result || ""));
                        r.readAsDataURL(blob);
                    }, "image/jpeg", 0.88);
                };
                img.src = String(reader.result || "");
            };
            reader.readAsDataURL(file);
        });
    }

    window.chooseProfileAvatar = function (input) {
        const file = input?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        pendingCatAvatarPromise = prepareAvatar(file).then(data => {
            pendingCatAvatar = data;
            const preview = document.getElementById("catAvatarPreview");
            if (preview) preview.innerHTML = `<img src="${data}" alt="">`;
            return data;
        });
        pendingCatAvatarPromise.catch(() => {
            pendingCatAvatar = "";
            alert("Не удалось подготовить фото");
        });
    };

    window.openModal = function () {
        profileEditingCatId = null;
        pendingCatAvatar = "";
        pendingCatAvatarPromise = null;
        originalOpenModal();
        setTimeout(() => applyProfileFields(null), 0);
    };

    window.openModalWithCurrentCat = function () {
        const cat = getActiveCat();
        if (!cat) { window.openModal(); return; }
        profileEditingCatId = cat.id;
        pendingCatAvatar = "";
        pendingCatAvatarPromise = null;
        originalOpenModalWithCurrentCat();
        setTimeout(() => applyProfileFields(cat), 0);
    };

    window.saveCat = async function (event) {
        if (event?.preventDefault) event.preventDefault();
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

        if (!name) { alert("Введите имя кошки"); return false; }
        if (ageField?.hidden && !birthDate) { alert("Укажите дату рождения или возраст кошки"); return false; }
        if (!ageField?.hidden && !ageValue) { alert("Укажите возраст кошки"); return false; }
        if (pendingCatAvatarPromise) {
            try { await pendingCatAvatarPromise; } catch { alert("Не удалось загрузить фото"); return false; }
        }

        const cats = getCats();
        const existing = profileEditingCatId ? cats.find(c => c.id === profileEditingCatId) : null;
        const cat = {
            ...(existing || {}),
            id: existing?.id || createId(),
            name,
            birthDate: ageField?.hidden ? birthDate : null,
            ageValue: ageField?.hidden ? null : Number(ageValue),
            ageUnit: ageField?.hidden ? null : ageUnit,
            gender,
            avatar: pendingCatAvatar || existing?.avatar || "",
            createdAt: existing?.createdAt || new Date().toISOString()
        };

        const index = cats.findIndex(c => c.id === cat.id);
        if (index >= 0) cats[index] = cat; else cats.push(cat);
        try {
            saveCats(cats);
        } catch (error) {
            console.error("Не удалось сохранить профиль кошки", error);
            alert("Не удалось сохранить фото. Попробуйте выбрать другое фото.");
            return false;
        }
        setActiveCatId(cat.id);
        editingCatId = null;
        profileEditingCatId = null;
        pendingCatAvatar = "";
        pendingCatAvatarPromise = null;

        const modal = document.getElementById("modal");
        if (modal) { modal.classList.remove("active"); modal.setAttribute("aria-hidden", "true"); }
        if (typeof resetForm === "function") resetForm();
        if (typeof setDeleteButtonVisible === "function") setDeleteButtonVisible(false);
        renderApp();
        return false;
    };
})();
