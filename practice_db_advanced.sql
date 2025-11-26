-- =========================================================
-- practice_db: Advanced Query Practice Database (MySQL/MariaDB)
-- Full Real-Life Style Schema
-- =========================================================

DROP DATABASE IF EXISTS practice_db;
CREATE DATABASE practice_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE practice_db;

-- =========================================================
-- 1. Departments
-- =========================================================

DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

INSERT INTO departments (name, location) VALUES
('Engineering', 'Dhaka'),
('Sales', 'Chittagong'),
('HR', 'Dhaka'),
('Finance', 'Sylhet'),
('Support', 'Khulna'),
('Marketing', 'Rajshahi'),
('Operations', 'Dhaka'),
('R&D', 'Dhaka'),
('Logistics', 'Barisal'),
('IT', 'Dhaka');

-- =========================================================
-- 2. Employees
-- =========================================================

DROP TABLE IF EXISTS employees;
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_id INT NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    manager_id INT NULL,
    CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_emp_manager FOREIGN KEY (manager_id) REFERENCES employees(id)
) ENGINE=InnoDB;

INSERT INTO employees (first_name, last_name, department_id, salary, hire_date, manager_id) VALUES
('Rakib', 'Hasan', 1, 80000.00, '2020-01-15', NULL),   -- id = 1 (Manager Eng)
('Sumaiya', 'Akter', 1, 60000.00, '2021-03-10', 1),
('Nayeem', 'Islam', 1, 55000.00, '2022-07-01', 1),
('Mahmud', 'Hossain', 2, 70000.00, '2019-11-20', NULL), -- id = 4 (Manager Sales)
('Sara', 'Sultana', 2, 45000.00, '2021-09-05', 4),
('Imran', 'Khan', 3, 50000.00, '2018-04-12', NULL),      -- id = 6 (HR Head)
('Mitu', 'Chowdhury', 3, 38000.00, '2022-01-25', 6),
('Asif', 'Rahman', 4, 90000.00, '2017-06-30', NULL),     -- id = 8 (Finance Head)
('Tania', 'Akter', 4, 52000.00, '2020-10-18', 8),
('Jahid', 'Karim', 5, 40000.00, '2021-12-01', NULL),
('Rima', 'Akter', 5, 35000.00, '2022-06-14', 10),
('Fahim', 'Ahmed', 6, 65000.00, '2019-03-22', NULL),
('Nusrat', 'Jahan', 6, 48000.00, '2021-01-17', 12),
('Sajib', 'Hossain', 7, 50000.00, '2020-08-09', NULL),
('Lima', 'Begum', 7, 42000.00, '2022-02-13', 14),
('Kamrul', 'Hasan', 8, 95000.00, '2016-09-25', NULL),
('Nadia', 'Parvin', 9, 43000.00, '2021-05-29', NULL),
('Abir', 'Hossain', 9, 39000.00, '2022-03-11', 17),
('Shila', 'Sultana', 10, 78000.00, '2018-11-07', NULL),
('Rafi', 'Uddin', 10, 55000.00, '2020-04-03', 19);

-- =========================================================
-- 3. Customers
-- =========================================================

DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    membership_level ENUM('Bronze','Silver','Gold','Platinum') NOT NULL,
    created_at DATE NOT NULL
) ENGINE=InnoDB;

INSERT INTO customers (name, city, membership_level, created_at) VALUES
('Arif Chowdhury', 'Dhaka', 'Gold', '2021-01-10'),
('Meem Akter', 'Chittagong', 'Silver', '2021-03-15'),
('Sabbir Hossain', 'Dhaka', 'Bronze', '2021-06-20'),
('Rashed Khan', 'Sylhet', 'Gold', '2021-09-05'),
('Shorna Rahman', 'Rajshahi', 'Platinum', '2021-11-22'),
('Hasan Mahmud', 'Khulna', 'Silver', '2022-01-14'),
('Jannat Ara', 'Dhaka', 'Gold', '2022-04-30'),
('Tareq Aziz', 'Barisal', 'Bronze', '2022-07-19'),
('Sadia Islam', 'Dhaka', 'Platinum', '2022-10-01'),
('Mizanur Rahman', 'Chittagong', 'Silver', '2023-01-08'),
('Rubel Ahmed', 'Sylhet', 'Bronze', '2023-03-27'),
('Farhana Sultana', 'Dhaka', 'Gold', '2023-06-15');

