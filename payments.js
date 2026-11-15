
const API_URL = "http://localhost:5080/api";

let payments = [];
let sales = [];

const tableBody = document.getElementById("paymentsTableBody");

const money = value =>
    Number(value || 0).toLocaleString("en-US", {
        maximumFractionDigits: 2
    });

async function getData(endpoint) {
    const response = await fetch(`${API_URL}/${endpoint}`);

    if (!response.ok) {
        throw new Error("تعذر تحميل البيانات من السيرفر.");
    }

    return response.json();
}

function getSalePayments(saleId) {
    return payments
        .filter(payment => payment.saleId === saleId)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

function getSaleRemaining(sale) {
    const initialDeposit = Number(sale.depositAmount || 0);
    const extraPayments = getSalePayments(sale.id);

    return Math.max(
        0,
        Number(sale.salePrice || 0) - initialDeposit - extraPayments
    );
}

async function loadPaymentsPage() {
    try {
        const [paymentsData, salesData] = await Promise.all([
            getData("Payments"),
            getData("Sales")
        ]);

        payments = paymentsData;
        sales = salesData;

        renderPayments();
        renderStats();
        fillSalesOptions();

    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">
                    ${escapeHTML(error.message)} تأكدي أن الـ Backend يعمل.
                </td>
            </tr>
        `;
    }
}

function renderStats() {
    const activeSales = sales.filter(sale => sale.status !== "ملغاة");

    const totalPaid = payments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0), 0
    );

    const initialDeposits = activeSales.reduce(
        (sum, sale) => sum + Number(sale.depositAmount || 0), 0
    );

    const remaining = activeSales.reduce(
        (sum, sale) => sum + getSaleRemaining(sale), 0
    );

    document.getElementById("totalPayments").textContent = payments.length;
    document.getElementById("totalPaid").textContent = money(
        totalPaid + initialDeposits
    );
    document.getElementById("salesCount").textContent = activeSales.length;
    document.getElementById("totalRemaining").textContent = money(remaining);
}

function renderPayments() {
    const search = document.getElementById("searchPayments")
        .value.trim().toLowerCase();

    const method = document.getElementById("methodFilter").value;

    const filtered = payments.filter(payment => {
        const sale = sales.find(item => item.id === payment.saleId);

        const vehicleName = sale
            ? `${sale.vehicle?.make || ""} ${sale.vehicle?.model || ""}`.toLowerCase()
            : "";

        const customerName =
            (sale?.customer?.fullName || "").toLowerCase();

        const matchesSearch =
            vehicleName.includes(search) || customerName.includes(search);

        const matchesMethod =
            !method || payment.method === method;

        return matchesSearch && matchesMethod;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty">لا توجد دفعات مسجلة حتى الآن.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filtered.map(payment => {
        const sale = sales.find(item => item.id === payment.saleId);

        const vehicleName = sale
            ? `${sale.vehicle?.make || ""} ${sale.vehicle?.model || ""}`
            : "غير محدد";

        const customerName =
            sale?.customer?.fullName || "غير محدد";

        const date = payment.paidAtUtc
            ? new Date(payment.paidAtUtc).toLocaleDateString("ar-EG")
            : "-";

        return `
            <tr>
                <td>#${payment.id}</td>
                <td>#${payment.saleId}</td>
                <td>${escapeHTML(vehicleName)}</td>
                <td>${escapeHTML(customerName)}</td>
                <td>${money(payment.amount)} ريال</td>
                <td>${escapeHTML(payment.method)}</td>
                <td>${date}</td>
                <td>${escapeHTML(payment.notes || "-")}</td>
            </tr>
        `;
    }).join("");
}

function fillSalesOptions() {
    const select = document.getElementById("saleId");

    select.innerHTML = `<option value="">اختاري عملية البيع</option>`;

    sales
        .filter(sale =>
            sale.status !== "ملغاة" && getSaleRemaining(sale) > 0
        )
        .forEach(sale => {
            const option = document.createElement("option");
            option.value = sale.id;

            const customer = sale.customer?.fullName || "عميل";
            const vehicle =
                `${sale.vehicle?.make || ""} ${sale.vehicle?.model || ""}`;

            option.textContent =
                `#${sale.id} - ${customer} - ${vehicle}`;

            select.appendChild(option);
        });
}

function showSaleInfo() {
    const saleId = Number(document.getElementById("saleId").value);
    const info = document.getElementById("saleInfo");

    const sale = sales.find(item => item.id === saleId);

    if (!sale) {
        info.textContent = "اختاري عملية بيع لعرض تفاصيلها.";
        return;
    }

    const remaining = getSaleRemaining(sale);

    info.innerHTML = `
        العميل: <strong>${escapeHTML(sale.customer?.fullName || "غير محدد")}</strong><br>
        السيارة: <strong>${escapeHTML(
            `${sale.vehicle?.make || ""} ${sale.vehicle?.model || ""}`
        )}</strong><br>
        سعر البيع: <strong>${money(sale.salePrice)} ريال</strong><br>
        المقدم المسجل: <strong>${money(sale.depositAmount)} ريال</strong><br>
        الدفعات الإضافية: <strong>${money(getSalePayments(sale.id))} ريال</strong><br>
        المتبقي: <strong>${money(remaining)} ريال</strong>
    `;
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

function openModal() {
    document.getElementById("paymentForm").reset();
    document.getElementById("paymentMessage").textContent = "";
    document.getElementById("saleInfo").textContent =
        "اختاري عملية بيع لعرض تفاصيلها.";

    fillSalesOptions();

    document.getElementById("paymentModal").classList.add("show");
}

function closeModal() {
    document.getElementById("paymentModal").classList.remove("show");
}

document.getElementById("openPaymentModal")
    .addEventListener("click", openModal);

document.getElementById("closePaymentModal")
    .addEventListener("click", closeModal);

document.getElementById("cancelPayment")
    .addEventListener("click", closeModal);

document.getElementById("saleId")
    .addEventListener("change", showSaleInfo);

document.getElementById("searchPayments")
    .addEventListener("input", renderPayments);

document.getElementById("methodFilter")
    .addEventListener("change", renderPayments);

document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("searchPayments").value = "";
    document.getElementById("methodFilter").value = "";
    renderPayments();
});

document.getElementById("paymentForm")
    .addEventListener("submit", async event => {
        event.preventDefault();

        const saleId = Number(document.getElementById("saleId").value);
        const amount = Number(document.getElementById("paymentAmount").value);
        const method = document.getElementById("paymentMethod").value;
        const notes = document.getElementById("paymentNotes").value.trim();

        const message = document.getElementById("paymentMessage");
        const saveButton = document.getElementById("savePaymentBtn");

        const sale = sales.find(item => item.id === saleId);

        if (!sale) {
            message.textContent = "اختاري عملية بيع صحيحة.";
            return;
        }

        const remaining = getSaleRemaining(sale);

        if (amount <= 0 || amount > remaining) {
            message.textContent =
                `المبلغ يجب أن يكون أكبر من صفر ولا يتجاوز المتبقي (${money(remaining)} ريال).`;
            return;
        }

        const payment = {
            saleId,
            amount,
            method,
            notes: notes || null
        };

        try {
            saveButton.disabled = true;
            saveButton.textContent = "جاري الحفظ...";
            message.textContent = "";

            const response = await fetch(`${API_URL}/Payments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payment)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "تعذر حفظ الدفعة.");
            }

            closeModal();
            await loadPaymentsPage();

        } catch (error) {
            message.textContent = error.message;
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "حفظ الدفعة";
        }
    });

loadPaymentsPage();
