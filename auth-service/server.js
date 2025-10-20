const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool (single database)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "abhishek@2003@sql",
  database: process.env.DB_NAME || "Taskmate_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access token required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await pool.execute(
      "SELECT id, username FROM users WHERE id = ?",
      [decoded.userId]
    );
    if (users.length === 0)
      return res.status(401).json({ message: "Invalid token" });

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Routes
app.post("/api/auth/register", async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ message: "Username and password required" });

    connection = await pool.getConnection();
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (existingUsers.length > 0)
      return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await connection.execute(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );

    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, {
      expiresIn: "24h",
    });
    res.status(201).json({
      message: "User created successfully",
      token,
      user: { id: result.insertId, username },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/auth/login", async (req, res) => {
  console.log("Login attempt:", req.body);
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({ message: "Username and password required" });

    const [users] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (users.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username } });
});

// Health check
app.get("/health", async (req, res) => {
  try {
    await pool.execute("SELECT 1");
    res.json({ status: "OK", service: "auth" });
  } catch (error) {
    res.status(500).json({ status: "Error", service: "auth" });
  }
});

app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));
