// ========================================
// 0.9.3 — HEALTH AVATAR RENDERING
// ========================================

function normalizeHealthAvatars() {
    document.querySelectorAll(".health-avatar").forEach(button => {
        const value = button.textContent.trim();
        if (!value.startsWith("data:image/")) return;
        button.textContent = "";
        const img = document.createElement("img");
        img.src = value;
        img.alt = "Фото кошки";
        button.appendChild(img);
    });
}

const healthAvatarObserver = new MutationObserver(() => {
    normalizeHealthAvatars();
});

document.addEventListener("DOMContentLoaded", () => {
    healthAvatarObserver.observe(document.getElementById("content"), {
        childList: true,
        subtree: true
    });
    normalizeHealthAvatars();
});
