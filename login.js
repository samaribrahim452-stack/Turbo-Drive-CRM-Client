
const API_URL = "http://localhost:5080/api";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const loginButton = document.getElementById("loginButton");
const buttonText = document.getElementById("buttonText");
const loginMessage = document.getElementById("loginMessage");

// إظهار وإخفاء كلمة المرور
document.getElementById("togglePassword").addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";

    passwordInput.type = isPassword ? "text" : "password";

    document.getElementById("togglePassword").textContent =
        isPassword ? "◎" : "◉";
});

// تسجيل الدخول
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginMessage.textContent = "";
    loginMessage.className = "login-message";

    loginButton.disabled = true;
    buttonText.textContent = "جاري تسجيل الدخول...";

    try {
        const response = await fetch(`${API_URL}/Auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                userNameOrEmail: usernameInput.value.trim(),
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || data.title || "اسم المستخدم أو كلمة المرور غير صحيحة"
            );
        }

        const token = data.token || data.Token;

        if (!token) {
            throw new Error("لم يستلم الموقع رمز تسجيل الدخول من السيرفر");
        }

        // إزالة أي جلسة قديمة
        localStorage.removeItem("turboDriveToken");
        sessionStorage.removeItem("turboDriveToken");

        // حفظ الجلسة حسب اختيار تذكرني
        if (rememberMe.checked) {
            localStorage.setItem("turboDriveToken", token);
        } else {
            sessionStorage.setItem("turboDriveToken", token);
        }

        loginMessage.textContent = "تم تسجيل الدخول بنجاح";
        loginMessage.classList.add("success");

        buttonText.textContent = "تم الدخول بنجاح";

        // الانتقال إلى لوحة التحكم
        setTimeout(() => {
            window.location.href = "index.html";
        }, 700);

    } catch (error) {
        console.error("Login Error:", error);

        loginMessage.textContent =
            error.message || "حدث خطأ أثناء الاتصال بالسيرفر";

        loginButton.disabled = false;
        buttonText.textContent = "دخول";
    }
});

// نسيت كلمة المرور
document.getElementById("forgotPassword").addEventListener("click", (event) => {
    event.preventDefault();

    loginMessage.textContent =
        "يرجى التواصل مع مدير النظام لإعادة تعيين كلمة المرور.";

    loginMessage.className = "login-message";
});
