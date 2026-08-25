// ========================================
// PROFILE DELETE FIX 0.9.9
// MAX-safe deletion
// ========================================

// MAX WebView does not need a separate database for the current prototype:
// profiles are stored in localStorage, exactly like the browser version.
// Do not use window.confirm() or a two-step button here.
function deleteCurrentCat() {
    const targetId =
        (typeof profileEditingCatId !== "undefined" && profileEditingCatId) ||
        (typeof editingCatId !== "undefined" && editingCatId) ||
        (typeof getActiveCatId === "function" ? getActiveCatId() : null);

    if (!targetId || typeof getCats !== "function") return false;

    const cats = getCats();
    const updatedCats = cats.filter(cat => cat.id !== targetId);

    // Nothing to delete.
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
        return false;
    }

    return false;
}
