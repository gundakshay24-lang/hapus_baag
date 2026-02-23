const API_BASE = "http://localhost:5000";


// ================= CART SYSTEM =================

function addToCart() {

    let mango = document.getElementById("mangoType")?.value || "Premium Alphonso";
    let weight = document.getElementById("weight")?.selectedOptions[0].text || "1 kg";
    let price = parseInt(document.getElementById("weight")?.value || 120);
    let qty = parseInt(document.getElementById("quantity")?.value || 1);

    let total = price * qty;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push({
        mango: mango,
        weight: weight,
        qty: qty,
        total: total
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    alert("Added to Cart Successfully 🛒");
}


// ================= DISPLAY CART =================

function displayCart() {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let container = document.getElementById("cartItems");
    let totalAmount = 0;

    if (!container) return;

    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty 🛒</p>";
        return;
    }

    cart.forEach((item, index) => {

        totalAmount += item.total;

        container.innerHTML += `
            <div class="card mb-3 p-3">
                <h5>${item.mango}</h5>
                <p>Weight: ${item.weight}</p>
                <p>Quantity: ${item.qty}</p>
                <p>Total: ₹${item.total}</p>
                <button class="btn btn-danger btn-sm" onclick="removeItem(${index})">
                    Remove
                </button>
            </div>
        `;
    });

    let totalElement = document.getElementById("cartTotal");
    if (totalElement) totalElement.innerText = totalAmount;
}


// ================= SEND WHATSAPP ORDER =================

function sendWhatsAppOrder() {

    let mangoType = document.getElementById("mangoType").value;
    let weight = document.getElementById("weight").value + " kg";
    let quantity = document.getElementById("quantity").value;
    let name = document.getElementById("customerName").value;
    let phone = document.getElementById("phone").value;
    let address = document.getElementById("address").value;
    let distance = document.getElementById("distance").value;

    let productTotal = parseInt(document.getElementById("productTotal").innerText);
    let deliveryCharge = parseInt(document.getElementById("deliveryCharge").innerText);
    let grandTotal = parseInt(document.getElementById("totalPrice").innerText);

    if (!name || !phone || !address) {
        alert("Please fill all required details!");
        return;
    }

    let orders = JSON.parse(localStorage.getItem("orders")) || [];

    orders.push({
        name: name,
        phone: phone,
        mangoType: mangoType,
        weight: weight,
        quantity: quantity,
        address: address,
        distance: distance,
        productTotal: productTotal,
        deliveryCharge: deliveryCharge,
        grandTotal: grandTotal,
        date: new Date().toLocaleString()
    });

    localStorage.setItem("orders", JSON.stringify(orders));

    let message = `🥭 *New Mango Order* %0A
Name: ${name} %0A
Phone: ${phone} %0A
Mango: ${mangoType} %0A
Weight: ${weight} %0A
Quantity: ${quantity} %0A
Distance: ${distance} km %0A
Product Total: ₹${productTotal} %0A
Delivery Charge: ₹${deliveryCharge} %0A
Grand Total: ₹${grandTotal} %0A
Address: ${address}`;

    document.getElementById("orderForm").reset();
    calculateTotal();

    window.open(`https://wa.me/919689376295?text=${message}`, "_blank");

    alert("Order Sent Successfully 🥭");
}


// ================= ADMIN PANEL =================

async function loadAdminData() {
    try {

        const table = document.getElementById("orderTableBody");
        if (!table) return;

        table.innerHTML = `
            <tr>
                <td colspan="12" class="text-center">
                    Loading orders...
                </td>
            </tr>
        `;

        const response = await fetch("http://localhost:5000/orders");

        if (!response.ok) {
            throw new Error("Server response failed");
        }

        const orders = await response.json();

        table.innerHTML = "";

        let totalRevenue = 0;

        if (!orders.length) {
            table.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center text-muted">
                        No Orders Found
                    </td>
                </tr>
            `;
            return;
        }

        orders.forEach(order => {

            const grandTotal = parseFloat(order.grandTotal) || 0;
            const productTotal = parseFloat(order.productTotal) || 0;
            const deliveryCharge = parseFloat(order.deliveryCharge) || 0;
            const distance = parseFloat(order.distance) || 0;

            totalRevenue += grandTotal;

            const locationButton =
                order.latitude && order.longitude
                    ? `
                    <a href="https://www.google.com/maps?q=${order.latitude},${order.longitude}" 
                       target="_blank" 
                       class="btn btn-sm btn-success">
                       📍 View
                    </a>`
                    : `<span class="text-muted">N/A</span>`;

            const invoiceButton =
                order.id
                    ? `
                    <a href="http://localhost:5000/invoice/${order.id}" 
                       target="_blank"
                       class="btn btn-sm btn-primary">
                       📄 Download
                    </a>`
                    : `<span class="text-muted">N/A</span>`;

            table.innerHTML += `
                <tr>
                    <td>${order.date || "-"}</td>
                    <td>${order.name || "-"}</td>
                    <td>${order.phone || "-"}</td>
                    <td>${order.mangoType || "-"}</td>
                    <td>${order.weight || "-"}</td>
                    <td>${order.quantity || 0}</td>
                    <td>${distance.toFixed(2)} km</td>
                    <td>₹${deliveryCharge.toFixed(2)}</td>
                    <td>₹${productTotal.toFixed(2)}</td>
                    <td><strong>₹${grandTotal.toFixed(2)}</strong></td>
                    <td>${locationButton}</td>
                    <td>${invoiceButton}</td>
                </tr>
            `;
        });

        document.getElementById("totalOrders").innerText = orders.length;
        document.getElementById("totalRevenue").innerText = "₹" + totalRevenue.toFixed(2);

    } catch (error) {
        console.error("Admin Load Error:", error);

        const table = document.getElementById("orderTableBody");
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center text-danger">
                        Failed to load orders from server!
                    </td>
                </tr>
            `;
        }

        alert("Failed to load orders from server!");
    }
}


// ================= CLEAR ORDERS =================
function clearOrders() {
    if (confirm("Are you sure you want to clear all orders?")) {
        alert("Backend delete API not implemented yet!");
        loadAdminData();
    }
}


// ================= ADMIN LOGIN SYSTEM =================

const ADMIN_USERNAME = "Akshay";
const ADMIN_PASSWORD = "30112001";

function adminLogin() {

    let user = document.getElementById("adminUser").value;
    let pass = document.getElementById("adminPass").value;

    if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
        sessionStorage.setItem("adminLoggedIn", "true");
        window.location.href = "Admin.html";  // ✅ Correct file name
    } else {
        document.getElementById("loginError").innerText = "Invalid Username or Password!";
    }
}

