// ========================================
// ЖИЗНЬ С КОШКОЙ
// UI FIXES 0.9.9
// Small interaction fixes only.
// ========================================

(function () {
    function syncHeaderCat() {
        if (typeof window.updateHeaderCat === "function") {
            window.updateHeaderCat();
        }
    }

    // The diary has its own cat switcher. Keep the global header avatar
    // synchronized with the cat selected there as well.
    const originalSwitchDiaryCat = window.switchDiaryCat;
    if (typeof originalSwitchDiaryCat === "function") {
        window.switchDiaryCat = function (catId) {
            originalSwitchDiaryCat.apply(this, arguments);
            syncHeaderCat();
        };
    }

    // Also refresh the header after diary/calendar rendering.
    const originalOpenHistory = window.openHistory;
    if (typeof originalOpenHistory === "function") {
        window.openHistory = function () {
            const result = originalOpenHistory.apply(this, arguments);
            syncHeaderCat();
            return result;
        };
    }

    function setupEventNote() {
        const note = document.getElementById("calendarEventNote");
        if (!note) return;

        note.classList.add("note-placeholder-centered");

        const syncNoteState = () => {
            note.classList.toggle("has-value", note.value.trim().length > 0);
        };

        note.addEventListener("input", syncNoteState);
        syncNoteState();
    }

    // The event form is created dynamically, so observe the document for it.
    if (document.readyState !== "loading") setupEventNote();
    document.addEventListener("click", () => setTimeout(setupEventNote, 0));
})();
