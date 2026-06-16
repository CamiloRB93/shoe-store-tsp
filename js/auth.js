function register() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const users = JSON.parse(localStorage.getItem("users")) || [];

    users.push({
        name,
        email,
        password
    });

    localStorage.setItem("users", JSON.stringify(users));

    alert("User registered");

    window.location.href = "login.html";
}

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(user =>
        user.email === email &&
        user.password === password
    );

    if (user) {
        localStorage.setItem("session", JSON.stringify(user));

        alert("Login successful");

        window.location.href = "index.html";
    } else {
        alert("Invalid credentials");
    }
}