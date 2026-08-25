// ========================================
// PROFILE DELETE FIX 0.9.9
// MAX-safe deletion with confirmation
// ========================================

function deleteCurrentCat() {
    const targetId =
        (typeof profileEditingCatId !== "undefined" && profileEditingCatId) ||
        (typeof editingCatId !== "undefined" && editingCatId) ||
        (typeof getActiveCatId === "function" ? getActiveCatId() : null);

    if (!targetId || typeof getCats !== "function") return false;

    const confirmed = window.confirm(
        "Удалить профиль кошки? Все связанные данные и записи дневника будут удалены."
    );

    if (!confirmed) return false;

    const cats = getCats();
    const updatedCats = cats.filter(cat => cat.id !== targetId);

    if (updatedCats.length === cats.length) return false;

    try {
        saveCats(updatedCats);

        if (typeof deleteCatTasks === "function") {
            try { deleteCatTasks(targetId); } catch (error) { console.warn(error); }
        }

        if (typeof deleteCatHistory === "function") {
            try { deleteCatHistory(targetId); } catch (error) { console.warn(error); }
        }

        if (updatedCats.length) {
            setActiveCatId(updatedCats[0].id);
        } else {
            localStorage.removeItem("activeCatId");
        }

        if (typeof closeModal === "function") closeModal();
        if (typeof updateHeaderCat === "function") updateHeaderCat();
        if (typeof renderApp === "function") renderApp();
    } catch (error) {
        console.error("Profile deletion failed", error);
    }

    return false;
}
