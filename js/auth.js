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
            // 1. Pintamos primero la estructura básica de "Mi Cuenta" con un contenedor vacío para el historial
            authContainer.innerHTML = `
                <h2>Mi Cuenta</h2>
                <p style="margin-bottom: 15px; color: #555; font-size: 1rem;">
                ¡Hola, <strong>${session.name}</strong>! Bienvenido a tu perfil.</p>
                
                <h3 style="text-align: left; font-size: 1.1rem; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #333; margin-top: 20px;">
                Mis Compras Recientes</h3>
                
                <div id="historialComprasContainer" style="margin-top: 10px; max-height: 200px; overflow-y: auto; text-align: left; font-size: 0.9rem; display: flex; flex-direction: column; gap: 10px; padding-right: 5px;">
                    <p style="color: #666; text-align: center; font-style: italic;">
                    Cargando tu historial de compras...</p>
                </div>
                
                <button type="button" onclick="window.location.href='index.html'" 
                style="background: #3b82f6; width: 100%; margin-top: 25px; padding: 10px; font-weight: bold; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Ir de Compras</button>

                <button onclick="logout()" 
                style="background: #ef4444; width: 100%; margin-top: 10px; padding: 10px; font-weight: bold; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Cerrar Sesión</button>
            `;

            const historialContainer = document.getElementById("historialComprasContainer");

            // 2. Consulta a Firebase el historial filtrando EXCLUSIVAMENTE por el correo del usuario activo
            db.collection("historial_compras")
                .where("correoUsuario", "==", session.email)
                .get()
                .then((querySnapshot) => {
                    // Si el usuario no ha comprado nada todavía
                    if (querySnapshot.empty) {
                        historialContainer.innerHTML = "<p style='color: #888; text-align: center; margin-top: 10px;'>Aún no has realizado ninguna compra.</p>";
                        return;
                    }

                    historialContainer.innerHTML = ""; // Limpiamos el mensaje de "Cargando..."

                    // Recorremos cada recibo encontrado en la nube
                    querySnapshot.forEach((doc) => {
                        const compra = doc.data();
                        
                        // Formateamos la fecha para que se vea amigable en español
                        const fechaFormateada = new Date(compra.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        // Construimos la lista interna de los zapatos comprados en esta orden
                        let listaProductos = "";
                        compra.productos.forEach(prod => {
                            listaProductos += `<li style="margin-bottom: 2px;">${prod.name} (Cant: ${prod.quantity})</li>`;
                        });

                        // Inyectamos una tarjetita limpia por cada compra
                        historialContainer.innerHTML += `
                            <div style="border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; background: #f8fafc; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                                <p style="margin: 0 0 5px 0; color: #64748b; font-size: 0.75rem; font-weight: bold;">Fecha: ${fechaFormateada}</p>
                                <ul style="margin: 0; padding-left: 20px; color: #334155;">
                                    ${listaProductos}
                                </ul>
                                <p style="margin: 5px 0 0 0; text-align: right; font-weight: bold; color: #10b981;">Total: $${compra.total}</p>
                            </div>
                        `;
                    });
                })
                .catch((error) => {
                    console.error("Error recuperando el historial de compras: ", error);
                    historialContainer.innerHTML = "<p style='color: #ef4444; text-align: center;'>No se pudo cargar el historial.</p>";
                });
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
