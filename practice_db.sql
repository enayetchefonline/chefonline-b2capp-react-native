-- =========================================================
-- practice_db: Advanced Query Practice Database (MySQL)
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
-- DONE
-- =========================================================
-- এখন আপনি এই ডাটাবেস দিয়ে JOIN, সাবকুয়েরি, aggregate, trigger প্র্যাক্টিস করতে পারবেন।
