// ========================================
// ЖИЗНЬ С КОШКОЙ
// UTILS.JS
// Общие вспомогательные функции
// MVP 0.9.4
// ========================================


// ========================================
// DATE
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
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");
}


// ========================================
// DATE DISPLAY
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
// CAT AGE
// ========================================

function getCatAgeText(cat) {

    if (cat.birthDate) {

        const birth =
            new Date(
                `${cat.birthDate}T12:00:00`
            );

        const now =
            new Date();


        let years =
            now.getFullYear()
            -
            birth.getFullYear();


        let months =
            now.getMonth()
            -
            birth.getMonth();


        if (
            now.getDate()
            <
            birth.getDate()
        ) {

            months--;

        }


        if (months < 0) {

            years--;

            months += 12;

        }


        if (years < 1) {

            const totalMonths =
                Math.max(
                    0,

                    (
                        now.getFullYear()
                        -
                        birth.getFullYear()
                    ) * 12

                    +

                    (
                        now.getMonth()
                        -
                        birth.getMonth()
                    )
                );


            return formatMonths(
                totalMonths
            );
        }


        return formatYears(
            years
        );
    }


    if (
        cat.ageValue !== null &&
        cat.ageValue !== undefined
    ) {

        if (
            cat.ageUnit === "months"
        ) {

            return formatMonths(
                cat.ageValue
            );
        }


        return formatYears(
            cat.ageValue
        );
    }


    return "Возраст не указан";
}


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
// PLURALIZATION
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


    if (
        last === 1
    ) {

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
// HTML SECURITY
// ========================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;
}
