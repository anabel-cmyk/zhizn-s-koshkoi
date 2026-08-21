// ========================================
// DIARY — RELATIVE DATES
// ========================================

function getRelativeDiaryLabel(dateKey) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(`${dateKey}T12:00:00`);
    date.setHours(0, 0, 0, 0);

    const diff = Math.round((today - date) / 86400000);

    if (diff === 0) return "Сегодня";
    if (diff === 1) return "Вчера";
    if (diff === 2) return "Позавчера";

    return formatDate(dateKey);
}

function updateDiaryRelativeDates() {
    document.querySelectorAll(".history-date").forEach(element => {
        const text = element.textContent.trim();
        if (!/^\d{2}\.\d{2}\.\d{4}$/.test(text)) return;

        const [day, month, year] = text.split(".");
        const key = `${year}-${month}-${day}`;
        element.textContent = getRelativeDiaryLabel(key);
    });
}

const diaryRelativeDateObserver = new MutationObserver(() => {
    updateDiaryRelativeDates();
});

document.addEventListener("DOMContentLoaded", () => {
    diaryRelativeDateObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    updateDiaryRelativeDates();
});
