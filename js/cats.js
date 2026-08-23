// ========================================
// CATS + CAT PROFILE
// ========================================

const CATS_KEY = "cats";
const ACTIVE_CAT_KEY = "activeCatId";

let editingCatId = null;
let pendingCatAvatar = "";
let pendingCatAvatarPromise = null;
let profileEditingCatId = null;

function getCats() {
    const saved = localStorage.getItem(CATS_KEY);
    if (!saved) return [];
    try {
        const cats = JSON.parse(saved);
        return Array.isArray(cats) ? cats : [];
    } catch { return []; }
}

function saveCats(cats) { localStorage.setItem(CATS_KEY, JSON.stringify(cats)); }

function getActiveCatId() { return localStorage.getItem(ACTIVE_CAT_KEY); }
function setActiveCatId(id) { localStorage.setItem(ACTIVE_CAT_KEY, id); }

function getActiveCat() {
    const cats = getCats();
    if (!cats.length) return null;
    const activeId = getActiveCatId();
    const activeCat = cats.find(cat => cat.id === activeId);
    if (activeCat) return activeCat;
    setActiveCatId(cats[0].id);
    return cats[0];
}

function createId() {
    return "cat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function migrateOldCat() {
    const oldCat = localStorage.getItem("cat");
    if (!oldCat || getCats().length) return;
    try {
        const cat = JSON.parse(oldCat);
        const migratedCat = { ...cat, id: cat.id || createId(), createdAt: cat.createdAt || new Date().toISOString() };
        saveCats([migratedCat]);
        setActiveCatId(migratedCat.id);
    } catch {}
}

function setDeleteButtonVisible(visible) {
    const button = document.getElementById("deleteProfileButton");
    if (!button) return;
    button.hidden = !visible;
    if (visible) button.removeAttribute("hidden"); else button.setAttribute("hidden", "");
}

function resetForm() {
    const name = document.getElementById("catName");
    const birthDate = document.getElementById("catBirthDate");
    const ageValue = document.getElementById("catAgeValue");
    const ageUnit = document.getElementById("catAgeUnit");
    const gender = document.getElementById("catGender");
    if (name) name.value = "";
    if (birthDate) birthDate.value = "";
    if (ageValue) ageValue.value = "";
    if (ageUnit) ageUnit.value = "years";
    if (gender) gender.value = "";
    const preview = document.getElementById("catAvatarPreview");
    if (preview) preview.innerHTML = "🐈";
    showBirthDateInput();
}

function showAgeInput() {
    const birthDateField = document.getElementById("birthDateField");
    const ageField = document.getElementById("ageField");
    const birthDate = document.getElementById("catBirthDate");
    const ageValue = document.getElementById("catAgeValue");
    if (birthDateField) birthDateField.hidden = true;
    if (ageField) ageField.hidden = false;
    if (birthDate) birthDate.value = "";
    if (ageValue) ageValue.focus();
}

function showBirthDateInput() {
    const birthDateField = document.getElementById("birthDateField");
    const ageField = document.getElementById("ageField");
    const ageValue = document.getElementById("catAgeValue");
    if (birthDateField) birthDateField.hidden = false;
    if (ageField) ageField.hidden = true;
    if (ageValue) ageValue.value = "";
}

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
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
                canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject(new Error("canvas-error"));
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

function chooseProfileAvatar(input) {
    const file = input?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    pendingCatAvatarPromise = prepareAvatar(file).then(data => {
        pendingCatAvatar = data;
        const preview = document.getElementById("catAvatarPreview");
        if (preview) preview.innerHTML = `<img src="${data}" alt="Фото кошки">`;
        return data;
    });
    pendingCatAvatarPromise.catch(() => {
        pendingCatAvatar = "";
        alert("Не удалось подготовить фото");
    });
}

