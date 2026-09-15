const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ==========================================
// JWT
// ==========================================

const JWT_SECRET =
  process.env.JWT_SECRET || "MY_SECRET_KEY_123456";

// ==========================================
// MYSQL CONNECTION
// ==========================================

const pool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "std6730251093",
  password: process.env.DB_PASSWORD || "",
  database: "ip_std6730251093",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00",
});

// ==========================================
// ADMIN AUTH MIDDLEWARE
// ==========================================

const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "กรุณาเข้าสู่ระบบ",
      });
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "เฉพาะผู้ดูแลร้านเท่านั้น",
      });
    }

    req.user = decoded;

    next();
  } catch (e) {
    return res.status(401).json({
      success: false,
      message: "Token ไม่ถูกต้องหรือหมดอายุ",
    });
  }
};

// ==========================================
// ROOT
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Travel Luggage API is running",
  });
});

// ==========================================
// 1. AUTH
// ==========================================

async function login(req, res) {
  try {
    const {
      username,
      password,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอก Username และ Password",
      });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (
      !rows.length ||
      rows[0].password !== password
    ) {
      return res.status(401).json({
        success: false,
        message: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    const user = rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);

    res.status(500).json({
      success: false,
      message: "Database Error",
      error: e.message,
    });
  }
}

app.post("/api/login", login);
app.post("/api/auth/login", login);

// ==========================================
// REGISTER
// ==========================================

app.post("/api/register", async (req, res) => {
  try {
    const username = String(
      req.body.username || ""
    ).trim();

    const email = String(
      req.body.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body.password || ""
    );

    if (
      username.length < 3 ||
      !email ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "กรุณากรอกข้อมูลให้ครบ และ Password อย่างน้อย 6 ตัวอักษร",
      });
    }

    const [
      [userCheck],
      [emailCheck],
    ] = await Promise.all([
      pool.query(
        "SELECT id FROM users WHERE username = ?",
        [username]
      ),

      pool.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      ),
    ]);

    if (userCheck.length) {
      return res.status(409).json({
        success: false,
        message: "Username นี้ถูกใช้งานแล้ว",
      });
    }

    if (emailCheck.length) {
      return res.status(409).json({
        success: false,
        message: "Email นี้ถูกใช้งานแล้ว",
      });
    }

    await pool.query(
      `INSERT INTO users
      (
        username,
        email,
        passwordHash,
        password,
        role
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        username,
        email,
        password,
        password,
        "user",
      ]
    );

    res.status(201).json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
    });
  } catch (e) {
    console.error("REGISTER ERROR:", e);

    res.status(500).json({
      success: false,
      message: "Database Error",
      error: e.message,
    });
  }
});

// ==========================================
// 2. PRODUCTS
// ==========================================

const searchCols = [
  "product_name",
  "brand",
  "sku",
  "material",
  "color",
];

// GET PRODUCTS

app.get("/api/products", async (req, res) => {
  try {
    let sql = "SELECT * FROM New_products";

    let vals = [];

    const q = String(
      req.query.q || ""
    ).trim();

    if (q) {
      sql +=
        " WHERE " +
        searchCols
          .map(
            (c) => `${c} LIKE ?`
          )
          .join(" OR ");

      vals = searchCols.map(
        () => `%${q}%`
      );
    }

    sql += " ORDER BY id ASC";

    const [rows] =
      await pool.query(
        sql,
        vals
      );

    res.json(rows);
  } catch (e) {
    console.error(
      "GET PRODUCTS ERROR:",
      e
    );

    res.status(500).json({
      success: false,
      message: "Database Error",
      error: e.message,
    });
  }
});

// GET PRODUCT BY ID

app.get(
  "/api/products/:id",
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      const [[row]] =
        await pool.query(
          "SELECT * FROM New_products WHERE id = ?",
          [id]
        );

      if (!row) {
        return res.status(404).json({
          success: false,
          message: "ไม่พบสินค้า",
        });
      }

      res.json(row);
    } catch (e) {
      console.error(
        "GET PRODUCT ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message: "Database Error",
        error: e.message,
      });
    }
  }
);

// ==========================================
// PRODUCT FIELDS
// ==========================================

const fields = [
  "product_name",
  "brand",
  "sku",
  "size_inch",
  "wheel_count",
  "wheel_type",
  "material",
  "hard_or_soft",
  "weight_kg",
  "capacity_liters",
  "lock_type",
  "handle_type",
  "expandable",
  "color",
  "stock_quantity",
  "price",
  "discount_price",
  "status",
  "image_url",
  "description",
];

function extractValues(body) {
  return fields.map(
    (key) =>
      body[key] === undefined ||
      body[key] === ""
        ? null
        : body[key]
  );
}

// ==========================================
// ADD PRODUCT
// ==========================================

app.post(
  "/api/products",
  requireAdmin,
  async (req, res) => {
    try {
      if (
        !String(
          req.body.product_name || ""
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "กรุณากรอกชื่อสินค้า",
        });
      }

      if (
        req.body.price === undefined ||
        Number(req.body.price) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "กรุณาระบุราคา",
        });
      }

      const v =
        extractValues({
          ...req.body,

          product_name:
            String(
              req.body.product_name
            ).trim(),

          expandable:
            req.body.expandable
              ? 1
              : 0,

          status:
            req.body.status ||
            "available",

          stock_quantity:
            Number(
              req.body.stock_quantity
            ) || 0,
        });

      const [result] =
        await pool.query(
          `INSERT INTO New_products
          (${fields.join(",")})
          VALUES
          (${fields
            .map(() => "?")
            .join(",")})`,
          v
        );

      res.status(201).json({
        success: true,
        message: "เพิ่มสินค้าแล้ว",
        productId:
          result.insertId,
      });
    } catch (e) {
      console.error(
        "ADD PRODUCT ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message:
          e.code ===
          "ER_DUP_ENTRY"
            ? "SKU นี้มีอยู่แล้ว"
            : "Database Error",
        error: e.message,
      });
    }
  }
);

// ==========================================
// EDIT PRODUCT
// ==========================================

app.put(
  "/api/products/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product id",
        });
      }

      if (
        !String(
          req.body.product_name || ""
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "กรุณากรอกชื่อสินค้า",
        });
      }

      const sets = fields
        .map(
          (key) => `${key}=?`
        )
        .join(",");

      const v =
        extractValues({
          ...req.body,

          product_name:
            String(
              req.body.product_name
            ).trim(),

          expandable:
            req.body.expandable
              ? 1
              : 0,

          status:
            req.body.status ||
            "available",

          stock_quantity:
            Number(
              req.body.stock_quantity
            ) || 0,
        });

      v.push(id);

      const [result] =
        await pool.query(
          `UPDATE New_products
           SET ${sets}
           WHERE id=?`,
          v
        );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message:
            "ไม่พบสินค้า",
        });
      }

      res.json({
        success: true,
        message:
          "แก้ไขสินค้าแล้ว",
        productId: id,
      });
    } catch (e) {
      console.error(
        "EDIT PRODUCT ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message:
          e.code ===
          "ER_DUP_ENTRY"
            ? "SKU นี้มีอยู่แล้ว"
            : "Database Error",
        error: e.message,
      });
    }
  }
);

// ==========================================
// DELETE PRODUCT
// ==========================================

app.delete(
  "/api/products/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(
        req.params.id
      );

      const [result] =
        await pool.query(
          "DELETE FROM New_products WHERE id = ?",
          [id]
        );

      if (!result.affectedRows) {
        return res.status(404).json({
          success: false,
          message:
            "ไม่พบสินค้า",
        });
      }

      res.json({
        success: true,
        message:
          "ลบสินค้าแล้ว",
        productId: id,
      });
    } catch (e) {
      console.error(
        "DELETE PRODUCT ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message:
          "Database Error",
        error: e.message,
      });
    }
  }
);

// ==========================================
// 3. CART
// ==========================================

// GET CART

const getCartHandler =
  async (req, res) => {
    try {
      const userId =
        Number(
          req.query.user_id
        );

      if (!userId) {
        return res.json({
          status: "success",
          data: [],
        });
      }

      const [rows] =
        await pool.query(
          `SELECT
            c.id,
            c.product_id,
            c.quantity,
            c.size_inch,
            c.color,
            p.product_name,
            p.brand,
            p.price,
            p.discount_price,
            p.image_url
          FROM cart c
          LEFT JOIN New_products p
            ON c.product_id = p.id
          WHERE c.user_id = ?`,
          [userId]
        );

      res.json({
        status: "success",
        data: rows,
      });
    } catch (e) {
      console.error(
        "GET CART ERROR:",
        e
      );

      res.status(500).json({
        status: "error",
        message:
          "Database Error",
        error: e.message,
      });
    }
  };

app.get(
  "/api/cart",
  getCartHandler
);

app.get(
  "/api/cart.php",
  getCartHandler
);

// ==========================================
// ADD CART
// ==========================================

const addToCartHandler =
  async (req, res) => {
    try {
      const {
        user_id,
        product_id,
        quantity = 1,
        size_inch,
        color,
      } = req.body;

      if (
        !user_id ||
        !product_id
      ) {
        return res.status(400).json({
          status: "error",
          message:
            "กรุณาระบุ user_id และ product_id",
        });
      }

      const [
        [existingItem],
      ] = await pool.query(
        `SELECT id, quantity
         FROM cart
         WHERE user_id = ?
         AND product_id = ?`,
        [
          user_id,
          product_id,
        ]
      );

      if (existingItem) {
        const newQty =
          existingItem.quantity +
          Number(quantity);

        await pool.query(
          "UPDATE cart SET quantity = ? WHERE id = ?",
          [
            newQty,
            existingItem.id,
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO cart
          (
            user_id,
            product_id,
            quantity,
            size_inch,
            color
          )
          VALUES (?, ?, ?, ?, ?)`,
          [
            user_id,
            product_id,
            Number(quantity),
            size_inch || null,
            color || null,
          ]
        );
      }

      res.json({
        status: "success",
        message:
          "เพิ่มสินค้าในตะกร้าเรียบร้อยแล้ว",
      });
    } catch (e) {
      console.error(
        "ADD TO CART ERROR:",
        e
      );

      res.status(500).json({
        status: "error",
        message:
          "Database Error",
        error: e.message,
      });
    }
  };

