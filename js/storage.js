// ========================================
// ЖИЗНЬ С КОШКОЙ
// STORAGE LAYER — 0.9.8
// ========================================
// Общие модули приложения продолжают работать синхронно.
// В MAX данные дополнительно зеркалируются в DeviceStorage,
// которое привязано к пользователю MAX.

const APP_STORAGE_PREFIX = "zhizn_s_koshkoi:";

function isMaxApp() {
    return Boolean(window.WebApp && typeof window.WebApp === "object");
}

function getMaxDeviceStorage() {
    return window.WebApp?.DeviceStorage || null;
}

function maxStorageKey(key) {
    return `${APP_STORAGE_PREFIX}${key}`;
}

function appStorageGet(key, fallback = null) {
    const storage = getMaxDeviceStorage();

    if (isMaxApp() && storage && typeof storage.getItem === "function") {
        try {
            const value = storage.getItem(maxStorageKey(key));
            if (value !== null && value !== undefined && value !== "") {
                try { return JSON.parse(value); } catch { return value; }
            }
        } catch (error) {
            console.warn("MAX DeviceStorage read failed:", error);
        }
    }

    try {
        const value = localStorage.getItem(key);
        if (value === null) return fallback;
        try { return JSON.parse(value); } catch { return value; }
    } catch (error) {
        console.warn("localStorage read failed:", error);
        return fallback;
    }
}

function appStorageSet(key, value) {
    const serialized = JSON.stringify(value);
    let saved = false;

    try {
        localStorage.setItem(key, serialized);
        saved = true;
    } catch (error) {
        console.warn("localStorage write failed:", error);
    }

    const storage = getMaxDeviceStorage();
    if (isMaxApp() && storage && typeof storage.setItem === "function") {
        try {
            storage.setItem(maxStorageKey(key), serialized);
            saved = true;
        } catch (error) {
            console.warn("MAX DeviceStorage write failed:", error);
        }
    }

    return saved;
}

function appStorageRemove(key) {
    let removed = false;

    try {
        localStorage.removeItem(key);
        removed = true;
    } catch (error) {
        console.warn("localStorage remove failed:", error);
    }

    const storage = getMaxDeviceStorage();
    if (isMaxApp() && storage && typeof storage.removeItem === "function") {
        try {
            storage.removeItem(maxStorageKey(key));
            removed = true;
        } catch (error) {
            console.warn("MAX DeviceStorage remove failed:", error);
        }
    }

    return removed;
}

function hydrateMaxStorage(keys = []) {
    const storage = getMaxDeviceStorage();
    if (!isMaxApp() || !storage || typeof storage.getItem !== "function") return;

    keys.forEach(key => {
        try {
            const maxValue = storage.getItem(maxStorageKey(key));
            if (maxValue !== null && maxValue !== undefined && maxValue !== "") {
                localStorage.setItem(key, maxValue);
                return;
            }

            const localValue = localStorage.getItem(key);
            if (localValue !== null && typeof storage.setItem === "function") {
                storage.setItem(maxStorageKey(key), localValue);
            }
        } catch (error) {
            console.warn(`MAX storage hydration failed for ${key}:`, error);
        }
    });
}

window.AppStorage = {
    isMaxApp,
    get: appStorageGet,
    set: appStorageSet,
    remove: appStorageRemove,
    hydrateMaxStorage
};