function checkAdminLogin() {
    if (sessionStorage.getItem("adminLoggedIn") !== "true") {
        window.location.href = "admin_login.html";  // ✅ Correct file name
    }
}

function logoutAdmin() {
    sessionStorage.removeItem("adminLoggedIn");
    window.location.href = "admin_login.html";
}


// ================= SECRET ADMIN ACCESS =================

function openAdminLogin() {
    window.location.href = "admin_login.html";
}


// ================= ADD TO CART FROM VARIETIES =================

function addToCartWithData(name, price) {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.push({
        mango: name,
        weight: "1 Box",
        qty: 1,
        total: price
    });

    localStorage.setItem("cart", JSON.stringify(cart));

    alert(name + " added to cart 🛒");
}


// ================= DYNAMIC PRICE + DELIVERY =================

function calculateTotal() {

    let mangoType = document.getElementById("mangoType")?.value;
    let weight = parseInt(document.getElementById("weight")?.value);
    let quantity = parseInt(document.getElementById("quantity")?.value);
    let distance = parseFloat(document.getElementById("distance")?.value);

    if (!mangoType) return;

    if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
        document.getElementById("quantity").value = 1;
    }

    if (isNaN(distance) || distance < 0) {
        distance = 0;
    }

    let pricePerKg = 0;

    switch (mangoType) {
        case "Premium Alphonso":
            pricePerKg = 150;
            break;
        case "Ratnagiri Hapus":
            pricePerKg = 140;
            break;
        case "Devgad Special":
            pricePerKg = 160;
            break;
        case "Organic Farm Mango":
            pricePerKg = 180;
            break;
    }

    let productTotal = pricePerKg * weight * quantity;

    // ✅ Correct delivery rule
    let deliveryCharge = 0;
    if (distance > 10) {
        deliveryCharge = (distance - 10) * 10; // ₹10 per km
    }

    let grandTotal = productTotal + deliveryCharge;

    document.getElementById("productTotal").innerText = productTotal.toFixed(0);
    document.getElementById("deliveryCharge").innerText = deliveryCharge.toFixed(0);
    document.getElementById("totalPrice").innerText = grandTotal.toFixed(0);
}