app.post(
  "/api/cart",
  addToCartHandler
);

app.post(
  "/api/cart.php",
  addToCartHandler
);

// ==========================================
// UPDATE CART
// ==========================================

const updateCartHandler =
  async (req, res) => {
    try {
      const {
        id,
        quantity,
      } = req.body;

      if (
        !id ||
        quantity === undefined
      ) {
        return res.status(400).json({
          status: "error",
          message:
            "Invalid parameters",
        });
      }

      if (
        Number(quantity) <= 0
      ) {
        await pool.query(
          "DELETE FROM cart WHERE id = ?",
          [id]
        );
      } else {
        await pool.query(
          "UPDATE cart SET quantity = ? WHERE id = ?",
          [
            Number(quantity),
            id,
          ]
        );
      }

      res.json({
        status: "success",
        message:
          "Updated quantity successfully",
      });
    } catch (e) {
      console.error(
        "UPDATE CART ERROR:",
        e
      );

      res.status(500).json({
        status: "error",
        message:
          "Database Error",
        error: e.message,
      });
    }
  };

app.post(
  "/api/cart_update",
  updateCartHandler
);

app.post(
  "/api/cart_update.php",
  updateCartHandler
);

// ==========================================
// DELETE CART
// ==========================================

const deleteCartHandler =
  async (req, res) => {
    try {
      const { id } =
        req.body;

      if (!id) {
        return res.status(400).json({
          status: "error",
          message:
            "Invalid cart id",
        });
      }

      await pool.query(
        "DELETE FROM cart WHERE id = ?",
        [id]
      );

      res.json({
        status: "success",
        message:
          "Item deleted successfully",
      });
    } catch (e) {
      console.error(
        "DELETE CART ERROR:",
        e
      );

      res.status(500).json({
        status: "error",
        message:
          "Database Error",
        error: e.message,
      });
    }
  };