-- =========================================================
-- 4. Products
-- =========================================================

DROP TABLE IF EXISTS products;
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    created_at DATE NOT NULL
) ENGINE=InnoDB;

INSERT INTO products (name, category, price, stock, created_at) VALUES
('Laptop Basic 14"', 'Electronics', 45000.00, 50, '2021-01-01'),
('Laptop Pro 15"', 'Electronics', 75000.00, 30, '2021-03-10'),
('Smartphone A1', 'Electronics', 22000.00, 80, '2021-05-12'),
('Smartphone X2', 'Electronics', 38000.00, 40, '2021-07-25'),
('Wireless Mouse', 'Accessories', 800.00, 200, '2021-02-15'),
('Mechanical Keyboard', 'Accessories', 3500.00, 100, '2021-04-20'),
('USB-C Cable', 'Accessories', 300.00, 300, '2021-06-01'),
('27" Monitor', 'Electronics', 18000.00, 25, '2021-08-11'),
('Office Chair', 'Furniture', 9000.00, 40, '2021-09-30'),
('Study Table', 'Furniture', 7000.00, 35, '2021-11-05'),
('Headphone Basic', 'Accessories', 1500.00, 150, '2022-01-18'),
('Headphone Pro', 'Accessories', 4500.00, 60, '2022-02-22'),
('Printer Basic', 'Electronics', 12000.00, 20, '2022-03-10'),
('Printer All-in-One', 'Electronics', 20000.00, 15, '2022-04-14'),
('Router Dual Band', 'Electronics', 3500.00, 90, '2022-05-01');

-- =========================================================
-- 5. Orders
-- =========================================================

DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    status ENUM('Pending','Processing','Shipped','Delivered','Cancelled') NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

INSERT INTO orders (customer_id, order_date, status, total_amount) VALUES
(1, '2021-01-15', 'Delivered', 53000.00),
(2, '2021-03-20', 'Delivered', 22800.00),
(3, '2021-06-25', 'Cancelled', 1500.00),
(4, '2021-09-10', 'Delivered', 83000.00),
(5, '2021-12-01', 'Shipped', 98000.00),
(6, '2022-01-20', 'Processing', 18000.00),
(7, '2022-05-05', 'Delivered', 76500.00),
(8, '2022-07-25', 'Delivered', 7800.00),
(9, '2022-10-10', 'Pending', 42000.00),
(10, '2023-01-15', 'Delivered', 39500.00),
(11, '2023-04-01', 'Delivered', 13500.00),
(12, '2023-06-20', 'Processing', 91000.00),
(1, '2023-07-15', 'Delivered', 25000.00),
(2, '2023-08-05', 'Delivered', 32000.00),
(3, '2023-09-10', 'Pending', 4500.00);

-- =========================================================
-- 6. Order Items
-- =========================================================

DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
-- Order 1
(1, 1, 1, 45000.00),
(1, 5, 2, 800.00),
(1, 7, 5, 300.00),

-- Order 2
(2, 3, 1, 22000.00),
(2, 7, 2, 300.00),

-- Order 3 (Cancelled)
(3, 11, 1, 1500.00),

-- Order 4
(4, 2, 1, 75000.00),
(4, 5, 2, 800.00),
(4, 11, 1, 1500.00),

-- Order 5
(5, 1, 1, 45000.00),
(5, 2, 1, 75000.00),

-- Order 6
(6, 8, 1, 18000.00),

-- Order 7
(7, 4, 1, 38000.00),
(7, 6, 1, 3500.00),
(7, 9, 1, 9000.00),
(7, 11, 2, 1500.00),

-- Order 8
(8, 10, 1, 7000.00),
(8, 5, 1, 800.00),

-- Order 9
(9, 13, 1, 12000.00),
(9, 15, 2, 3500.00),
(9, 5, 4, 800.00),

-- Order 10
(10, 3, 1, 22000.00),
(10, 11, 2, 1500.00),
(10, 5, 5, 800.00),

-- Order 11
(11, 5, 3, 800.00),
(11, 7, 5, 300.00),
(11, 11, 3, 1500.00),