//////////........place order function.......//////

async function placeOrder() {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    // Ask for delivery distance
    let distance = parseFloat(prompt("Enter delivery distance (km):") || 0);

    // Ask for customer details
    let customerName = prompt("Enter your Name:");
    let customerPhone = prompt("Enter your Phone Number:");

    if (!customerName || !customerPhone) {
        alert("Name and Phone are required!");
        return;
    }

    // Calculate delivery charge and total
    let total = parseInt(document.getElementById("cartTotal")?.innerText || 0);
    let deliveryCharge = distance > 10 ? (distance - 10) * 10 : 0;
    let grandTotal = total + deliveryCharge;

    // Combine cart details
    let combinedMango = cart.map(item => item.mango).join(", ");
    let combinedWeight = cart.map(item => item.weight).join(", ");
    let combinedQty = cart.reduce((sum, item) => sum + parseInt(item.qty), 0);

    // Check if geolocation is available
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser. Order cannot capture location.");
        return;
    }

    // Capture customer GPS location
    navigator.geolocation.getCurrentPosition(async function(position) {

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const orderData = {
            name: customerName,
            phone: customerPhone,
            mangoType: combinedMango,
            weight: combinedWeight,
            quantity: combinedQty,
            distance: distance,
            deliveryCharge: deliveryCharge,
            productTotal: total,
            grandTotal: grandTotal,
            date: new Date().toLocaleString(),
            latitude: latitude,
            longitude: longitude
        };

        try {
            // Send order to backend
            const response = await fetch(`${API_BASE}/place-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            alert("Order Placed Successfully 🥭");

            // Clear cart and reload page
            localStorage.removeItem("cart");
            window.location.reload();

        } catch (error) {
            console.error(error);
            alert("Server error. Make sure backend is running.");
        }

    }, function(error) {
        alert("Please allow location access to place the order!");
        console.error(error);
    });
}

// ================= NEW ADMIN ITEM MANAGEMENT =================

// Add new mango item to backend
async function addItem() {
    const name = document.getElementById("itemName").value;
    const price = parseInt(document.getElementById("itemPrice").value);
    const stock = parseInt(document.getElementById("itemStock").value);
    const offer = document.getElementById("itemOffer").value;
    const date_added = new Date().toLocaleString();

    // ✅ Get image file and convert to Base64
    const imageInput = document.getElementById("itemImage");
    let imageBase64 = "";
    if (imageInput && imageInput.files.length > 0) {
        const file = imageInput.files[0];
        imageBase64 = await toBase64(file);
    }

    if (!name || isNaN(price) || isNaN(stock)) {
        alert("Please fill all required fields!");
        return;
    }

    const itemData = { name, price, stock, offer, date_added, image: imageBase64 };

    try {
        const response = await fetch("http://localhost:5000/add-item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemData)
        });
        const result = await response.json();
        alert(result.message || "Item Added Successfully!");
        document.getElementById("addItemForm").reset();
        loadItems();
    } catch (error) {
        console.error(error);
        alert("Server error. Make sure backend is running.");
    }
}

// Load all items from backend and show in admin table with thumbnails
async function loadItems() {
    try {
        const response = await fetch("http://localhost:5000/items");
        const items = await response.json();
        const tableBody = document.getElementById("itemsTableBody");
        if (!tableBody) return;
        tableBody.innerHTML = "";

        items.forEach(item => {
            tableBody.innerHTML += `
                <tr>
                    <td>${item.id}</td>
                    <td>
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="height:50px;width:50px;border-radius:5px;">` : "No Image"}
                    </td>
                    <td>${item.name}</td>
                    <td>₹${item.price}</td>
                    <td>${item.stock}</td>
                    <td>${item.offer}</td>
                    <td>${item.date_added}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error(error);
        alert("Failed to load items from server!");
    }
}

// Helper function to convert file to Base64
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}


// ================= FALLBACK LOCAL ITEMS =================
function loadItemsFallback() {
    const fallbackItems = [
        { id: 1, name: "Premium Alphonso", price: 150, stock: 10, offer: "None", date_added: new Date().toLocaleString() },
        { id: 2, name: "Ratnagiri Hapus", price: 140, stock: 15, offer: "None", date_added: new Date().toLocaleString() },
        { id: 3, name: "Devgad Special", price: 160, stock: 8, offer: "None", date_added: new Date().toLocaleString() },
        { id: 4, name: "Organic Farm Mango", price: 180, stock: 5, offer: "None", date_added: new Date().toLocaleString() }
    ];

    const tableBody = document.getElementById("itemsTableBody");
    const mangoSelect = document.getElementById("mangoType");

    if (tableBody) tableBody.innerHTML = "";
    if (mangoSelect) mangoSelect.innerHTML = '<option value="">Select Mango Type</option>';

    fallbackItems.forEach(item => {
        if (tableBody) {
            tableBody.innerHTML += `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>₹${item.price}</td>
                    <td>${item.stock}</td>
                    <td>${item.offer}</td>
                    <td>${item.date_added}</td>
                </tr>
            `;
        }
        if (mangoSelect) {
            mangoSelect.innerHTML += `<option value="${item.name}">${item.name}</option>`;
        }
    });
}

// ================= BUSINESS LOCATION =================
const kharadi = { lat: 18.5515, lng: 73.9420 };


// ================= UPDATE LOCATION =================
function updateLocation(lat, lng) {

    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lng;

    const distance = calculateDistance(
        kharadi.lat,
        kharadi.lng,
        lat,
        lng
    );

    document.getElementById("distance").value =
            distance.toFixed(2);

    let deliveryCharge = 0;

    if (distance > 10) {
        deliveryCharge = (distance - 10) * 10; // ₹10 per km after 10 km
    }

    document.getElementById("deliveryCharge").innerText =
        deliveryCharge.toFixed(0);

    calculateTotal();
}

window.addEventListener("DOMContentLoaded", function () {
    calculateTotal();
    displayCart();
    loadItems();
    loadAdminData();
});

// ================= MAP + DROPDOWN DELIVERY SYSTEM (ADDED WITHOUT REMOVING ANYTHING) =================

// Leaflet Map Variables
let map;
let marker;

// Initialize Map
function initMap() {

    if (!document.getElementById("map")) return;

    map = L.map('map').setView([kharadi.lat, kharadi.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([kharadi.lat, kharadi.lng], {
        draggable: true
    }).addTo(map);

    updateLocation(kharadi.lat, kharadi.lng);

    // When marker dragged
    marker.on('dragend', function () {
        const position = marker.getLatLng();
        updateLocation(position.lat, position.lng);
    });
}


// ================= DROPDOWN AREA SELECT =================
function selectPuneArea() {

    if (!map) return;

    const selected = document.getElementById("puneArea")?.value;
    if (!selected) return;

    const [lat, lng] = selected.split(",").map(Number);

    map.setView([lat, lng], 15);
    marker.setLatLng([lat, lng]);

    updateLocation(lat, lng);
}


// ================= AUTO DETECT LOCATION =================
function detectLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(function(position) {

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (map) {
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
        }

        updateLocation(lat, lng);

    }, function(error) {
        alert("Please allow location access!");
        console.error(error);
    });
}


// ================= DISTANCE CALCULATION FUNCTION =================
function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371; // Radius of earth in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


// ================= LOAD MAP AFTER PAGE LOAD =================
window.addEventListener("load", function () {
    initMap();
});