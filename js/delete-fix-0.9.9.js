// ========================================
// PROFILE DELETE FIX 0.9.9
// MAX-safe deletion
// ========================================

let deleteProfileArmed = false;
let deleteProfileTimer = null;

function deleteCurrentCat() {
    const targetId =
        (typeof profileEditingCatId !== "undefined" && profileEditingCatId) ||
        (typeof editingCatId !== "undefined" && editingCatId) ||
        (typeof getActiveCatId === "function" ? getActiveCatId() : null);

    if (!targetId) return false;

    const cats = typeof getCats === "function" ? getCats() : [];
    const cat = cats.find(item => item.id === targetId);
    if (!cat) return false;

    // MAX WebView may handle native window.confirm differently.
    // Use an in-form two-step confirmation instead.
    const button = document.getElementById("deleteProfileButton");

    if (!deleteProfileArmed) {
        deleteProfileArmed = true;
        if (button) {
            button.textContent = "Удалить профиль ещё раз";
            button.dataset.deleteArmed = "true";
        }

        clearTimeout(deleteProfileTimer);
        deleteProfileTimer = setTimeout(() => {
            deleteProfileArmed = false;
            if (button) {
                button.textContent = "Удалить профиль";
                button.dataset.deleteArmed = "false";
            }
        }, 4000);

        return false;
    }

    deleteProfileArmed = false;
    clearTimeout(deleteProfileTimer);

    const updatedCats = cats.filter(item => item.id !== targetId);

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

        const modal = document.getElementById("modal");
        if (modal) {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
        }

        if (typeof updateHeaderCat === "function") updateHeaderCat();
        if (typeof renderApp === "function") renderApp();
    } catch (error) {
        console.error("Profile deletion failed", error);
        alert("Не удалось удалить профиль. Попробуйте ещё раз.");
    }

    return false;
}
