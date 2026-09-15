# Travel Luggage Web App

เว็บแอปขายกระเป๋าเดินทาง พัฒนาจาก Expo Router + React Native Web + Express + MySQL

## Database
สินค้าใช้ตาราง `New_products` ตาม SQL ที่ให้มาโดยตรง ไม่ใช้ `Inventory` อีกต่อไป

ฟิลด์สินค้าที่ระบบใช้:
`product_name`, `brand`, `sku`, `size_inch`, `wheel_count`, `wheel_type`, `material`,
`hard_or_soft`, `weight_kg`, `capacity_liters`, `lock_type`, `handle_type`, `expandable`,
`color`, `stock_quantity`, `price`, `discount_price`, `status`, `image_url`, `description`,
`created_at`, `updated_at`

## หน้าเว็บ
- `/` หน้าร้านสินค้าและค้นหา/กรอง
- `/detail` รายละเอียดกระเป๋า
- `/categories` หมวดหมู่ตามขนาด
- `/login` เข้าสู่ระบบ
- `/register` สมัครสมาชิก
- `/dashboard` จัดการสินค้าเฉพาะ Admin
- `/add` เพิ่ม/แก้ไขสินค้าเฉพาะ Admin

## Backend
แก้ API ให้ใช้ `New_products` โดยตรง:
- GET `/api/products`
- GET `/api/products/:id`
- POST `/api/products` (Admin)
- PUT `/api/products/:id` (Admin)
- DELETE `/api/products/:id` (Admin)

## ติดตั้ง
1. Import `backend/New_products.sql` เข้า MySQL
2. ตรวจสอบ `backend/.env` ให้ตรงกับ MySQL ของเครื่อง
3. เข้า `backend` แล้วรัน `npm install`
4. รัน `node server.js`
5. กลับโฟลเดอร์หลัก รัน `npm install`
6. รัน `npm run web`

หมายเหตุ: SQL ที่ให้มามีเฉพาะตารางสินค้า ระบบจะสร้างตาราง `users` ให้อัตโนมัติเมื่อ backend เริ่มทำงาน เพื่อรองรับ Login/Register/Admin
