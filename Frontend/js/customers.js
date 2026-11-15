
const API_URL = "http://localhost:5080/api";

const customerRows = document.getElementById("customerRows");
const customerModal = document.getElementById("customerModal");
const customerForm = document.getElementById("customerForm");

let customers = [];

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}

function showMessage(message, type = "") {
    const element = document.getElementById("pageMessage");
    element.textContent = message;
    element.className = `page-message ${type}`;
}

function getStatusClass(status) {
    if (status === "جديد") return "new";
    if (status === "مهتم") return "interested";
    if (status === "تم البيع") return "sold";
    if (status === "غير مهتم") return "not-interested";
    return "";
}

function updateSummary() {
    document.getElementById("totalCustomers").textContent =
        customers.length;

    document.getElementById("newCustomers").textContent =
        customers.filter(c => c.status === "جديد").length;

    document.getElementById("tiktokCustomers").textContent =
        customers.filter(c => c.source === "TikTok").length;
}

async function loadCustomers() {
    customerRows.innerHTML =
        '<tr><td colspan="6" class="empty">جاري تحميل العملاء...</td></tr>';

    const search = document.getElementById("searchInput").value.trim();
    const source = document.getElementById("sourceFilter").value;
    const status = document.getElementById("statusFilter").value;

    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (source) params.append("source", source);
    if (status) params.append("status", status);

    try {
        const response = await fetch(
            `${API_URL}/Customers?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error("تعذر تحميل بيانات العملاء");
        }

        customers = await response.json();

        updateSummary();
        renderCustomers();

        showMessage(`تم تحميل ${customers.length} عميل`);

    } catch (error) {
        console.error("Customers Error:", error);

        customerRows.innerHTML =
            '<tr><td colspan="6" class="empty">تعذر الاتصال بالسيرفر. تأكدي أن الـ Backend يعمل.</td></tr>';

        showMessage(error.message, "error");
    }
}

function renderCustomers() {
    if (customers.length === 0) {
        customerRows.innerHTML =
            '<tr><td colspan="6" class="empty">لا توجد نتائج للعملاء</td></tr>';
        return;
    }

    customerRows.innerHTML = customers.map(customer => `
        <tr>
            <td>
                <span class="customer-name">
                    ${escapeHtml(customer.fullName)}
                </span>
                ${customer.email
                    ? `<span class="customer-email">${escapeHtml(customer.email)}</span>`
                    : ""}
            </td>

            <td dir="ltr">${escapeHtml(customer.phone)}</td>

            <td>${escapeHtml(customer.source || "غير محدد")}</td>

            <td>${escapeHtml(customer.campaignName || "—")}</td>

            <td>
                <span class="status-badge ${getStatusClass(customer.status)}">
                    ${escapeHtml(customer.status || "غير محدد")}
                </span>
            </td>

            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn"
                        data-action="edit"
                        data-id="${customer.id}">
                        تعديل
                    </button>

                    <button class="action-btn delete-btn"
                        data-action="delete"
                        data-id="${customer.id}">
                        حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openModal(customer = null) {
    customerForm.reset();

    document.getElementById("formMessage").textContent = "";
    document.getElementById("formMessage").className = "form-message";

    document.getElementById("customerId").value =
        customer?.id || "";

    document.getElementById("modalTitle").textContent =
        customer ? "تعديل بيانات العميل" : "إضافة عميل جديد";

    document.getElementById("saveCustomerBtn").textContent =
        customer ? "حفظ التعديلات" : "حفظ العميل";

    if (customer) {
        document.getElementById("fullName").value =
            customer.fullName || "";

        document.getElementById("phone").value =
            customer.phone || "";

        document.getElementById("email").value =
            customer.email || "";

        document.getElementById("source").value =
            customer.source || "غير محدد";

        document.getElementById("campaignName").value =
            customer.campaignName || "";

        document.getElementById("campaignId").value =
            customer.campaignId || "";

        document.getElementById("status").value =
            customer.status || "جديد";

        document.getElementById("notes").value =
            customer.notes || "";
    }

    customerModal.classList.add("show");
}

function closeModal() {
    customerModal.classList.remove("show");
}

document.getElementById("addCustomerBtn").addEventListener("click", () => {
    openModal();
});

document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);

customerModal.addEventListener("click", event => {
    if (event.target === customerModal) {
        closeModal();
    }
});

customerRows.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit") {
        const customer = customers.find(c => c.id === id);

        if (customer) {
            openModal(customer);
        }

        return;
    }

    if (action === "delete") {
        const confirmed = confirm(
            "هل أنت متأكدة من حذف هذا العميل؟"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`${API_URL}/Customers/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const message = await response.text();

                throw new Error(
                    message || "تعذر حذف العميل"
                );
            }

            await loadCustomers();
            showMessage("تم حذف العميل بنجاح");

        } catch (error) {
            alert(error.message);
        }
    }
});

customerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const id = document.getElementById("customerId").value;

    const customerData = {
        fullName: document.getElementById("fullName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim() || null,
        source: document.getElementById("source").value,
        campaignName: document.getElementById("campaignName").value.trim() || null,
        campaignId: document.getElementById("campaignId").value.trim() || null,
        status: document.getElementById("status").value,
        notes: document.getElementById("notes").value.trim() || null
    };

    const saveButton = document.getElementById("saveCustomerBtn");
    const formMessage = document.getElementById("formMessage");

    saveButton.disabled = true;
    saveButton.textContent = "جاري الحفظ...";

    try {
        const response = await fetch(
            id
                ? `${API_URL}/Customers/${id}`
                : `${API_URL}/Customers`,
            {
                method: id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(customerData)
            }
        );

        if (!response.ok) {
            const message = await response.text();

            throw new Error(message || "حدث خطأ أثناء حفظ العميل");
        }

        closeModal();
        await loadCustomers();

        showMessage(
            id
                ? "تم تعديل بيانات العميل بنجاح"
                : "تمت إضافة العميل بنجاح"
        );

    } catch (error) {
        console.error("Save Customer Error:", error);

        formMessage.textContent = error.message;
        formMessage.className = "form-message error";

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = id ? "حفظ التعديلات" : "حفظ العميل";
    }
});

// البحث والفلاتر

let searchTimer;

document.getElementById("searchInput").addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(loadCustomers, 350);
});

document.getElementById("sourceFilter").addEventListener("change", loadCustomers);
document.getElementById("statusFilter").addEventListener("change", loadCustomers);

// بدء تحميل الصفحة

loadCustomers();
