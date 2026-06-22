const cartItems = document.getElementById("cartItems");
const totalElement = document.getElementById("total");

// Cargamos el carrito desde la memoria local. Si está vacío, iniciamos un arreglo limpio.
let cart = JSON.parse(localStorage.getItem("cart")) || []; 

// RENDERIZADO DEL CARRITO (Con botón Eliminar)

function renderCart() {
    cartItems.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = "<p style='text-align:center; color:#666;'>Tu carrito está vacío.</p>";
        totalElement.innerText = "Total: $0";
        return;
    }

    // Dibujamos cada zapato con su botón de eliminar individual
    cart.forEach((item, index) => {
        total += item.price * item.quantity;

        cartItems.innerHTML += `
            <div class="cart-item" style="border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px;">
                <div>
                    <h3 style="margin: 0; color: #333;">${item.name}</h3>
                    <p style="margin: 5px 0; color: #666; font-size: 0.9rem;">Precio: $${item.price} | Cantidad: ${item.quantity}</p>
                    <p style="margin: 0; font-weight: bold; color: #222;">Subtotal: $${item.price * item.quantity}</p>
                </div>
                <button onclick="removeFromCart(${index})" style="background: #ef4444; color: white; padding: 8px 12px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    Eliminar
                </button>
            </div>
        `;
    });

    totalElement.innerText = `Total: $${total}`;
}


// FUNCIÓN PARA ELIMINAR UN PRODUCTO

function removeFromCart(index) {
    cart.splice(index, 1); // Quita el elemento de la lista según su posición
    localStorage.setItem("cart", JSON.stringify(cart)); // Actualiza la memoria local
    renderCart(); // Vuelve a dibujar el carrito sin el elemento borrado
}


// LÓGICA TRANSACCIONAL: PAGAR, STOCK E HISTORIAL

// Usamos 'async' porque el código debe "esperar" a que la base de datos de Google responda
async function procesarPago() {
    const session = JSON.parse(localStorage.getItem("session"));

    // Bloqueo 1: ¿Hay un usuario logueado?
    if (!session) {
        alert("¡Atención! Para finalizar tu compra debes iniciar sesión o registrarte.");
        window.location.href = "login.html"; // Redirigimos al Login
        return;
    }

    // Bloqueo 2: ¿El carrito está vacío?
    if (cart.length === 0) {
        alert("Tu carrito está vacío, no hay nada que pagar.");
        return;
    }

    try {
        let costoTotal = 0;

        // Validamos el stock y lo descontamos producto por producto en la base de datos
        for (const item of cart) {
            costoTotal += item.price * item.quantity;
            
            const zapatoRef = db.collection("zapatos").doc(item.id.toString());
            const zapatoDoc = await zapatoRef.get();

            if (zapatoDoc.exists) {
                const stockActual = zapatoDoc.data().stock;
                
                // Si el cliente pide más de lo que hay, bloqueamos la compra
                if (stockActual < item.quantity) {
                    alert(`Lo sentimos, no hay suficiente stock para: ${item.name}. Stock disponible: ${stockActual}`);
                    return; 
                }

                // Descontamos el stock oficial en la nube
                await zapatoRef.update({
                    stock: stockActual - item.quantity
                });
            }
        }

        // Si llegamos hasta aquí, es porque había stock de todo. Guardamos el historial.
        const nuevaCompra = {
            correoUsuario: session.email,
            fecha: new Date().toISOString(), // Guarda la fecha y hora exacta
            productos: cart,
            total: costoTotal
        };

        // Creamos la colección 'historial_compras' automáticamente en Firebase
        await db.collection("historial_compras").add(nuevaCompra);

        // Limpieza de memoria local (vaciamos el carrito)
        cart = []; 
        localStorage.setItem("cart", JSON.stringify(cart)); 
        renderCart(); 
        
        // Abrimos modal personalizado en lugar de usar un alert
        document.getElementById('modalPago').style.display = 'flex';

        // Configuramos botón del modal para que regrese al catálogo
        document.getElementById('volverCatalogoBtn').onclick = function() {
            window.location.href = 'index.html';
        };

    } catch (error) {
        console.error("Error crítico procesando la transacción: ", error);
        alert("Hubo un error de conexión con la base de datos. Intenta nuevamente.");
    }
}

// Ejecutamos la función de renderizado apenas cargue la página
document.addEventListener("DOMContentLoaded", () => {
    renderCart();
});
