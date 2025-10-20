const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "abhishek@2003@sql",
  database: process.env.DB_NAME || "Taskmate_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ---------------------
// JWT Authentication
// ---------------------
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// ---------------------
// Routes
// ---------------------

// ➤ Create new task
app.post("/api/tasks", authenticateToken, async (req, res) => {
  const { title, description, status = "Pending", dueDate } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required" });
  console.log(req.body);
  console.log(title, description, status, dueDate);

  try {
    const [result] = await pool.execute(
      `INSERT INTO tasks (title, description, status, due_date, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, status, dueDate, req.userId]
    );

    res.status(201).json({
      message: "Task created successfully",
      task: { id: result.insertId, title, description, status, dueDate },
    });
  } catch (error) {
    console.error("Task creation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ➤ Get user's tasks + stats
app.get("/api/tasks/my-tasks", authenticateToken, async (req, res) => {
  try {
    const [tasks] = await pool.execute(
      `SELECT id, title, description, status, due_date, created_at
       FROM tasks WHERE user_id = ? ORDER BY created_at DESC`,
      [req.userId]
    );

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "Completed").length;
    const pending = total - completed;

    res.json({
      tasks,
      stats: { total, completed, pending },
    });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ➤ Update task status
app.put("/api/tasks/:id/status", authenticateToken, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "Status is required" });

  try {
    const [result] = await pool.execute(
      `UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?`,
      [status, req.params.id, req.userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task status updated successfully" });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ➤ Delete task
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      `DELETE FROM tasks WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ➤ Get all tasks (for gallery / public view)
app.get("/api/tasks", async (req, res) => {
  try {
    const [tasks] = await pool.execute(
      `SELECT t.id, t.title, t.description, t.status, t.due_date, t.created_at,
              u.username AS created_by
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );

    res.json({ tasks, total: tasks.length });
  } catch (error) {
    console.error("Get all tasks error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ➤ Health check
app.get("/health", async (req, res) => {
  try {
    await pool.execute("SELECT 1");
    res.json({ status: "OK", service: "task-service" });
  } catch {
    res.status(500).json({ status: "Error", service: "task-service" });
  }
});

app.listen(PORT, () => console.log(`✅ Task service running on port ${PORT}`));