-- Order 12
(12, 2, 1, 75000.00),
(12, 14, 1, 20000.00),
(12, 7, 2, 300.00),

-- Order 13
(13, 4, 1, 38000.00),
(13, 7, 2, 300.00),

-- Order 14
(14, 1, 1, 45000.00),
(14, 6, 1, 3500.00),

-- Order 15
(15, 11, 3, 1500.00);

-- =========================================================
-- 7. Payments
-- =========================================================

DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash','Card','Bkash','Nagad','BankTransfer') NOT NULL,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB;

INSERT INTO payments (order_id, payment_date, amount, payment_method) VALUES
(1, '2021-01-16', 53000.00, 'Cash'),
(2, '2021-03-21', 22800.00, 'Card'),
(3, '2021-06-26', 0.00, 'Cash'),   -- Cancelled
(4, '2021-09-12', 83000.00, 'Bkash'),
(5, '2021-12-03', 50000.00, 'Card'), -- partial (example)
(5, '2021-12-05', 48000.00, 'Card'),
(6, '2022-01-21', 18000.00, 'Nagad'),
(7, '2022-05-06', 76500.00, 'BankTransfer'),
(8, '2022-07-26', 7800.00, 'Cash'),
(9, '2022-10-11', 42000.00, 'Card'),
(10, '2023-01-16', 39500.00, 'Card'),
(11, '2023-04-02', 13500.00, 'Cash'),
(12, '2023-06-21', 50000.00, 'Bkash'),
(12, '2023-06-25', 41000.00, 'Bkash'),
(13, '2023-07-16', 25000.00, 'Nagad'),
(14, '2023-08-06', 32000.00, 'Card'),
(15, '2023-09-11', 4500.00, 'Cash');

-- =========================================================
-- 8. Branches (Company Locations)
-- =========================================================

DROP TABLE IF EXISTS branches;
CREATE TABLE branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    opened_at DATE NOT NULL
) ENGINE=InnoDB;

INSERT INTO branches (name, city, opened_at) VALUES
('Head Office', 'Dhaka', '2015-01-01'),
('Chittagong Branch', 'Chittagong', '2017-03-15'),
('Sylhet Branch', 'Sylhet', '2018-07-01'),
('Khulna Branch', 'Khulna', '2019-09-10');

-- Link employees to branches (HR-style)
ALTER TABLE employees
    ADD COLUMN branch_id INT NULL,
    ADD CONSTRAINT fk_emp_branch FOREIGN KEY (branch_id) REFERENCES branches(id);

UPDATE employees SET branch_id = 1 WHERE id IN (1,2,3,6,7,12,16,19,20);
UPDATE employees SET branch_id = 2 WHERE id IN (4,5,10,11);
UPDATE employees SET branch_id = 3 WHERE id IN (8,9,17,18);
UPDATE employees SET branch_id = 4 WHERE id IN (13,14,15);

-- =========================================================
-- 9. Suppliers (for purchase side)
-- =========================================================

DROP TABLE IF EXISTS suppliers;
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(30),
    city VARCHAR(100),
    created_at DATE NOT NULL
) ENGINE=InnoDB;

INSERT INTO suppliers (name, contact_person, phone, city, created_at) VALUES
('Tech Import BD', 'Jamal Uddin', '01711-000001', 'Dhaka', '2020-01-01'),
('Gadget World', 'Salma Khatun', '01711-000002', 'Chittagong', '2020-06-15'),
('Office Furnish BD', 'Rafsan Kabir', '01711-000003', 'Dhaka', '2021-02-10');

-- =========================================================
-- 10. Purchase Orders & Purchase Items
-- =========================================================

DROP TABLE IF EXISTS purchase_orders;
CREATE TABLE purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery DATE,
    status ENUM('Created','Ordered','Received','Cancelled') NOT NULL DEFAULT 'Created',
    created_by_employee_id INT NULL,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    CONSTRAINT fk_po_employee FOREIGN KEY (created_by_employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS purchase_order_items;
CREATE TABLE purchase_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_poi_po FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
    CONSTRAINT fk_poi_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

INSERT INTO purchase_orders (supplier_id, order_date, expected_delivery, status, created_by_employee_id) VALUES
(1, '2021-01-05', '2021-01-12', 'Received', 1),
(1, '2021-03-01', '2021-03-08', 'Received', 8),
(2, '2021-09-20', '2021-09-30', 'Received', 4),
(3, '2022-01-10', '2022-01-20', 'Cancelled', 6);

INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost) VALUES
(1, 1, 20, 40000.00),
(1, 5, 50, 600.00),
(1, 7, 100, 200.00),

