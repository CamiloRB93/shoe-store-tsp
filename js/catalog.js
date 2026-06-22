const productsContainer = document.getElementById("products");

let products = []; 

function cargarCatalogoDesdeFirebase() {
    db.collection("zapatos").get()
    .then((querySnapshot) => {
        products = []; 
        
        querySnapshot.forEach((doc) => {
            products.push(doc.data());
        });

        // ¡AQUÍ ESTÁ LA MAGIA! Llamamos a tu función original para que pinte los datos que llegaron de internet
        showProducts(products); 
    })
    .catch((error) => {
        console.error("Error al descargar los productos de Firebase: ", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cargarCatalogoDesdeFirebase();
});

function showProducts(list) {
    productsContainer.innerHTML = "";

    list.forEach(product => {
        productsContainer.innerHTML += `
            <div class="product-card">
                <img src="${product.image}" onclick="showDescription('${product.description}')">

                <h3>${product.name}</h3>

                <p>Brand: ${product.brand}</p>
                <p>Size: ${product.size}</p>
                <p>Price: $${product.price}</p>
                <p>Stock: ${product.stock}</p>

                <input type="number" id="qty-${product.id}" min="1" value="1">

                <button onclick="addToCart(${product.id})">
                    Add to cart
                </button>
            </div>
        `;
    });
}

function showDescription(description) {
    alert(description);
}

function filterProducts() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const brand = document.getElementById("brandFilter").value;
    const size = document.getElementById("sizeFilter").value;

    let filtered = products.filter(product => {
        return product.name.toLowerCase().includes(search)
            && (brand === "" || product.brand === brand)
            && (size === "" || product.size == size);
    });

    showProducts(filtered);
}

function addToCart(id) {
    const quantity = parseInt(document.getElementById(`qty-${id}`).value);

    const product = products.find(p => p.id === id);

    const cart = getCart();

    cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity
    });

    saveCart(cart);

    alert("Product added");
}

showProducts(products);
