
const API_URL = "http://localhost:5080/api/Vehicles";

const tableBody = document.getElementById("vehiclesTableBody");
const vehicleModal = document.getElementById("vehicleModal");
const vehicleForm = document.getElementById("vehicleForm");
const messageBox = document.getElementById("message");

let vehicles = [];
let editingId = null;
let searchTimer = null;

// حماية النصوص قبل عرضها داخل HTML
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// قراءة رسالة الخطأ من السيرفر
async function getErrorMessage(response) {
    const text = await response.text();

    if (!text) return "حدث خطأ أثناء تنفيذ العملية.";

    try {
        const data = JSON.parse(text);

        if (data.errors) {
            return Object.values(data.errors).flat().join(" - ");
        }

        return data.message || data.title || text;
    } catch {
        return text;
    }
}

// عرض رسالة للمستخدم
function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.className = `vehicle-message ${type}`;

    setTimeout(() => {
        messageBox.className = "vehicle-message";
        messageBox.textContent = "";
    }, 4000);
}

// تحديد شكل حالة السيارة
function getStatusClass(status) {
    if (status === "متاحة" || status === "Available") {
        return "status-available";
    }

    if (status === "محجوزة" || status === "Reserved") {
        return "status-reserved";
    }

    if (status === "مباعة" || status === "Sold") {
        return "status-sold";
    }

    return "";
}

// تحديث الإحصائيات
function updateStatistics() {
    document.getElementById("totalVehicles").textContent = vehicles.length;

    document.getElementById("availableVehicles").textContent =
        vehicles.filter(v => v.status === "متاحة" || v.status === "Available").length;

    document.getElementById("reservedVehicles").textContent =
        vehicles.filter(v => v.status === "محجوزة" || v.status === "Reserved").length;

    document.getElementById("soldVehicles").textContent =
        vehicles.filter(v => v.status === "مباعة" || v.status === "Sold").length;
}

// عرض السيارات في الجدول
function renderVehicles() {
    updateStatistics();

    if (vehicles.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">لا توجد سيارات مسجلة.</td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = vehicles.map(vehicle => `
        <tr>
            <td>
                <span class="vehicle-name">
                    ${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}
                </span>
                <span class="vehicle-details">
                    ${escapeHtml(vehicle.color || "اللون غير محدد")}
                </span>
            </td>

            <td>${vehicle.year}</td>

            <td>
                ${Number(vehicle.price).toLocaleString("ar-SA")} ر.س
            </td>

            <td>${escapeHtml(vehicle.engineType || "غير محدد")}</td>

            <td>
                <span class="status-badge ${getStatusClass(vehicle.status)}">
                    ${escapeHtml(vehicle.status || "غير محددة")}
                </span>
            </td>

            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" data-action="edit" data-id="${vehicle.id}">
                        تعديل
                    </button>

                    <button class="action-btn delete-btn" data-action="delete" data-id="${vehicle.id}">
                        حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// تحميل السيارات من قاعدة البيانات
async function loadVehicles() {
    tableBody.innerHTML = `
        <tr><td colspan="6" class="empty">جاري تحميل السيارات...</td></tr>
    `;

    const search = document.getElementById("searchInput").value.trim();
    const status = document.getElementById("statusFilter").value;
    const year = document.getElementById("yearFilter").value.trim();

    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (status) params.append("status", status);
    if (year) params.append("year", year);

    try {
        const response = await fetch(`${API_URL}?${params.toString()}`);

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        vehicles = await response.json();
        renderVehicles();

    } catch (error) {
        console.error("Vehicles Error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    تعذر تحميل السيارات. تأكدي أن السيرفر يعمل.
                </td>
            </tr>`;

        showMessage(error.message, "error");
    }
}

// فتح نافذة الإضافة
function openAddModal() {
    editingId = null;
    vehicleForm.reset();

    document.getElementById("modalTitle").textContent = "إضافة سيارة جديدة";
    document.getElementById("saveVehicleBtn").textContent = "حفظ السيارة";
    document.getElementById("status").value = "متاحة";
    document.getElementById("mileage").value = 0;

    vehicleModal.classList.add("show");
}

// فتح نافذة التعديل
function openEditModal(id) {
    const vehicle = vehicles.find(v => v.id === id);

    if (!vehicle) return;

    editingId = id;
    vehicleForm.reset();

    const fields = [
        "make", "model", "year", "price", "status",
        "color", "engineType", "fuelType", "transmission",
        "mileage", "vin", "plateNumber", "imageUrl", "description"
    ];

    fields.forEach(field => {
        document.getElementById(field).value = vehicle[field] ?? "";
    });

    document.getElementById("modalTitle").textContent = "تعديل بيانات السيارة";
    document.getElementById("saveVehicleBtn").textContent = "حفظ التعديلات";

    vehicleModal.classList.add("show");
}

// إغلاق النافذة
function closeModal() {
    vehicleModal.classList.remove("show");
    vehicleForm.reset();
    editingId = null;
}

// حفظ سيارة جديدة أو تعديل سيارة
vehicleForm.addEventListener("submit", async event => {
    event.preventDefault();

    const vehicle = {
        make: document.getElementById("make").value.trim(),
        model: document.getElementById("model").value.trim(),
        year: Number(document.getElementById("year").value),
        price: Number(document.getElementById("price").value),
        status: document.getElementById("status").value,
        color: document.getElementById("color").value.trim() || null,
        engineType: document.getElementById("engineType").value.trim() || null,
        fuelType: document.getElementById("fuelType").value || null,
        transmission: document.getElementById("transmission").value || null,
        mileage: Number(document.getElementById("mileage").value || 0),
        vin: document.getElementById("vin").value.trim() || null,
        plateNumber: document.getElementById("plateNumber").value.trim() || null,
        imageUrl: document.getElementById("imageUrl").value.trim() || null,
        description: document.getElementById("description").value.trim() || null
    };

    const saveButton = document.getElementById("saveVehicleBtn");
    saveButton.disabled = true;
    saveButton.textContent = "جاري الحفظ...";

    try {
        const url = editingId
            ? `${API_URL}/${editingId}`
            : API_URL;

        const response = await fetch(url, {
            method: editingId ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(vehicle)
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response));
        }

        closeModal();
        await loadVehicles();

        showMessage(
            editingId ? "تم تعديل بيانات السيارة بنجاح." : "تمت إضافة السيارة بنجاح."
        );

    } catch (error) {
        showMessage(error.message, "error");

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = editingId ? "حفظ التعديلات" : "حفظ السيارة";
    }
});

// التعامل مع أزرار التعديل والحذف
tableBody.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit") {
        openEditModal(id);
    }

    if (action === "delete") {
        const confirmed = confirm("هل أنت متأكدة من حذف هذه السيارة؟");

        if (!confirmed) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error(await getErrorMessage(response));
            }

            await loadVehicles();
            showMessage("تم حذف السيارة بنجاح.");

        } catch (error) {
            showMessage(error.message, "error");
        }
    }
});

// البحث والفلترة
document.getElementById("searchInput").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadVehicles, 350);
});

document.getElementById("statusFilter").addEventListener("change", loadVehicles);
document.getElementById("yearFilter").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadVehicles, 350);
});

document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("yearFilter").value = "";
    loadVehicles();
});

// أزرار النافذة
document.getElementById("addVehicleBtn").addEventListener("click", openAddModal);
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);

vehicleModal.addEventListener("click", event => {
    if (event.target === vehicleModal) {
        closeModal();
    }
});

// تحميل السيارات عند فتح الصفحة
loadVehicles();
