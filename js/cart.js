const cartItems = document.getElementById("cartItems");
const totalElement = document.getElementById("total");

const cart = getCart();

let total = 0;

cart.forEach(item => {
    total += item.price * item.quantity;

    cartItems.innerHTML += `
        <div class="cart-item">
            <h3>${item.name}</h3>

            <p>Price: $${item.price}</p>

            <p>Quantity: ${item.quantity}</p>

            <p>Subtotal: $${item.price * item.quantity}</p>
        </div>
    `;
});

totalElement.innerText = `Total: $${total}`;