(2, 2, 15, 67000.00),
(2, 11, 40, 1200.00),

(3, 9, 20, 7000.00),
(3, 10, 15, 5500.00),

(4, 4, 10, 30000.00);

-- =========================================================
-- 11. Inventory per Branch (Stock Management)
-- =========================================================

DROP TABLE IF EXISTS branch_inventory;
CREATE TABLE branch_inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bi_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT fk_bi_product FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY uq_branch_product (branch_id, product_id)
) ENGINE=InnoDB;

INSERT INTO branch_inventory (branch_id, product_id, quantity) VALUES
(1, 1, 15),
(1, 5, 80),
(1, 7, 120),
(1, 3, 25),
(2, 2, 10),
(2, 4, 12),
(2, 11, 30),
(3, 9, 10),
(3, 10, 8),
(4, 13, 5),
(4, 14, 5);

-- =========================================================
-- 12. Employee Attendance
-- =========================================================

DROP TABLE IF EXISTS employee_attendance;
CREATE TABLE employee_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('Present','Absent','Leave','WorkFromHome') NOT NULL,
    check_in_time TIME NULL,
    check_out_time TIME NULL,
    CONSTRAINT fk_att_emp FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE KEY uq_emp_date (employee_id, attendance_date)
) ENGINE=InnoDB;

INSERT INTO employee_attendance (employee_id, attendance_date, status, check_in_time, check_out_time) VALUES
(1, '2023-09-01', 'Present', '09:05:00', '18:10:00'),
(1, '2023-09-02', 'Present', '09:00:00', '18:00:00'),
(2, '2023-09-01', 'Present', '09:15:00', '17:55:00'),
(2, '2023-09-02', 'Absent', NULL, NULL),
(3, '2023-09-01', 'WorkFromHome', NULL, NULL),
(3, '2023-09-02', 'Present', '09:30:00', '18:20:00'),
(4, '2023-09-01', 'Leave', NULL, NULL);

-- =========================================================
-- 13. Employee Salaries & Payments
-- =========================================================

DROP TABLE IF EXISTS employee_salary_history;
CREATE TABLE employee_salary_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    base_salary DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_sal_hist_emp FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

INSERT INTO employee_salary_history (employee_id, effective_from, effective_to, base_salary) VALUES
(1, '2019-01-01', '2020-12-31', 70000.00),
(1, '2021-01-01', NULL, 80000.00),
(2, '2021-03-10', NULL, 60000.00),
(4, '2019-11-20', NULL, 70000.00),
(6, '2018-04-12', NULL, 50000.00);

DROP TABLE IF EXISTS employee_payments;
CREATE TABLE employee_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    pay_date DATE NOT NULL,
    gross_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash','BankTransfer','Bkash') NOT NULL,
    CONSTRAINT fk_emp_pay_emp FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

INSERT INTO employee_payments (employee_id, pay_date, gross_amount, tax_amount, net_amount, payment_method) VALUES
(1, '2023-08-25', 80000.00, 8000.00, 72000.00, 'BankTransfer'),
(1, '2023-09-25', 80000.00, 8000.00, 72000.00, 'BankTransfer'),
(2, '2023-09-25', 60000.00, 6000.00, 54000.00, 'BankTransfer'),
(4, '2023-09-25', 70000.00, 7000.00, 63000.00, 'BankTransfer'),
(6, '2023-09-25', 50000.00, 5000.00, 45000.00, 'BankTransfer');

-- =========================================================
-- 14. Support Tickets (Helpdesk)
-- =========================================================

