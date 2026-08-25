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

    // ========================================
    // CAT GENDER ICON
    // ========================================
    // Visual marker only: ♀ for a female cat, ♂ for a male cat.
    // It is added after the dashboard renders, so switching cats and
    // navigating back to the home screen always refreshes the marker.
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

        title.querySelector(".cat-gender-icon")?.remove();

        const icon = getCatGenderIcon(cat.gender);
        if (!icon) return;

        const span = document.createElement("span");
        span.className = "cat-gender-icon";
        span.setAttribute("aria-hidden", "true");
        span.textContent = icon;
        title.appendChild(span);
    }

    function watchCatGenderIcon() {
        const content = document.getElementById("content");
        if (!content || content.__genderObserver) return;

        const observer = new MutationObserver(() => {
            requestAnimationFrame(renderCatGenderIcon);
        });
        observer.observe(content, { childList: true, subtree: true });
        content.__genderObserver = observer;

        renderCatGenderIcon();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", watchCatGenderIcon, { once: true });
    } else {
        watchCatGenderIcon();
    }
})();
