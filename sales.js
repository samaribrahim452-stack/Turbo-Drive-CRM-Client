
const API_URL = "http://localhost:5080/api";

const salesTableBody = document.getElementById("salesTableBody");
const saleModal = document.getElementById("saleModal");
const saleForm = document.getElementById("saleForm");

let sales = [];
let vehicles = [];
let customers = [];

const money = value =>
    Number(value || 0).toLocaleString("en-US", {
        maximumFractionDigits: 2
    });

async function apiGet(endpoint) {
    const response = await fetch(`${API_URL}/${endpoint}`);

    if (!response.ok) {
        throw new Error("تعذر تحميل البيانات من السيرفر.");
    }

    return response.json();
}

async function loadPageData() {
    try {
        const [salesData, vehiclesData, customersData] = await Promise.all([
            apiGet("Sales"),
            apiGet("Vehicles"),
            apiGet("Customers")
        ]);

        sales = salesData;
        vehicles = vehiclesData;
        customers = customersData;

        fillVehicleOptions();
        fillCustomerOptions();
        renderSales();
        renderStats();

    } catch (error) {
        salesTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    ${error.message} تأكدي أن الـ Backend يعمل.
                </td>
            </tr>
        `;
    }
}

function fillVehicleOptions() {
    const select = document.getElementById("vehicleId");

    select.innerHTML = `<option value="">اختاري السيارة</option>`;

    vehicles
        .filter(vehicle => {
            const status = String(vehicle.status || "").toLowerCase();
            return status === "available" || status === "متاحة";
        })
        .forEach(vehicle => {
            const option = document.createElement("option");
            option.value = vehicle.id;
            option.textContent =
                `${vehicle.make} ${vehicle.model} - ${vehicle.year} - ${money(vehicle.price)} ريال`;

            select.appendChild(option);
        });
}

function fillCustomerOptions() {
    const select = document.getElementById("customerId");

    select.innerHTML = `<option value="">اختاري العميل</option>`;

    customers.forEach(customer => {
        const option = document.createElement("option");
        option.value = customer.id;
        option.textContent = customer.fullName;
        select.appendChild(option);
    });
}

function getStatusClass(status) {
    if (status === "مكتملة") return "status-completed";
    if (status === "ملغاة") return "status-cancelled";
    return "status-pending";
}

function renderStats() {
    const activeSales = sales.filter(sale => sale.status !== "ملغاة");

    const totalRevenue = activeSales.reduce(
        (sum, sale) => sum + Number(sale.salePrice || 0), 0
    );

    const totalCollected = activeSales.reduce(
        (sum, sale) => sum + Number(sale.depositAmount || 0), 0
    );

    document.getElementById("totalSales").textContent = activeSales.length;
    document.getElementById("totalRevenue").textContent = money(totalRevenue);
    document.getElementById("totalCollected").textContent = money(totalCollected);
    document.getElementById("totalRemaining").textContent =
        money(totalRevenue - totalCollected);
}

function renderSales() {
    const search = document.getElementById("searchSales").value
        .trim().toLowerCase();

    const statusFilter = document.getElementById("statusFilter").value;

    const filteredSales = sales.filter(sale => {
        const vehicleName =
            `${sale.vehicle?.make || ""} ${sale.vehicle?.model || ""}`.toLowerCase();

        const customerName =
            (sale.customer?.fullName || "").toLowerCase();

        const matchesSearch =
            vehicleName.includes(search) || customerName.includes(search);

        const matchesStatus =
            !statusFilter || sale.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (filteredSales.length === 0) {
        salesTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">لا توجد عمليات بيع لعرضها.</td>
            </tr>
        `;
        return;
    }

    salesTableBody.innerHTML = filteredSales.map(sale => {
        const vehicleName =
            `${sale.vehicle?.make || "سيارة"} ${sale.vehicle?.model || ""}`;

        const customerName = sale.customer?.fullName || "غير محدد";

        const remaining =
            Number(sale.salePrice || 0) - Number(sale.depositAmount || 0);

        const date = sale.saleDateUtc
            ? new Date(sale.saleDateUtc).toLocaleDateString("ar-EG")
            : "-";

        return `
            <tr>
                <td>#${sale.id}</td>
                <td>${escapeHTML(vehicleName)}</td>
                <td>${escapeHTML(customerName)}</td>
                <td>${money(sale.salePrice)}</td>
                <td>${money(sale.depositAmount)}</td>
                <td>${money(remaining)}</td>
                <td>
                    <span class="status-badge ${getStatusClass(sale.status)}">
                        ${escapeHTML(sale.status || "مبدئية")}
                    </span>
                </td>
                <td>${date}</td>
            </tr>
        `;
    }).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function updateRemainingPreview() {
    const price = Number(document.getElementById("salePrice").value || 0);
    const deposit = Number(document.getElementById("depositAmount").value || 0);

    const remaining = price - deposit;

    document.getElementById("remainingPreview").textContent =
        `${money(Math.max(0, remaining))} ريال`;
}

function openModal() {
    saleForm.reset();
    document.getElementById("depositAmount").value = 0;
    document.getElementById("formMessage").textContent = "";
    updateRemainingPreview();
    saleModal.classList.add("show");
}

function closeModal() {
    saleModal.classList.remove("show");
}

document.getElementById("openSaleModal").addEventListener("click", openModal);
document.getElementById("closeSaleModal").addEventListener("click", closeModal);
document.getElementById("cancelSale").addEventListener("click", closeModal);

document.getElementById("salePrice").addEventListener("input", updateRemainingPreview);
document.getElementById("depositAmount").addEventListener("input", updateRemainingPreview);

document.getElementById("searchSales").addEventListener("input", renderSales);
document.getElementById("statusFilter").addEventListener("change", renderSales);

document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchSales").value = "";
    document.getElementById("statusFilter").value = "";
    renderSales();
});

saleForm.addEventListener("submit", async event => {
    event.preventDefault();

    const vehicleId = Number(document.getElementById("vehicleId").value);
    const customerId = Number(document.getElementById("customerId").value);
    const salePrice = Number(document.getElementById("salePrice").value);
    const depositAmount = Number(document.getElementById("depositAmount").value);
    const status = document.getElementById("saleStatus").value;

    const message = document.getElementById("formMessage");
    const saveButton = document.getElementById("saveSaleBtn");

    if (!vehicleId || !customerId) {
        message.textContent = "اختاري السيارة والعميل أولاً.";
        return;
    }

    if (salePrice <= 0 || depositAmount < 0 || depositAmount > salePrice) {
        message.textContent = "تأكدي من سعر البيع والمقدم. المقدم لا يمكن أن يتجاوز سعر البيع.";
        return;
    }

    const sale = {
        vehicleId,
        customerId,
        salePrice,
        depositAmount,
        status
    };

    try {
        saveButton.disabled = true;
        saveButton.textContent = "جاري الحفظ...";
        message.textContent = "";

        const response = await fetch(`${API_URL}/Sales`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sale)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "حدث خطأ أثناء حفظ عملية البيع.");
        }

        closeModal();
        await loadPageData();

    } catch (error) {
        message.textContent = error.message;
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "حفظ عملية البيع";
    }
});

loadPageData();
