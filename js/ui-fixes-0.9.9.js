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

    // Keep the global header avatar synchronized with diary navigation.
    const originalSwitchDiaryCat = window.switchDiaryCat;
    if (typeof originalSwitchDiaryCat === "function") {
        window.switchDiaryCat = function (catId) {
            const result = originalSwitchDiaryCat.apply(this, arguments);
            syncHeaderCat();
            return result;
        };
    }

    const originalOpenHistory = window.openHistory;
    if (typeof originalOpenHistory === "function") {
        window.openHistory = function () {
            const result = originalOpenHistory.apply(this, arguments);
            syncHeaderCat();
            return result;
        };
    }

    // The event form is created dynamically. Enhance each textarea only once;
    // the previous version added another input listener after every document click.
    function setupEventNote() {
        const note = document.getElementById("calendarEventNote");
        if (!note || note.dataset.uiEnhanced === "1") return;

        note.dataset.uiEnhanced = "1";
        note.classList.add("note-placeholder-centered");

        const syncNoteState = () => {
            note.classList.toggle("has-value", note.value.trim().length > 0);
        };

        note.addEventListener("input", syncNoteState);
        syncNoteState();
    }

    if (document.readyState !== "loading") setupEventNote();
    document.addEventListener("click", () => setTimeout(setupEventNote, 0));

    // ========================================
    // CAT GENDER ICON
    // ========================================
    function getCatGenderIcon(gender) {
        const value = String(gender || "").toLowerCase().trim();
        if (["female", "f", "женский", "самка", "кошка"].includes(value)) return "♀";
        if (["male", "m", "мужской", "самец", "кот"].includes(value)) return "♂";
        return "";
    }

    function renderCatGenderIcon() {
        const title = document.querySelector(".cat-card .cat-info h2");
        const cat = typeof window.getActiveCat === "function" ? window.getActiveCat() : null;
        if (!title || !cat) return;

        const icon = getCatGenderIcon(cat.gender);
        const current = title.querySelector(".cat-gender-icon");

        // Avoid DOM writes when nothing changed. This also prevents the
        // MutationObserver feedback loop that the old implementation created.
        if ((current?.textContent || "") === icon) return;
        current?.remove();

        if (!icon) return;

        const span = document.createElement("span");
        span.className = "cat-gender-icon";
        span.setAttribute("aria-hidden", "true");
        span.textContent = icon;
        title.appendChild(span);
    }

    // Rendering is already centralized in app.js. A small wrapper is enough;
    // observing the entire content subtree caused repeated callbacks and
    // unnecessary work on every DOM mutation.
    const originalRenderApp = window.renderApp;
    if (typeof originalRenderApp === "function") {
        window.renderApp = function () {
            const result = originalRenderApp.apply(this, arguments);
            requestAnimationFrame(() => {
                renderCatGenderIcon();
                setupEventNote();
            });
            return result;
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            renderCatGenderIcon();
            setupEventNote();
        }, { once: true });
    } else {
        renderCatGenderIcon();
        setupEventNote();
    }
})();