app.post(
  "/api/cart_delete",
  deleteCartHandler
);

app.post(
  "/api/cart_delete.php",
  deleteCartHandler
);

// ==========================================
// 4. FORGOT / RESET PASSWORD
// ==========================================

const resetCodes =
  new Map();

// FORGOT PASSWORD

app.post(
  "/api/forgot-password",
  async (req, res) => {
    try {
      const email =
        String(
          req.body.email || ""
        )
          .trim()
          .toLowerCase();

      const [[user]] =
        await pool.query(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "ไม่พบอีเมลนี้ในระบบ",
        });
      }

      const code =
        String(
          Math.floor(
            100000 +
            Math.random() *
              900000
          )
        );

      resetCodes.set(
        email,
        {
          code,
          expiresAt:
            Date.now() +
            600000,
        }
      );

      res.json({
        success: true,
        message:
          "สร้าง OTP สำเร็จ",
        // ส่ง OTP กลับสำหรับการทดสอบ เพื่อให้หน้าแอปแสดงค่าแทนการดูจาก PuTTY
        otp: code,
      });
    } catch (e) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message:
          "Database Error",
        error: e.message,
      });
    }
  }
);

// RESET PASSWORD

app.post(
  "/api/reset-password",
  async (req, res) => {
    try {
      const email =
        String(
          req.body.email || ""
        )
          .trim()
          .toLowerCase();

      const code =
        String(
          req.body.code || ""
        );

      const newPassword =
        String(
          req.body.newPassword || ""
        );

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password ต้องมีอย่างน้อย 6 ตัวอักษร",
        });
      }

      const otpData =
        resetCodes.get(
          email
        );

      if (
        !otpData ||
        Date.now() >
          otpData.expiresAt ||
        otpData.code !== code
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OTP ไม่ถูกต้องหรือหมดอายุ",
        });
      }

      await pool.query(
        `UPDATE users
         SET passwordHash = ?,
             password = ?
         WHERE email = ?`,
        [
          newPassword,
          newPassword,
          email,
        ]
      );

      resetCodes.delete(
        email
      );

      res.json({
        success: true,
        message:
          "เปลี่ยนรหัสผ่านสำเร็จ",
      });
    } catch (e) {
      console.error(
        "RESET PASSWORD ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message:
          "Database Error",
        error: e.message,
      });
    }
  }
);

