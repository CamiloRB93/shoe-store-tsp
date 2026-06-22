//CREACIÓN DE USUARIO POR DEFECTO EN FIREBASE (CON ROL ADMIN)

db.collection("usuarios").doc("admin@tienda.com").get().then((doc) => {
    if (!doc.exists) {
        db.collection("usuarios").doc("admin@tienda.com").set({
            name: "Administrador",
            email: "admin@tienda.com",
            password: "123",
            rol: "admin" // <-- AQUÍ ESTÁ EL ROL DE SEGURIDAD
        });
        console.log("Usuario Administrador creado en Firebase.");
    }
}).catch(error => console.error("Error verificando admin:", error));


// FUNCIONES DE LOGIN Y REGISTRO

function register() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!name || !email || !password) {
        alert("Por favor, llena todos los campos.");
        return;
    }

    // A los usuarios nuevos les asignamos automáticamente el rol de "cliente"
    db.collection("usuarios").doc(email).set({
        name: name,
        email: email,
        password: password,
        rol: "cliente" 
    })
    .then(() => {
        alert("Usuario registrado exitosamente en la base de datos");
        window.location.href = "login.html";
    })
    .catch((error) => {
        console.error("Error registrando usuario: ", error);
        alert("Hubo un error al registrar el usuario.");
    });
}

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Por favor, ingresa correo y contraseña.");
        return;
    }

    db.collection("usuarios").doc(email).get()
    .then((doc) => {
        if (doc.exists && doc.data().password === password) {
            localStorage.setItem("session", JSON.stringify(doc.data()));
            alert("Login exitoso");
            window.location.href = "index.html";
        } else {
            alert("Credenciales inválidas o el usuario no existe");
        }
    })
    .catch((error) => {
        console.error("Error en login: ", error);
        alert("Hubo un error de conexión con la base de datos.");
    });
}


// PANEL DINÁMICO (PROTEGIDO POR ROLES)

document.addEventListener("DOMContentLoaded", () => {
    const session = JSON.parse(localStorage.getItem("session"));
    
    // Cambiar dinámicamente los botones del menú de navegación
    const navLinks = document.querySelectorAll("nav a");
    navLinks.forEach(link => {
        // Usamos .includes() para que funcione sin importar si la ruta es ./login.html o /login.html
        if (link.href.includes("login.html") && session) {
            link.innerText = session.rol === "admin" ? "Gestión" : "Mi Cuenta";
        }
        if (link.href.includes("register.html") && session) {
            link.style.display = "none"; // Ocultamos el botón de registro
        }
    });

    // Si hay sesión iniciada y estamos en login.html
    if (window.location.pathname.includes("login.html") && session) {
        const authContainer = document.querySelector(".auth-container");
        
        // VALIDACIÓN DE SEGURIDAD: ¿Es Administrador?
        if (session.rol === "admin") {
            authContainer.style.width = "450px"; 
            
            db.collection("zapatos").get().then((querySnapshot) => {
                let opcionesZapatos = `<option value="">-- Selecciona un producto --</option>`;
                
                querySnapshot.forEach((doc) => {
                    const zapato = doc.data();
                    opcionesZapatos += `<option value="${zapato.id}">${zapato.name} (Talla: ${zapato.size})</option>`;
                });

                authContainer.innerHTML = `
                    <h2>Panel de Control de Inventario</h2>
                    <p style="margin-bottom: 20px; color: #555; font-size: 0.9rem;">Admin: ${session.name}</p>
                    
                    <h3 style="text-align: left; font-size: 1.1rem; margin-top: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;">1. Registrar Nuevo Zapato</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px; margin-bottom: 25px;">
                        <input type="text" id="newName" placeholder="Nombre (ej: Tenis Running)" style="padding: 8px;">
                        <input type="text" id="newBrand" placeholder="Marca" style="padding: 8px;">
                        <input type="number" id="newSize" placeholder="Talla" style="padding: 8px;">
                        <input type="number" id="newPrice" placeholder="Precio" style="padding: 8px;">
                        <input type="number" id="newStock" placeholder="Stock Inicial" style="padding: 8px;">
                        <input type="text" id="newImage" placeholder="Imagen (img/foto.jpg o https://...)" style="padding: 8px;">
                        <button onclick="guardarZapatoFirebase()" style="background: #10b981; width: 100%; padding: 10px; font-weight: bold; color: white; border: none; border-radius: 5px; cursor: pointer;">Guardar en Inventario</button>
                    </div>
                    
                    <h3 style="text-align: left; font-size: 1.1rem; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333;">2. Modificar Precio o Stock</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px; margin-bottom: 20px;">
                        <select id="selectZapato" onchange="cargarDatosActuales(this.value)" style="padding: 8px; font-size: 0.9rem;">
                            ${opcionesZapatos}
                        </select>
                        <input type="number" id="updatePrice" placeholder="Precio Actualizado" style="padding: 8px;">
                        <input type="number" id="updateStock" placeholder="Stock Disponible Actualizado" style="padding: 8px;">
                        <button onclick="actualizarZapatoFirebase()" style="background: #3b82f6; width: 100%; padding: 10px; font-weight: bold; color: white; border: none; border-radius: 5px; cursor: pointer;">Actualizar Producto</button>
                    </div>
                    
                    <button type="button" onclick="window.location.href='index.html'" style="background: #6b7280; width: 100%; margin-top: 15px; padding: 10px; font-weight: bold; color: white; border: none; border-radius: 5px; cursor: pointer;">Volver al Inicio</button>
                    <button onclick="logout()" style="background: #ef4444; width: 100%; margin-top: 10px; padding: 10px; font-weight: bold; color: white; border: none; border-radius: 5px; cursor: pointer;">Cerrar Sesión</button>
                `;
            }).catch((error) => console.error("Error cargando inventario: ", error));
        } 
        // Si NO es admin, es un cliente normal
        else {
            authContainer.innerHTML = `
                <h2>Mi Cuenta</h2>
                <p style="margin-bottom: 20px; color: #555; font-size: 1rem;">¡Hola, <strong>${session.name}</strong>! Bienvenido a tu perfil.</p>
                
                <button type="button" onclick="window.location.href='index.html'" style="background: #3b82f6; width: 100%; margin-top: 15px; padding: 10px; font-weight: bold; color: white; border: none; border-radius: 5px; cursor: pointer;">Ir de Compras</button>
                <button onclick="logout()" style="background: #ef4444; width: 100%; margin-top: 10px; padding: 10px; font-weight: bold; color: white; border: none; border-radius: 5px; cursor: pointer;">Cerrar Sesión</button>
            `;
        }
    }
});


