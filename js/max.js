// ========================================
// MAX INTEGRATION — DIAGNOSTIC 0.9.8
// Temporary test for MAX Bridge connection
// ========================================

(function () {
    function getMaxStatus() {
        const webApp = window.WebApp;
        const user = webApp?.initDataUnsafe?.user;

        if (!webApp) {
            return {
                ok: false,
                title: "MAX Bridge не найден",
                text: "Приложение открыто не через MAX или библиотека не загрузилась."
            };
        }

        if (!user) {
            return {
                ok: false,
                title: "MAX подключён, но пользователь не определён",
                text: "Bridge работает, но данные пользователя не переданы."
            };
        }

        const userId = user.user_id ?? user.id ?? null;

        return {
            ok: Boolean(userId),
            title: userId ? "MAX подключён ✓" : "MAX подключён, но ID не получен",
            text: userId
                ? `Пользователь: ${user.first_name || "без имени"} · ID получен ✓`
                : `Пользователь: ${user.first_name || "без имени"} · стабильный ID не найден`
        };
    }

    function showMaxDiagnostic() {
        const result = getMaxStatus();
        const panel = document.getElementById("maxDiagnosticResult");
        if (!panel) return;

        panel.hidden = false;
        panel.innerHTML = `
            <strong>${result.title}</strong>
            <span>${result.text}</span>
        `;
        panel.dataset.ok = result.ok ? "true" : "false";
    }

    function createDiagnostic() {
        if (document.getElementById("maxDiagnosticButton")) return;

        const style = document.createElement("style");
        style.textContent = `
            #maxDiagnostic {
                position: fixed;
                left: 12px;
                right: 12px;
                bottom: 12px;
                z-index: 9999;
                padding: 10px;
                border: 1px solid rgba(0,0,0,.12);
                border-radius: 12px;
                background: rgba(247,245,240,.96);
                box-shadow: 0 4px 18px rgba(0,0,0,.12);
                font: 14px/1.35 system-ui, sans-serif;
            }
            #maxDiagnosticButton {
                width: 100%;
                padding: 9px 12px;
                border: 0;
                border-radius: 9px;
                background: #222;
                color: #fff;
                cursor: pointer;
            }
            #maxDiagnosticResult {
                margin-top: 8px;
            }
            #maxDiagnosticResult strong,
            #maxDiagnosticResult span {
                display: block;
            }
            #maxDiagnosticResult[data-ok="true"] strong {
                color: #286b3a;
            }
            #maxDiagnosticResult[data-ok="false"] strong {
                color: #8a3b32;
            }
        `;
        document.head.appendChild(style);

        const box = document.createElement("div");
        box.id = "maxDiagnostic";
        box.innerHTML = `
            <button type="button" id="maxDiagnosticButton">Проверить MAX</button>
            <div id="maxDiagnosticResult" hidden></div>
        `;
        document.body.appendChild(box);

        document
            .getElementById("maxDiagnosticButton")
            .addEventListener("click", showMaxDiagnostic);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createDiagnostic);
    } else {
        createDiagnostic();
    }
})();
