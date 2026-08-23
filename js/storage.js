// ========================================
// ЖИЗНЬ С КОШКОЙ
// STORAGE LAYER — 0.9.8
// ========================================
// В обычном браузере используем localStorage.
// В MAX используем DeviceStorage, привязанный к пользователю.

const APP_STORAGE_PREFIX = "zhizn_s_koshkoi";

function isMaxApp() {
    return Boolean(window.WebApp && typeof window.WebApp === "object");
}

function getMaxDeviceStorage() {
    return window.WebApp?.DeviceStorage || window.WebApp?.deviceStorage || null;
}

async function appStorageGet(key, fallback = null) {
    const storage = getMaxDeviceStorage();

    if (isMaxApp() && storage && typeof storage.getItem === "function") {
        try {
            const value = await storage.getItem(`${APP_STORAGE_PREFIX}:${key}`);
            return value === null || value === undefined ? fallback : value;
        } catch (error) {
            console.warn("MAX DeviceStorage read failed:", error);
        }
    }

    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        console.warn("localStorage read failed:", error);
        return fallback;
    }
}

async function appStorageSet(key, value) {
    const storage = getMaxDeviceStorage();
    const serialized = JSON.stringify(value);

    if (isMaxApp() && storage && typeof storage.setItem === "function") {
        try {
            await storage.setItem(`${APP_STORAGE_PREFIX}:${key}`, serialized);
            return true;
        } catch (error) {
            console.warn("MAX DeviceStorage write failed:", error);
        }
    }

    try {
        localStorage.setItem(key, serialized);
        return true;
    } catch (error) {
        console.warn("localStorage write failed:", error);
        return false;
    }
}

async function appStorageRemove(key) {
    const storage = getMaxDeviceStorage();

    if (isMaxApp() && storage && typeof storage.removeItem === "function") {
        try {
            await storage.removeItem(`${APP_STORAGE_PREFIX}:${key}`);
            return true;
        } catch (error) {
            console.warn("MAX DeviceStorage remove failed:", error);
        }
    }

    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.warn("localStorage remove failed:", error);
        return false;
    }
}

window.AppStorage = {
    isMaxApp,
    get: appStorageGet,
    set: appStorageSet,
    remove: appStorageRemove
};
