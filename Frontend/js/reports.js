
const API_URL = "http://localhost:5080/api";

let allSales = [];
let allPayments = [];
let allVehicles = [];

const money = value =>
    Number(value || 0).toLocaleString("en-US", {
        maximumFractionDigits: 2
    });

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

async function getData(endpoint) {
    const response = await fetch(`${API_URL}/${endpoint}`);

    if (!response.ok) {
        throw new Error(`تعذر تحميل بيانات ${endpoint}`);
    }

    return response.json();
}

async function loadReports() {
    try {
        const [sales, payments, vehicles] = await Promise.all([
            getData("Sales"),
            getData("Payments"),
            getData("Vehicles")
        ]);

        allSales = sales;
        allPayments = payments;
        allVehicles = vehicles;

        renderInventory();
        applyDateFilter();

    } catch (error) {
        document.getElementById("reportSalesRows").innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    ${escapeHTML(error.message)}
                    <br>تأكدي أن الـ Backend يعمل.
                </td>
            </tr>
        `;
    }
}

// حساب إجمالي الدفعات الإضافية لكل عملية بيع
function getExtraPayments(saleId) {
    return allPayments
        .filter(payment => Number(payment.saleId) === Number(saleId))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

// حساب إجمالي المبلغ المحصل من عملية البيع
function getCollected(sale) {
    return Number(sale.depositAmount || 0) +
        getExtraPayments(sale.id);
}

// حساب المبلغ المتبقي
function getRemaining(sale) {
    return Math.max(
        0,
        Number(sale.salePrice || 0) - getCollected(sale)
    );
}

// عرض إحصائيات المخزون
function renderInventory() {
    const available = allVehicles.filter(vehicle => {
        const status = String(vehicle.status || "").toLowerCase();
        return status === "available" || status === "متاحة";
    }).length;

    const reserved = allVehicles.filter(vehicle => {
        const status = String(vehicle.status || "").toLowerCase();
        return status === "reserved" || status === "محجوزة";
    }).length;

    const sold = allVehicles.filter(vehicle => {
        const status = String(vehicle.status || "").toLowerCase();
        return status === "sold" || status === "مباعة";
    }).length;

    document.getElementById("availableCount").textContent = available;
    document.getElementById("reservedCount").textContent = reserved;
    document.getElementById("soldCount").textContent = sold;
    document.getElementById("inventoryTotal").textContent = allVehicles.length;
}

// فلترة المبيعات حسب التاريخ
function applyDateFilter() {
    const fromValue = document.getElementById("dateFrom").value;
    const toValue = document.getElementById("dateTo").value;

    if (fromValue && toValue && fromValue > toValue) {
        alert("تاريخ البداية يجب أن يكون قبل تاريخ النهاية.");
        return;
    }

    const filteredSales = allSales.filter(sale => {
        if (sale.status === "ملغاة") return false;

        if (!sale.saleDateUtc) return false;

        const saleDate = new Date(sale.saleDateUtc);
        const saleDay = [
            saleDate.getFullYear(),
            String(saleDate.getMonth() + 1).padStart(2, "0"),
            String(saleDate.getDate()).padStart(2, "0")
        ].join("-");

        if (fromValue && saleDay < fromValue) return false;
        if (toValue && saleDay > toValue) return false;

        return true;
    });

    renderSalesStats(filteredSales);
    renderSalesTable(filteredSales);
    renderTopVehicles(filteredSales);
}

// إحصائيات المبيعات
function renderSalesStats(sales) {
    const totalRevenue = sales.reduce(
        (sum, sale) => sum + Number(sale.salePrice || 0), 0
    );

    const totalCollected = sales.reduce(
        (sum, sale) => sum + getCollected(sale), 0
    );

    const totalRemaining = sales.reduce(
        (sum, sale) => sum + getRemaining(sale), 0
    );

    document.getElementById("reportSalesCount").textContent =
        sales.length;

    document.getElementById("reportRevenue").textContent =
        money(totalRevenue);

    document.getElementById("reportCollected").textContent =
        money(totalCollected);

    document.getElementById("reportRemaining").textContent =
        money(totalRemaining);
}

// جدول تفاصيل المبيعات
function renderSalesTable(sales) {
    const tbody = document.getElementById("reportSalesRows");

    if (sales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    لا توجد مبيعات خلال الفترة المحددة.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = sales.map(sale => {
        const vehicle = sale.vehicle
            ? `${sale.vehicle.make || ""} ${sale.vehicle.model || ""}`
            : "غير محدد";

        const customer = sale.customer?.fullName || "غير محدد";

        const extraPayments = getExtraPayments(sale.id);
        const remaining = getRemaining(sale);

        const date = sale.saleDateUtc
            ? new Date(sale.saleDateUtc).toLocaleDateString("ar-EG")
            : "-";

        return `
            <tr>
                <td>#${sale.id}</td>
                <td>${escapeHTML(vehicle)}</td>
                <td>${escapeHTML(customer)}</td>
                <td>${money(sale.salePrice)} ر.س</td>
                <td>${money(sale.depositAmount)} ر.س</td>
                <td>${money(extraPayments)} ر.س</td>
                <td>${money(remaining)} ر.س</td>
                <td>${date}</td>
            </tr>
        `;
    }).join("");
}

// أكثر السيارات مبيعًا
function renderTopVehicles(sales) {
    const tbody = document.getElementById("topVehiclesRows");

    const vehicleStats = {};

    sales.forEach(sale => {
        const vehicleId = sale.vehicleId;

        const vehicleName = sale.vehicle
            ? `${sale.vehicle.make || ""} ${sale.vehicle.model || ""}`
            : "سيارة غير محددة";

        if (!vehicleStats[vehicleId]) {
            vehicleStats[vehicleId] = {
                name: vehicleName,
                count: 0,
                revenue: 0
            };
        }

        vehicleStats[vehicleId].count++;
        vehicleStats[vehicleId].revenue += Number(sale.salePrice || 0);
    });

    const topVehicles = Object.values(vehicleStats)
        .sort((a, b) => b.count - a.count);

    if (topVehicles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="empty">
                    لا توجد بيانات مبيعات.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = topVehicles.map(vehicle => `
        <tr>
            <td>${escapeHTML(vehicle.name)}</td>
            <td>${vehicle.count}</td>
            <td>${money(vehicle.revenue)} ر.س</td>
        </tr>
    `).join("");
}

// تطبيق الفلتر
document.getElementById("applyFilter")
    .addEventListener("click", applyDateFilter);

// إعادة ضبط الفلتر
document.getElementById("resetFilter")
    .addEventListener("click", () => {
        document.getElementById("dateFrom").value = "";
        document.getElementById("dateTo").value = "";

        applyDateFilter();
    });

// طباعة التقرير
document.getElementById("printReport")
    .addEventListener("click", () => {
        window.print();
    });

// السنة الحالية
document.getElementById("year").textContent =
    new Date().getFullYear();

// تحميل البيانات
loadReports();