// FUNCIONES DEL INVENTARIO (Solo las puede disparar el Admin)

function guardarZapatoFirebase() {
    const nombre = document.getElementById("newName").value;
    const marca = document.getElementById("newBrand").value;
    const talla = parseInt(document.getElementById("newSize").value);
    const precio = parseFloat(document.getElementById("newPrice").value);
    const stock = parseInt(document.getElementById("newStock").value);
    const imagen = document.getElementById("newImage").value;

    if (!nombre || !marca || !imagen || isNaN(talla) || isNaN(precio) || isNaN(stock)) {
        alert("Por favor, llena todos los campos correctamente.");
        return;
    }

    const nuevoId = Date.now(); 
    const nuevoZapato = { id: nuevoId, name: nombre, brand: marca, size: talla, price: precio, stock: stock, image: imagen };

    db.collection("zapatos").doc(nuevoId.toString()).set(nuevoZapato)
    .then(() => {
        alert("¡Zapato guardado exitosamente!");
        window.location.reload(); 
    })
    .catch(error => alert("Error al guardar: " + error));
}

function cargarDatosActuales(idZapato) {
    if (!idZapato) {
        document.getElementById("updatePrice").value = "";
        document.getElementById("updateStock").value = "";
        return;
    }
    db.collection("zapatos").doc(idZapato).get()
    .then((doc) => {
        if (doc.exists) {
            document.getElementById("updatePrice").value = doc.data().price;
            document.getElementById("updateStock").value = doc.data().stock;
        }
    }).catch(error => console.error("Error:", error));
}

function actualizarZapatoFirebase() {
    const idZapato = document.getElementById("selectZapato").value;
    const nuevoPrecio = parseFloat(document.getElementById("updatePrice").value);
    const nuevoStock = parseInt(document.getElementById("updateStock").value);

    if (!idZapato || isNaN(nuevoPrecio) || isNaN(nuevoStock) || nuevoPrecio < 0 || nuevoStock < 0) {
        alert("Datos inválidos.");
        return;
    }

    db.collection("zapatos").doc(idZapato).update({ price: nuevoPrecio, stock: nuevoStock })
    .then(() => {
        alert("¡Actualizado correctamente!");
        window.location.reload(); 
    }).catch(error => alert("No se pudo actualizar."));
}

function logout() {
    localStorage.removeItem("session");
    window.location.href = "index.html";
}
