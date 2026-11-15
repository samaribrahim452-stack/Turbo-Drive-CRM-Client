 
const EMPLOYEES_API = "http://localhost:5080/api/Employees";

let employees = [];
let editingEmployeeId = null;

const employeeForm = document.getElementById("employeeForm");
const employeeModal = document.getElementById("employeeModal");
const employeesTableBody = document.getElementById("employeesTableBody");
const employeeSearch = document.getElementById("employeeSearch");
const employeeStatusFilter = document.getElementById("employeeStatusFilter");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// تحميل الموظفين
async function loadEmployees() {
    try {
        const response = await fetch(EMPLOYEES_API);

        if (!response.ok) {
            throw new Error("تعذر تحميل الموظفين.");
        }

        employees = await response.json();

        renderEmployees();
        updateEmployeeStats();

    } catch (error) {
        console.error(error);

        employeesTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    تعذر تحميل الموظفين. تأكدي أن الـ Backend يعمل.
                </td>
            </tr>
        `;
    }
}

// عرض الموظفين
function renderEmployees() {
    const search = employeeSearch.value.trim().toLowerCase();
    const status = employeeStatusFilter.value;

    const filtered = employees.filter(employee => {
        const matchesSearch =
            (employee.fullName || "").toLowerCase().includes(search) ||
            (employee.phone || "").toLowerCase().includes(search) ||
            (employee.jobTitle || "").toLowerCase().includes(search);

        const matchesStatus =
            status === "" || String(employee.isActive) === status;

        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        employeesTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    لا توجد موظفين مطابقين للبحث.
                </td>
            </tr>
        `;
        return;
    }

    employeesTableBody.innerHTML = filtered.map(employee => `
        <tr>
            <td>
                <span class="employee-name">
                    ${escapeHTML(employee.fullName)}
                </span>
            </td>

            <td>${escapeHTML(employee.phone)}</td>

            <td>${escapeHTML(employee.jobTitle)}</td>

            <td>
                <span class="employee-status ${
                    employee.isActive ? "active" : "inactive"
                }">
                    ${employee.isActive ? "نشط" : "غير نشط"}
                </span>
            </td>

            <td>
                <div class="employee-actions">
                    <button class="employee-edit-btn"
                        onclick="editEmployee(${employee.id})">
                        تعديل
                    </button>

                    <button class="employee-delete-btn"
                        onclick="deleteEmployee(${employee.id})">
                        حذف
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

// تحديث الإحصائيات
function updateEmployeeStats() {
    const total = employees.length;
    const active = employees.filter(employee => employee.isActive).length;

    document.getElementById("totalEmployees").textContent = total;
    document.getElementById("activeEmployees").textContent = active;
    document.getElementById("inactiveEmployees").textContent = total - active;
}

// فتح نافذة الإضافة
function openEmployeeModal() {
    editingEmployeeId = null;
    employeeForm.reset();

    document.getElementById("modalTitle").textContent = "إضافة موظف جديد";
    document.getElementById("saveEmployeeBtn").textContent = "حفظ الموظف";
    document.getElementById("isActive").value = "true";

    employeeModal.classList.add("show");
}

// إغلاق النافذة
function closeEmployeeModal() {
    employeeModal.classList.remove("show");
    employeeForm.reset();
    editingEmployeeId = null;
}

// زر إضافة موظف
document.getElementById("addEmployeeBtn").addEventListener("click", openEmployeeModal);

// تعديل موظف
function editEmployee(id) {
    const employee = employees.find(item => item.id === id);

    if (!employee) return;

    editingEmployeeId = id;

    document.getElementById("fullName").value = employee.fullName;
    document.getElementById("phone").value = employee.phone;
    document.getElementById("jobTitle").value = employee.jobTitle;
    document.getElementById("isActive").value = String(employee.isActive);

    document.getElementById("modalTitle").textContent = "تعديل بيانات الموظف";
    document.getElementById("saveEmployeeBtn").textContent = "حفظ التعديلات";

    employeeModal.classList.add("show");
}

// حفظ موظف جديد أو تعديل موظف
employeeForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const isEditing = editingEmployeeId !== null;

    const employeeData = {
        fullName: document.getElementById("fullName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        jobTitle: document.getElementById("jobTitle").value,
        isActive: document.getElementById("isActive").value === "true"
    };

    if (!employeeData.fullName || !employeeData.phone) {
        alert("من فضلك أدخلي الاسم ورقم الهاتف.");
        return;
    }

    const button = document.getElementById("saveEmployeeBtn");
    button.disabled = true;
    button.textContent = "جاري الحفظ...";

    try {
        const url = isEditing
            ? `${EMPLOYEES_API}/${editingEmployeeId}`
            : EMPLOYEES_API;

        const response = await fetch(url, {
            method: isEditing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(employeeData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || "حدث خطأ أثناء الحفظ.");
        }

        closeEmployeeModal();
        await loadEmployees();

        alert(isEditing
            ? "تم تعديل بيانات الموظف بنجاح."
            : "تمت إضافة الموظف بنجاح.");

    } catch (error) {
        console.error(error);
        alert("لم يتم الحفظ: " + error.message);

    } finally {
        button.disabled = false;
        button.textContent = "حفظ الموظف";
    }
});

// حذف موظف
async function deleteEmployee(id) {
    const employee = employees.find(item => item.id === id);

    if (!employee) return;

    const confirmed = confirm(
        `هل أنتِ متأكدة من حذف الموظف ${employee.fullName}؟`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${EMPLOYEES_API}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("تعذر حذف الموظف.");
        }

        await loadEmployees();
        alert("تم حذف الموظف بنجاح.");

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// البحث والفلترة
employeeSearch.addEventListener("input", renderEmployees);
employeeStatusFilter.addEventListener("change", renderEmployees);

// إغلاق النافذة عند الضغط خارجها
employeeModal.addEventListener("click", function (event) {
    if (event.target === employeeModal) {
        closeEmployeeModal();
    }
});

// تشغيل الصفحة
loadEmployees();
