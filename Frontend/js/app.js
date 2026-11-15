 
const API_URL = "http://localhost:5080/api";

// تحميل إحصائيات لوحة التحكم
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/Dashboard/summary`);

        if (!response.ok) {
            throw new Error("تعذر تحميل الإحصائيات");
        }

        const data = await response.json();

        document.getElementById("vehicleCount").textContent =
            data.totalVehicles;

        document.getElementById("customerCount").textContent =
            data.totalCustomers;

        document.getElementById("salesCount").textContent =
            data.totalSales;

        document.getElementById("salesValue").textContent =
            `${Number(data.totalRevenue).toLocaleString("ar-SA")} ر.س`;

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

// ترجمة حالة السيارة
function translateStatus(status) {
    const statuses = {
        Available: "متاحة",
        Sold: "مباعة",
        Reserved: "محجوزة"
    };

    return statuses[status] || status || "غير محددة";
}

// حماية النصوص المعروضة داخل HTML
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}

// تحميل السيارات من قاعدة البيانات
async function loadVehicles() {
    const rows = document.getElementById("vehicleRows");

    try {
        const response = await fetch(`${API_URL}/Vehicles`);

        if (!response.ok) {
            throw new Error("تعذر تحميل السيارات");
        }

        const vehicles = await response.json();

        if (!vehicles.length) {
            rows.innerHTML =
                '<tr><td colspan="4" class="empty">لا توجد سيارات مسجلة</td></tr>';
            return;
        }

        rows.innerHTML = vehicles.map(vehicle => `
            <tr>
                <td>${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</td>
                <td>${escapeHtml(vehicle.year)}</td>
                <td>${Number(vehicle.price).toLocaleString("ar-SA")} ر.س</td>
                <td>${escapeHtml(translateStatus(vehicle.status))}</td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Vehicles Error:", error);

        rows.innerHTML =
            '<tr><td colspan="4" class="empty">تعذر تحميل بيانات السيارات</td></tr>';
    }
}

// تحديث سنة حقوق النشر
document.getElementById("year").textContent =
    new Date().getFullYear();

// تحميل البيانات عند فتح الصفحة
loadDashboard();
loadVehicles();
