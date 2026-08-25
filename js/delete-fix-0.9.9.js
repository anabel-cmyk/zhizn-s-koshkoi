// ========================================
// PROFILE DELETE FIX 0.9.9
// ========================================

function deleteCurrentCat() {
    const cat = typeof getActiveCat === "function" ? getActiveCat() : null;
    if (!cat) return false;

    const cats = typeof getCats === "function" ? getCats() : [];
    const confirmed = window.confirm(`Удалить профиль ${cat.name || "кошки"}?`);
    if (!confirmed) return false;

    const updatedCats = cats.filter(item => item.id !== cat.id);

    try {
        saveCats(updatedCats);
        if (updatedCats.length) {
            setActiveCatId(updatedCats[0].id);
        } else {
            localStorage.removeItem("activeCatId");
        }

        if (typeof deleteCatTasks === "function") {
            try { deleteCatTasks(cat.id); } catch (error) { console.warn(error); }
        }
        if (typeof deleteCatHistory === "function") {
            try { deleteCatHistory(cat.id); } catch (error) { console.warn(error); }
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
