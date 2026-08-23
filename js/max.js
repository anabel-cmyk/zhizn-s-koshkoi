// ========================================
// MAX INTEGRATION — DIAGNOSTIC 0.9.8
// Temporary test for MAX Bridge connection
// ========================================

(function () {
    function getMaxUser() {
        return window.WebApp?.initDataUnsafe?.user || null;
    }

    function getMaxUserId() {
        const user = getMaxUser();
        if (user?.user_id != null) return user.user_id;
        if (user?.id != null) return user.id;

        // Fallback: MAX documents the user object inside initData.
        // We only use this locally for diagnostics; validation will be server-side later.
        const initData = window.WebApp?.initData || "";
        try {
            const params = new URLSearchParams(initData);
            const rawUser = params.get("user");
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                return parsedUser?.user_id ?? parsedUser?.id ?? null;
            }
        } catch (error) {
            // Diagnostic only — ignore malformed/unavailable initData.
        }

        return null;
    }

    function showMaxDiagnostic() {
        const webApp = window.WebApp;
        const user = getMaxUser();
        const userId = getMaxUserId();
        const panel = document.getElementById("maxDiagnosticResult");
        if (!panel) return;

        let title;
        let text;
        let ok = false;

        if (!webApp) {
            title = "MAX Bridge не найден";
            text = "Приложение открыто не через MAX или библиотека не загрузилась.";
        } else if (!user) {
            title = "MAX подключён, но пользователь не определён";
            text = "Bridge работает, но данные пользователя не переданы.";
        } else if (!userId) {
            title = "MAX подключён ✓";
            text = `Пользователь: ${user.first_name || user.name || "без имени"} · ID пока не найден`;
        } else {
            title = "MAX подключён ✓";
            text = `Пользователь: ${user.first_name || user.name || "без имени"} · ID получен ✓`;
            ok = true;
        }

        panel.hidden = false;
        panel.innerHTML = `
            <strong>${title}</strong>
            <span>${text}</span>
        `;
        panel.dataset.ok = ok ? "true" : "false";
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