DROP TABLE IF EXISTS support_tickets;
CREATE TABLE support_tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    created_by_employee_id INT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('Open','InProgress','Resolved','Closed') NOT NULL DEFAULT 'Open',
    priority ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    CONSTRAINT fk_ticket_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_ticket_employee FOREIGN KEY (created_by_employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS support_ticket_comments;
CREATE TABLE support_ticket_comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    commented_by_employee_id INT NULL,
    commented_by_customer_id INT NULL,
    comment_text TEXT NOT NULL,
    commented_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
    CONSTRAINT fk_comment_emp FOREIGN KEY (commented_by_employee_id) REFERENCES employees(id),
    CONSTRAINT fk_comment_cust FOREIGN KEY (commented_by_customer_id) REFERENCES customers(id)
) ENGINE=InnoDB;

INSERT INTO support_tickets (customer_id, created_by_employee_id, subject, description, status, priority, created_at, closed_at) VALUES
(1, 10, 'Laptop not starting', 'Customer reports laptop does not power on.', 'Resolved', 'High', '2023-07-01 10:00:00', '2023-07-02 15:30:00'),
(3, 11, 'Order delayed', 'Order 9 still not delivered.', 'InProgress', 'Medium', '2023-09-05 11:15:00', NULL),
(5, 12, 'Invoice copy needed', 'Customer wants duplicate invoice for order 4.', 'Closed', 'Low', '2023-08-10 09:45:00', '2023-08-11 14:00:00');

INSERT INTO support_ticket_comments (ticket_id, commented_by_employee_id, commented_by_customer_id, comment_text, commented_at) VALUES
(1, 10, NULL, 'We received your complaint and are checking.', '2023-07-01 10:30:00'),
(1, NULL, 1, 'Thank you, please do it fast.', '2023-07-01 11:00:00'),
(1, 10, NULL, 'Issue fixed by replacing adapter.', '2023-07-02 15:00:00'),
(2, 11, NULL, 'We have escalated to logistics.', '2023-09-05 12:00:00'),
(3, 12, NULL, 'Invoice sent to customer email.', '2023-08-11 13:30:00');

-- =========================================================
-- 15. Users, Roles, and User-Roles (Authentication / Authorization)
-- =========================================================

DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB;

INSERT INTO roles (name, description) VALUES
('Admin', 'Full system administrator'),
('Manager', 'Department or branch manager'),
('Staff', 'Regular staff with limited access'),
('Support', 'Customer support / helpdesk');

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    employee_id INT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_emp FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB;

INSERT INTO users (username, password_hash, employee_id, is_active) VALUES
('admin', 'dummy_hash_admin', 1, 1),
('sales_mgr', 'dummy_hash_sales', 4, 1),
('support_1', 'dummy_hash_support', 10, 1),
('hr_1', 'dummy_hash_hr', 6, 1);

DROP TABLE IF EXISTS user_roles;
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

INSERT INTO user_roles (user_id, role_id) VALUES
(1, 1), -- admin -> Admin
(2, 2), -- sales_mgr -> Manager
(3, 4), -- support_1 -> Support
(4, 3); -- hr_1 -> Staff

-- =========================================================
-- 16. Example View (Advanced Read Practice)
-- =========================================================

DROP VIEW IF EXISTS vw_customer_order_summary;
CREATE VIEW vw_customer_order_summary AS
SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    c.city,
    c.membership_level,
    COUNT(o.id) AS total_orders,
    SUM(CASE WHEN o.status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_orders,
    SUM(o.total_amount) AS total_order_amount
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.city, c.membership_level;

-- =========================================================
-- 17. Example Trigger (Recalculate order total from items)
-- =========================================================

DROP TRIGGER IF EXISTS tr_order_items_after_ins;
DELIMITER $$
CREATE TRIGGER tr_order_items_after_ins
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders o
    SET o.total_amount = (
        SELECT SUM(oi.quantity * oi.unit_price)
        FROM order_items oi
        WHERE oi.order_id = NEW.order_id
    )
    WHERE o.id = NEW.order_id;
END$$
DELIMITER ;

-- =========================================================
-- DONE ✅
-- =========================================================
-- এখন এই ডাটাবেস দিয়ে তুমি JOIN, সাবকুয়েরি, aggregation, window-style query (MariaDB 10.2+),
-- trigger, view, HR, sales, inventory, support system সবই প্র্যাক্টিস করতে পারবে।
