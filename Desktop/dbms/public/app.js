// --- State ---
const state = {
    cart: [],
    menu: [],
    inventory: []
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    loadDashboard();

    // Initial fetches
    fetchMenu();
    fetchInventory();
    fetchOrders();
});

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = now.toLocaleDateString(undefined, options);
}

// --- Navigation ---
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));

    // Show target section
    document.getElementById(`${sectionId}-section`).classList.add('active');

    // Update Sidebar Active State
    const navItems = document.querySelectorAll('.nav-links li');
    if (sectionId === 'dashboard') navItems[0].classList.add('active');
    if (sectionId === 'menu') navItems[1].classList.add('active');
    if (sectionId === 'orders') navItems[2].classList.add('active');
    if (sectionId === 'inventory') navItems[3].classList.add('active');
    if (sectionId === 'staff') navItems[4].classList.add('active');

    // Refresh Data
    if (sectionId === 'dashboard') loadDashboard();
    if (sectionId === 'menu') renderMenu();
    if (sectionId === 'orders') fetchOrders();
    if (sectionId === 'inventory') renderInventory();
}

// --- API Calls ---
async function fetchMenu() {
    try {
        const res = await fetch('http://localhost:3000/api/menu');
        if (!res.ok) throw new Error('Failed to fetch');
        state.menu = await res.json();
        renderMenu();
    } catch (err) {
        console.error(err);
    }
}

async function fetchInventory() {
    try {
        const res = await fetch('http://localhost:3000/api/inventory');
        state.inventory = await res.json();
        renderInventory();
    } catch (err) {
        console.error(err);
    }
}

async function fetchOrders() {
    try {
        const res = await fetch('http://localhost:3000/api/orders');
        const orders = await res.json();
        renderOrderTables(orders);
    } catch (err) {
        console.error(err);
    }
}

// --- Render Functions ---
function renderMenu() {
    const container = document.getElementById('menu-container');
    container.innerHTML = state.menu.map(item => `
        <div class="menu-card">
            <div class="menu-img-placeholder">
                <span class="material-icons-round">coffee</span>
            </div>
            <div class="menu-content">
                <h3>${item.item_name}</h3>
                <p>${item.description || 'Delicious cafe delight'}</p>
                <div class="menu-footer">
                    <span class="price">$${item.price}</span>
                    <button class="add-btn" onclick="addToCartModal(${item.menu_item_id})">
                        <span class="material-icons-round">add</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderInventory() {
    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML = state.inventory.map(item => {
        const isLow = item.current_stock <= item.reorder_level;
        return `
        <tr>
            <td>${item.item_name}</td>
            <td>${item.current_stock}</td>
            <td>${item.unit}</td>
            <td>${item.reorder_level}</td>
            <td>${item.supplier_name}</td>
            <td><span class="status-badge ${isLow ? 'status-low' : 'status-ok'}">${isLow ? 'Low Stock' : 'Good'}</span></td>
        </tr>
    `}).join('');
}

function renderOrderTables(orders) {
    const rows = orders.map(order => `
        <tr>
            <td>#${order.order_id}</td>
            <td>${new Date(order.order_time).toLocaleTimeString()}</td>
            <td>${order.items}</td>
            <td>$${order.total_amount}</td>
            <td><span class="status-badge status-pending">${order.order_status}</span></td>
        </tr>
    `).join('');

    // Update both tables
    const dashTable = document.querySelector('#dashboard-orders-table tbody');
    if (dashTable) dashTable.innerHTML = rows;

    const allTable = document.querySelector('#all-orders-table tbody');
    if (allTable) allTable.innerHTML = rows;
}

function loadDashboard() {
    fetchOrders();
}

// --- Modal & Cart Logic ---
function openNewOrderModal() {
    document.getElementById('order-modal').style.display = 'flex';
    state.cart = [];
    updateCartDisplay();
    renderModalMenu();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function renderModalMenu() {
    const container = document.getElementById('modal-menu-list');
    container.innerHTML = state.menu.map(item => `
        <div class="mini-menu-item" onclick="addToCart(${item.menu_item_id})">
            <div><strong>${item.item_name}</strong></div>
            <small>$${item.price}</small>
        </div>
    `).join('');
}

function addToCart(itemId) {
    const item = state.menu.find(i => i.menu_item_id === itemId);
    if (!item) return;

    const existing = state.cart.find(c => c.menu_item_id === itemId);
    if (existing) {
        existing.quantity++;
    } else {
        state.cart.push({ ...item, quantity: 1 });
    }
    updateCartDisplay();
}

function updateCartDisplay() {
    const list = document.getElementById('order-items-list');
    const totalEl = document.getElementById('order-total-price');

    let total = 0;
    list.innerHTML = state.cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <li class="order-item-row">
                <span>${item.item_name} x${item.quantity}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            </li>
        `;
    }).join('');

    totalEl.innerText = `$${total.toFixed(2)}`;
}

async function submitOrder() {
    if (state.cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderData = {
        customer_id: 1, // Dummy
        employee_id: 1, // Dummy
        total_amount: total,
        items: state.cart.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price: item.price
        }))
    };

    try {
        const res = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (res.ok) {
            alert('Order Placed Successfully!');
            closeModal('order-modal');
            fetchOrders();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (err) {
        alert('Network error');
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target == modals[i]) {
            modals[i].style.display = 'none';
        }
    }
}
