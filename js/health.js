// ЖИЗНЬ С КОШКОЙ
// HEALTH — medical data layer
// 0.9.4
//
// health.js owns medical data only.
// calendar.js reads this data for display and does not store a second copy.

const HEALTH_KEY = "catHealthProfiles";

const HEALTH_EVENT_TYPES = [
    { id: "vaccination", name: "Вакцинация", emoji: "💉" },
    { id: "endo", name: "Эндопаразиты", emoji: "🪱" },
    { id: "ecto", name: "Эктопаразиты", emoji: "🦟" },
    { id: "dental_cleaning", name: "Ультразвуковая чистка зубов под наркозом", emoji: "🦷" },
    { id: "medicine", name: "Лечение / лекарство", emoji: "💊" },
    { id: "other", name: "Другое", emoji: "🩺" }
];

function getHealthData() {
    try {
        const saved = localStorage.getItem(HEALTH_KEY);
        const data = saved ? JSON.parse(saved) : {};
        return data && typeof data === "object" ? data : {};
    } catch (error) {
        console.error("Не удалось прочитать данные здоровья", error);
        return {};
    }
}

function saveHealthData(data) {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(data));
}

function getCatHealth(catId) {
    const data = getHealthData();
    const profile = data[catId];

    return {
        gender: profile?.gender || "",
        avatar: profile?.avatar || "",
        medicalEvents: Array.isArray(profile?.medicalEvents)
            ? profile.medicalEvents
            : []
    };
}

function saveCatHealth(catId, profile) {
    if (!catId) return;

    const data = getHealthData();
    data[catId] = {
        gender: profile?.gender || "",
        avatar: profile?.avatar || "",
        medicalEvents: Array.isArray(profile?.medicalEvents)
            ? profile.medicalEvents
            : []
    };

    saveHealthData(data);
}

function getHealthEventTypes() {
    return HEALTH_EVENT_TYPES.map(type => ({ ...type }));
}

function getHealthEventType(typeId) {
    return HEALTH_EVENT_TYPES.find(type => type.id === typeId) || HEALTH_EVENT_TYPES[HEALTH_EVENT_TYPES.length - 1];
}

function getHealthEventTypeLabel(typeId) {
    return getHealthEventType(typeId).name;
}

function getHealthEventEmoji(event) {
    return event?.emoji || getHealthEventType(event?.type).emoji;
}

function getAllHealthEvents(catId) {
    return getCatHealth(catId).medicalEvents;
}

function getUpcomingHealthEvents(catId) {
    const today = typeof getTodayKey === "function"
        ? getTodayKey()
        : new Date().toISOString().slice(0, 10);

    return getAllHealthEvents(catId)
        .filter(event => (event.nextDate || event.date || "") >= today)
        .sort((a, b) => (a.nextDate || a.date || "").localeCompare(b.nextDate || b.date || ""));
}

function createHealthEvent(catId, eventData) {
    if (!catId) return null;

    const profile = getCatHealth(catId);
    const type = getHealthEventType(eventData?.type);
    const event = {
        id: eventData?.id || `health_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: type.id,
        title: eventData?.title || type.name,
        emoji: eventData?.emoji || type.emoji,
        date: eventData?.date || "",
        nextDate: eventData?.nextDate || "",
        reminderDays: Number(eventData?.reminderDays || 14),
        note: eventData?.note || ""
    };

    profile.medicalEvents.push(event);
    saveCatHealth(catId, profile);
    return event;
}

function updateHealthEvent(catId, eventId, eventData) {
    if (!catId || !eventId) return null;

    const profile = getCatHealth(catId);
    const index = profile.medicalEvents.findIndex(event => event.id === eventId);
    if (index < 0) return null;

    const current = profile.medicalEvents[index];
    const type = getHealthEventType(eventData?.type || current.type);

    profile.medicalEvents[index] = {
        ...current,
        ...eventData,
        id: eventId,
        type: type.id,
        title: eventData?.title || type.name,
        emoji: eventData?.emoji || type.emoji
    };

    saveCatHealth(catId, profile);
    return profile.medicalEvents[index];
}

function deleteHealthEvent(catId, eventId) {
    if (!catId || !eventId) return false;

    const profile = getCatHealth(catId);
    const before = profile.medicalEvents.length;
    profile.medicalEvents = profile.medicalEvents.filter(event => event.id !== eventId);

    if (profile.medicalEvents.length === before) return false;

    saveCatHealth(catId, profile);
    return true;
}

function getHealthEventDate(event) {
    return event?.nextDate || event?.date || "";
}

function formatHealthDate(date) {
    if (!date) return "—";
    return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatHealthShortDate(date) {
    if (!date) return "";
    return new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short"
    });
}