function openModal() {
    profileEditingCatId = null;
    pendingCatAvatar = "";
    pendingCatAvatarPromise = null;
    const modal = document.getElementById("modal");
    if (!modal) return;
    editingCatId = null;
    setDeleteButtonVisible(false);
    resetForm();
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => document.getElementById("catName")?.focus(), 100);
}

function closeModal() {
    const modal = document.getElementById("modal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    editingCatId = null;
    profileEditingCatId = null;
    pendingCatAvatar = "";
    pendingCatAvatarPromise = null;
    resetForm();
    setDeleteButtonVisible(false);
}

function openModalWithCurrentCat() {
    const cat = getActiveCat();
    if (!cat) { openModal(); return; }
    editingCatId = cat.id;
    profileEditingCatId = cat.id;
    pendingCatAvatar = "";
    pendingCatAvatarPromise = null;
    setDeleteButtonVisible(true);
    document.getElementById("catName").value = cat.name || "";
    const gender = document.getElementById("catGender");
    if (gender) gender.value = cat.gender || "";
    const preview = document.getElementById("catAvatarPreview");
    if (preview) preview.innerHTML = cat.avatar ? `<img src="${cat.avatar}" alt="Фото кошки">` : "🐈";
    if (cat.birthDate) {
        showBirthDateInput();
        document.getElementById("catBirthDate").value = cat.birthDate;
    } else {
        showAgeInput();
        document.getElementById("catAgeValue").value = cat.ageValue || "";
        document.getElementById("catAgeUnit").value = cat.ageUnit || "years";
    }
    const modal = document.getElementById("modal");
    if (modal) { modal.classList.add("active"); modal.setAttribute("aria-hidden", "false"); }
}

async function saveCat(event) {
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
    const index = cats.findIndex(item => item.id === cat.id);
    if (index >= 0) cats[index] = cat; else cats.push(cat);
    try { saveCats(cats); } catch (error) { console.error(error); alert("Не удалось сохранить фото. Попробуйте другое фото."); return false; }
    setActiveCatId(cat.id);
    editingCatId = null;
    profileEditingCatId = null;
    pendingCatAvatar = "";
    pendingCatAvatarPromise = null;
    const modal = document.getElementById("modal");
    if (modal) { modal.classList.remove("active"); modal.setAttribute("aria-hidden", "true"); }
    if (typeof setDeleteButtonVisible === "function") setDeleteButtonVisible(false);
    renderApp();
    return false;
}

function addNewCat() { openModal(); }

function deleteCurrentCat() {
    const cat = getActiveCat();
    if (!cat) return;
    const cats = getCats();
    if (!confirm(cats.length === 1 ? `Удалить профиль ${cat.name}? После удаления кошек в приложении не останется.` : `Удалить профиль ${cat.name}?`)) return;
    const updatedCats = cats.filter(item => item.id !== cat.id);
    saveCats(updatedCats);
    if (typeof deleteCatTasks === "function") deleteCatTasks(cat.id);
    if (typeof deleteCatHistory === "function") deleteCatHistory(cat.id);
    if (updatedCats.length) setActiveCatId(updatedCats[0].id); else localStorage.removeItem(ACTIVE_CAT_KEY);
    closeModal();
    renderApp();
}

function switchCat(id) {
    if (!id) return;
    if (!getCats().some(cat => cat.id === id)) return;
    setActiveCatId(id);
    renderApp();
}

function createCatSwitcher() {
    const cats = getCats();
    if (!cats.length) return "";
    const activeId = getActiveCatId();
    return `<div class="cat-switcher"><div class="cat-switcher-list">${cats.map(cat => `<button class="cat-switcher-item ${cat.id === activeId ? "active" : ""}" onclick="switchCat('${cat.id}')"><span class="cat-switcher-avatar">${cat.avatar ? `<img src="${cat.avatar}" alt="">` : "🐈"}</span><span>${escapeHtml(cat.name)}</span></button>`).join("")}</div><button class="add-cat-button" onclick="addNewCat()">＋ Добавить кошку</button></div>`;
}

migrateOldCat();