// ==========================================
// 5. TAPANAPONG AI / ML STOCK
// ==========================================

// GET ALL STOCK

app.get(
  "/api/tapanapong-stock",
  async (req, res) => {
    try {
      const [rows] =
        await pool.query(
          `SELECT *
           FROM Tapanapong_Stock
           ORDER BY id ASC`
        );

      res.json({
        success: true,
        total: rows.length,
        data: rows,
      });
    } catch (e) {
      console.error(
        "GET TAPANAPONG STOCK ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to retrieve Tapanapong stock",
        error: e.message,
      });
    }
  }
);

// GET STOCK BY ID

app.get(
  "/api/tapanapong-stock/:id",
  async (req, res) => {
    try {
      const id =
        Number(
          req.params.id
        );

      const [[row]] =
        await pool.query(
          `SELECT *
           FROM Tapanapong_Stock
           WHERE id = ?`,
          [id]
        );

      if (!row) {
        return res.status(404).json({
          success: false,
          message:
            "ไม่พบสินค้า",
        });
      }

      res.json({
        success: true,
        data: row,
      });
    } catch (e) {
      console.error(
        "GET TAPANAPONG STOCK BY ID ERROR:",
        e
      );

      res.status(500).json({
        success: false,
        message:
          "Database Error",
        error: e.message,
      });
    }
  }
);

// ==========================================
// 6. 404
// ==========================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API route not found",
    });
  }
);

// ==========================================
// SERVER PORT
// ==========================================

