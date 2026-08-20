// ========================================
// ЖИЗНЬ С КОШКОЙ
// UTILS.JS
// Общие вспомогательные функции
// ========================================


// ========================================
// ID
// ========================================

function createId() {

    return (
        "id_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


// ========================================
// HTML SECURITY
// ========================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


// ========================================
// DATE KEY
// ========================================

function getTodayKey() {

    return formatDateKey(
        new Date()
    );

}


function formatDateKey(date) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");

}


// ========================================
// DATE FORMAT
// ========================================

function formatDate(dateString) {

    const [
        year,
        month,
        day
    ] =
        dateString.split("-");


    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );


    return date.toLocaleDateString(
        "ru-RU",
        {
            day: "numeric",
            month: "long"
        }
    );

}


// ========================================
// PLURAL
// ========================================

function pluralize(
    number,
    one,
    few,
    many
) {

    const n =
        Math.abs(number) % 100;

    const last =
        n % 10;


    if (
        n >= 11 &&
        n <= 19
    ) {

        return `${number} ${many}`;

    }


    if (last === 1) {

        return `${number} ${one}`;

    }


    if (
        last >= 2 &&
        last <= 4
    ) {

        return `${number} ${few}`;

    }


    return `${number} ${many}`;

}


// ========================================
// AGE TEXT
// ========================================

function formatYears(value) {

    return pluralize(
        value,
        "год",
        "года",
        "лет"
    );

}


function formatMonths(value) {

    return pluralize(
        value,
        "месяц",
        "месяца",
        "месяцев"
    );

}


// ========================================
// PREVIOUS MONTH
// ========================================

function getPreviousMonth(monthKey) {

    const [
        year,
        month
    ] =
        monthKey
            .split("-")
            .map(Number);


    const date =
        new Date(
            year,
            month - 2,
            1
        );


    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0")

    ].join("-");

}


// ========================================
// MONTH NAME
// ========================================

function getMonthPrepositional(
    monthKey
) {

    const [
        year,
        month
    ] =
        monthKey
            .split("-")
            .map(Number);


    const date =
        new Date(
            year,
            month - 1,
            1
        );


    const monthNames = [

        "январе",
        "феврале",
        "марте",
        "апреле",
        "мае",
        "июне",
        "июле",
        "августе",
        "сентябре",
        "октябре",
        "ноябре",
        "декабре"

    ];


    return monthNames[
        date.getMonth()
    ];

}