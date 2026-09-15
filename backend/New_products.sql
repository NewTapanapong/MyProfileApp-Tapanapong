-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 14, 2026 at 04:26 PM
-- Server version: 8.0.46-0ubuntu0.24.04.4
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ip_std6730251093`
--

-- --------------------------------------------------------

--
-- Table structure for table `New_products`
--

CREATE TABLE `New_products` (
  `id` int NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size_inch` int DEFAULT NULL,
  `wheel_count` int DEFAULT NULL,
  `wheel_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `material` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hard_or_soft` enum('hard','soft') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `capacity_liters` decimal(6,2) DEFAULT NULL,
  `lock_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `handle_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expandable` tinyint(1) DEFAULT '0',
  `color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock_quantity` int DEFAULT '0',
  `price` decimal(10,2) NOT NULL,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `status` enum('available','out_of_stock','discontinued') COLLATE utf8mb4_unicode_ci DEFAULT 'available',
  `image_url` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `New_products`
--

INSERT INTO `New_products` (`id`, `product_name`, `brand`, `sku`, `size_inch`, `wheel_count`, `wheel_type`, `material`, `hard_or_soft`, `weight_kg`, `capacity_liters`, `lock_type`, `handle_type`, `expandable`, `color`, `stock_quantity`, `price`, `discount_price`, `status`, `image_url`, `description`, `created_at`, `updated_at`) VALUES
(1, 'กระเป๋าเดินทาง 20 นิ้ว', 'Samsonite', 'BAG001', 20, 4, 'Spinner', 'ABS', 'hard', 2.50, 40.00, 'TSA Lock', 'Telescopic', 1, 'Black', 10, 1990.00, 1790.00, 'available', 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=500', 'กระเป๋าเดินทางขนาด 20 นิ้ว', '2026-08-29 04:31:24', '2026-08-29 04:41:39'),
(2, 'กระเป๋าเดินทาง 24 นิ้ว', 'American Tourister', 'BAG002', 24, 4, 'Spinner', 'Polycarbonate', 'hard', 3.20, 65.00, 'TSA Lock', 'Telescopic', 1, 'Navy', 8, 2590.00, 2290.00, 'available', 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=500', 'กระเป๋าเดินทางขนาด 24 นิ้ว', '2026-08-29 04:31:24', '2026-08-29 04:41:39'),
(3, 'กระเป๋าเดินทาง 28 นิ้ว', 'Caggioni', 'BAG003', 28, 4, 'Spinner', 'ABS', 'hard', 4.10, 95.00, 'TSA Lock', 'Telescopic', 1, 'Silver', 5, 3290.00, 2990.00, 'available', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fae?w=500', 'กระเป๋าเดินทางขนาดใหญ่ 28 นิ้ว', '2026-08-29 04:31:24', '2026-08-29 04:41:39'),
(4, 'กระเป๋าผ้าเดินทาง', 'TravelPro', 'BAG004', 22, 2, 'Inline', 'Nylon', 'soft', 2.10, 50.00, 'Combination', 'Telescopic', 0, 'Gray', 12, 1890.00, 1690.00, 'available', 'https://images.unsplash.com/photo-1581553680321-8c0e95b0c2a9?w=500', 'กระเป๋าเดินทางแบบผ้า', '2026-08-29 04:31:24', '2026-08-29 04:41:39'),
(5, 'กระเป๋าเดินทาง Premium', 'Delsey', 'BAG005', 26, 4, 'Spinner', 'Polycarbonate', 'hard', 3.80, 80.00, 'TSA Lock', 'Telescopic', 1, 'Red', 6, 4590.00, 4190.00, 'available', 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=500', 'กระเป๋าเดินทาง Premium', '2026-08-29 04:31:24', '2026-08-29 04:41:39');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `New_products`
--
ALTER TABLE `New_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `New_products`
--
ALTER TABLE `New_products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
