const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Database Connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cafe_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB Connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to database as ID ' + connection.threadId);
    connection.release();
});

// --- API ROUTES ---

// 1. Get Menu Items
app.get('/api/menu', (req, res) => {
    const sql = 'SELECT * FROM menu';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. Get Employees
app.get('/api/employees', (req, res) => {
    const sql = 'SELECT * FROM employee';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. Get Inventory
app.get('/api/inventory', (req, res) => {
    const sql = 'SELECT * FROM inventory';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 4. Place Order
app.post('/api/orders', (req, res) => {
    const { customer_id, employee_id, items, total_amount } = req.body; // items is array of {menu_item_id, quantity, price}
    
    // Start transaction
    db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ error: err.message });

        connection.beginTransaction(err => {
            if (err) { 
                connection.release(); 
                return res.status(500).json({ error: err.message }); 
            }

            const orderSql = 'INSERT INTO orders (customer_id, employee_id, total_amount, order_status) VALUES (?, ?, ?, ?)';
            connection.query(orderSql, [customer_id || null, employee_id || null, total_amount, 'Pending'], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ error: err.message });
                    });
                }

                const orderId = result.insertId;
                const orderDetailsSql = 'INSERT INTO order_details (order_id, menu_item_id, quantity, price_at_purchase) VALUES ?';
                const orderDetailsValues = items.map(item => [orderId, item.menu_item_id, item.quantity, item.price]);

                connection.query(orderDetailsSql, [orderDetailsValues], (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({ error: err.message });
                        });
                    }

                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({ error: err.message });
                            });
                        }
                        connection.release();
                        res.json({ message: 'Order placed successfully', orderId });
                    });
                });
            });
        });
    });
});

// 5. Get Active Orders (Kitchen View?)
app.get('/api/orders', (req, res) => {
    const sql = `
        SELECT o.order_id, o.order_time, o.total_amount, o.order_status, 
               GROUP_CONCAT(CONCAT(m.item_name, ' (x', od.quantity, ')') SEPARATOR ', ') as items
        FROM orders o
        JOIN order_details od ON o.order_id = od.order_id
        JOIN menu m ON od.menu_item_id = m.menu_item_id
        GROUP BY o.order_id
        ORDER BY o.order_time DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
