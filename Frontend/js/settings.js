const SETTINGS_KEY = "turboDriveSettings";

const defaultSettings = {
    showroomName: "Turbo Drive",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    currency: "SAR",
    language: "ar",
    stockAlerts: true,
    paymentAlerts: true
};

const fields = [
    "showroomName",
    "ownerName",
    "phone",
    "email",
    "address",
    "description",
    "currency",
    "language",
    "stockAlerts",
    "paymentAlerts"
];

function getSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        return saved
            ? { ...defaultSettings, ...JSON.parse(saved) }
            : { ...defaultSettings };
    } catch {
        return { ...defaultSettings };
    }
}

function showMessage(message, isError = false) {
    const messageElement = document.getElementById("settingsMessage");

    messageElement.textContent = message;
    messageElement.classList.toggle("error", isError);
}

function loadSettings() {
    const settings = getSettings();

    fields.forEach(field => {
        const element = document.getElementById(field);

        if (!element) return;

        if (element.type === "checkbox") {
            element.checked = Boolean(settings[field]);
        } else {
            element.value = settings[field] ?? "";
        }
    });
}

function saveSettings() {
    const settings = {};

    fields.forEach(field => {
        const element = document.getElementById(field);

        if (!element) return;

        settings[field] = element.type === "checkbox"
            ? element.checked
            : element.value.trim();
    });

    if (!settings.showroomName) {
        showMessage("من فضلك اكتبي اسم المعرض.", true);
        return;
    }

    if (
        settings.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)
    ) {
        showMessage("البريد الإلكتروني غير صحيح.", true);
        return;
    }

    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        showMessage("تم حفظ الإعدادات بنجاح.");
    } catch {
        showMessage("تعذر حفظ الإعدادات على هذا المتصفح.", true);
    }
}

function resetSettings() {
    const confirmed = confirm(
        "هل أنتِ متأكدة من استعادة الإعدادات الافتراضية؟"
    );

    if (!confirmed) return;

    localStorage.removeItem(SETTINGS_KEY);

    loadSettings();
    showMessage("تم استعادة الإعدادات الافتراضية.");
}

document.getElementById("saveSettings")
    .addEventListener("click", saveSettings);

document.getElementById("resetSettings")
    .addEventListener("click", resetSettings);

document.getElementById("year").textContent =
    new Date().getFullYear();

loadSettings();