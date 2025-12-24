CREATE DATABASE IF NOT EXISTS cafe_db;
USE cafe_db;

-- 1. Customer Table
CREATE TABLE IF NOT EXISTS customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(100),
    join_date DATE,
    loyalty_points INT DEFAULT 0
);

-- 2. Employee Table
CREATE TABLE IF NOT EXISTS employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    position VARCHAR(50),
    hourly_wage DECIMAL(10, 2),
    hire_date DATE,
    phone_number VARCHAR(20),
    is_active TINYINT(1) DEFAULT 1
);

-- 3. Menu Table
CREATE TABLE IF NOT EXISTS menu (
    menu_item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    is_available TINYINT(1) DEFAULT 1
);

-- 4. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    current_stock DECIMAL(10, 2) DEFAULT 0,
    unit VARCHAR(20),
    reorder_level DECIMAL(10, 2),
    supplier_name VARCHAR(100)
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    employee_id INT,
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2),
    order_status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id) ON DELETE SET NULL
);

-- 6. Order Details Table
CREATE TABLE IF NOT EXISTS order_details (
    order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    menu_item_id INT,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu(menu_item_id) ON DELETE SET NULL
);

-- Insert some dummy data for testing
INSERT INTO menu (item_name, description, price, category, is_available) VALUES 
('Espresso', 'Strong concentrated coffee', 3.50, 'Coffee', 1),
('Cappuccino', 'Steamed milk with espresso', 4.50, 'Coffee', 1),
('Croissant', 'Buttery flaky pastry', 3.00, 'Bakery', 1),
('Blueberry Muffin', 'Freshly baked muffin', 2.50, 'Bakery', 1);

INSERT INTO employee (first_name, last_name, position, hourly_wage, hire_date, is_active) VALUES
('John', 'Doe', 'Barista', 15.00, CURDATE(), 1),
('Jane', 'Smith', 'Manager', 20.00, CURDATE(), 1);

INSERT INTO inventory (item_name, current_stock, unit, reorder_level, supplier_name) VALUES
('Coffee Beans', 50.00, 'kg', 10.00, 'BeanThere Inc.'),
('Milk', 20.00, 'liters', 5.00, 'Local Dairy');
