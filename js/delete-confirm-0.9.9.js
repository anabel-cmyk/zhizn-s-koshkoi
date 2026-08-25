// ========================================
// PROFILE DELETE CONFIRMATION 0.9.9
// MAX-safe custom confirmation dialog
// ========================================

(function () {
    let pendingDeleteId = null;

    function getTargetId() {
        return (
            (typeof profileEditingCatId !== "undefined" && profileEditingCatId) ||
            (typeof editingCatId !== "undefined" && editingCatId) ||
            (typeof getActiveCatId === "function" ? getActiveCatId() : null)
        );
    }

    function removeDialog() {
        const old = document.getElementById("deleteConfirmDialog");
        if (old) old.remove();
    }

    function showDeleteConfirm() {
        pendingDeleteId = getTargetId();
        if (!pendingDeleteId) return false;

        removeDialog();

        const dialog = document.createElement("div");
        dialog.id = "deleteConfirmDialog";
        dialog.className = "delete-confirm-overlay";
        dialog.innerHTML = `
            <div class="delete-confirm-card" role="dialog" aria-modal="true">
                <h3>Удалить профиль?</h3>
                <p>Все данные и записи дневника этой кошки будут удалены.</p>
                <div class="delete-confirm-actions">
                    <button type="button" class="button button-secondary" id="deleteConfirmCancel">Отмена</button>
                    <button type="button" class="button delete-confirm-danger" id="deleteConfirmYes">Удалить</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        document.getElementById("deleteConfirmCancel").onclick = removeDialog;
        document.getElementById("deleteConfirmYes").onclick = function () {
            const id = pendingDeleteId;
            removeDialog();
            pendingDeleteId = null;
            deleteProfileDirectly(id);
        };

        return false;
    }

    function deleteProfileDirectly(targetId) {
        if (!targetId || typeof getCats !== "function") return;

        const cats = getCats();
        const updatedCats = cats.filter(cat => cat.id !== targetId);
        if (updatedCats.length === cats.length) return;

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
    }

    window.deleteCurrentCat = showDeleteConfirm;
})();