const PORT =
  Number(
    process.env.PORT
  ) || 3081;

// ==========================================
// DATABASE INITIALIZATION
// ==========================================

async function initialize() {
  const conn =
    await pool.getConnection();

  try {
    console.log(
      "✅ MySQL Connected"
    );

    const [dbResult] =
      await conn.query(
        "SELECT DATABASE() AS db"
      );

    console.log(
      "Database:",
      dbResult[0].db
    );

    // ========================================
    // USERS TABLE
    // ========================================

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        passwordHash VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','user') NOT NULL DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(id)
      )
      ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
    `);

    console.log(
      "✅ Users table ready"
    );

    // ========================================
    // CART TABLE
    // ========================================

    await conn.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        size_inch INT NULL,
        color VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(id)
      )
      ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
    `);

    console.log(
      "✅ Cart table ready"
    );

    // ========================================
    // TAPANAPONG STOCK TABLE
    // ========================================

    await conn.query(`
      CREATE TABLE IF NOT EXISTS Tapanapong_Stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        tshirt_type VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        country VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
    `);

    console.log(
      "✅ Tapanapong_Stock table ready"
    );

    // ========================================
    // INSERT TAPANAPONG DATA
    // ========================================

    const [[stockCount]] =
      await conn.query(
        "SELECT COUNT(*) AS total FROM Tapanapong_Stock"
      );

    if (
      Number(stockCount.total) === 0
    ) {
      await conn.query(`
        INSERT INTO Tapanapong_Stock
        (
          product_name,
          tshirt_type,
          model,
          price,
          country
        )
        VALUES
        ('Tapanapong Product','Crew Neck','Slim Fit',19.99,'Thailand'),
        ('Tapanapong Product','Crew Neck','Regular Fit',18.50,'USA'),
        ('Tapanapong Product','Crew Neck','Relaxed Fit',20.00,'Japan'),
        ('Tapanapong Product','Crew Neck','Athletic Fit',22.99,'Vietnam'),
        ('Tapanapong Product','Crew Neck','Oversized',24.50,'Italy'),
        ('Tapanapong Product','Crew Neck','Slim Fit',19.99,'UK'),
        ('Tapanapong Product','Crew Neck','Regular Fit',18.50,'France'),
        ('Tapanapong Product','Crew Neck','Relaxed Fit',21.00,'Germany'),
        ('Tapanapong Product','Crew Neck','Athletic Fit',23.50,'South Korea'),
        ('Tapanapong Product','Crew Neck','Oversized',25.00,'China'),

        ('Tapanapong Product','V-Neck','Slim Fit',17.99,'Thailand'),
        ('Tapanapong Product','V-Neck','Regular Fit',16.50,'USA'),
        ('Tapanapong Product','V-Neck','Relaxed Fit',18.00,'Japan'),
        ('Tapanapong Product','V-Neck','Athletic Fit',20.99,'Vietnam'),
        ('Tapanapong Product','V-Neck','Oversized',22.50,'Italy'),
        ('Tapanapong Product','V-Neck','Slim Fit',17.99,'UK'),
        ('Tapanapong Product','V-Neck','Regular Fit',16.50,'France'),
        ('Tapanapong Product','V-Neck','Relaxed Fit',19.00,'Germany'),
        ('Tapanapong Product','V-Neck','Athletic Fit',21.50,'South Korea'),
        ('Tapanapong Product','V-Neck','Oversized',23.00,'China'),

        ('Tapanapong Product','Polo','Slim Fit',29.99,'Thailand'),
        ('Tapanapong Product','Polo','Regular Fit',28.50,'USA'),
        ('Tapanapong Product','Polo','Relaxed Fit',30.00,'Japan'),
        ('Tapanapong Product','Polo','Athletic Fit',32.99,'Vietnam'),
        ('Tapanapong Product','Polo','Oversized',34.50,'Italy'),
        ('Tapanapong Product','Polo','Slim Fit',29.99,'UK'),
        ('Tapanapong Product','Polo','Regular Fit',28.50,'France'),
        ('Tapanapong Product','Polo','Relaxed Fit',31.00,'Germany'),
        ('Tapanapong Product','Polo','Athletic Fit',33.50,'South Korea'),
        ('Tapanapong Product','Polo','Oversized',35.00,'China'),

        ('Tapanapong Product','Graphic Tee','Slim Fit',24.99,'Thailand'),
        ('Tapanapong Product','Graphic Tee','Regular Fit',23.50,'USA'),
        ('Tapanapong Product','Graphic Tee','Relaxed Fit',25.00,'Japan'),
        ('Tapanapong Product','Graphic Tee','Athletic Fit',27.99,'Vietnam'),
        ('Tapanapong Product','Graphic Tee','Oversized',29.50,'Italy'),
        ('Tapanapong Product','Graphic Tee','Slim Fit',24.99,'UK'),
        ('Tapanapong Product','Graphic Tee','Regular Fit',23.50,'France'),
        ('Tapanapong Product','Graphic Tee','Relaxed Fit',26.00,'Germany'),
        ('Tapanapong Product','Graphic Tee','Athletic Fit',28.50,'South Korea'),
        ('Tapanapong Product','Graphic Tee','Oversized',30.00,'China'),

        ('Tapanapong Product','Henley','Slim Fit',26.99,'Thailand'),
        ('Tapanapong Product','Henley','Regular Fit',25.50,'USA'),
        ('Tapanapong Product','Henley','Relaxed Fit',27.00,'Japan'),
        ('Tapanapong Product','Henley','Athletic Fit',29.99,'Vietnam'),
        ('Tapanapong Product','Henley','Oversized',31.50,'Italy'),
        ('Tapanapong Product','Henley','Slim Fit',26.99,'UK'),
        ('Tapanapong Product','Henley','Regular Fit',25.50,'France'),
        ('Tapanapong Product','Henley','Relaxed Fit',28.00,'Germany'),
        ('Tapanapong Product','Henley','Athletic Fit',30.50,'South Korea'),
        ('Tapanapong Product','Henley','Oversized',32.00,'China')
      `);

      console.log(
        "✅ Inserted 50 Tapanapong products"
      );
    } else {
      console.log(
        `ℹ️ Tapanapong Stock already has ${stockCount.total} records`
      );
    }

    // ========================================
    // CREATE ADMIN
    // ========================================

    const adminUser =
      process.env.ADMIN_USERNAME ||
      "admin";

    const adminPass =
      process.env.ADMIN_PASSWORD ||
      "admin123";

    const [[existingAdmin]] =
      await conn.query(
        `SELECT id
         FROM users
         WHERE username = ?
         LIMIT 1`,
        [adminUser]
      );

    if (!existingAdmin) {
      await conn.query(
        `INSERT INTO users
        (
          username,
          email,
          passwordHash,
          password,
          role
        )
        VALUES (?, ?, ?, ?, ?)`,
        [
          adminUser,
          `${adminUser}@travelluggage.local`,
          adminPass,
          adminPass,
          "admin",
        ]
      );

      console.log(
        "✅ Default admin created"
      );
      console.log(
        "Username:",
        adminUser
      );
      console.log(
        "Password:",
        adminPass
      );
    } else {
      console.log(
        "ℹ️ Admin already exists"
      );
    }

  } finally {
    conn.release();
  }
}

// ==========================================
// START DATABASE + SERVER
// ==========================================

initialize()
  .then(() => {
    console.log(
      "✅ Database initialization completed"
    );
  })
  .catch((e) => {
    console.error(
      "❌ Database initialization error:",
      e.message
    );
  });

// ==========================================
// START SERVER
// ==========================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `✅ Travel Luggage API running on port ${PORT}`
    );

    console.log(
      `🌐 Server: http://119.59.102.161:${PORT}`
    );

    console.log(
      `📦 Products: http://119.59.102.161:${PORT}/api/products`
    );

    console.log(
      `🤖 Tapanapong AI Data: http://119.59.102.161:${PORT}/api/tapanapong-stock`
    );
  }
);