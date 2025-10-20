class TaskService {
  constructor() {
    this.baseURL = "http://localhost:3002/api";
  }

  getAuthHeaders() {
    const token = localStorage.getItem("CloudDocsToken");
    return { Authorization: token ? `Bearer ${token}` : "" };
  }

  // Dashboard - fetch current user's tasks + stats
  async getUserTasksWithStats() {
    try {
      const res = await fetch(`${this.baseURL}/tasks/my-tasks`, {
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message };

      const tasks = data.tasks || [];
      const total = tasks.length;
      const completedCount = tasks.filter(
        (t) => t.status === "Completed"
      ).length;
      const pendingCount = total - completedCount;

      return {
        success: true,
        tasks,
        stats: {
          total,
          completed: completedCount,
          pending: pendingCount,
        },
      };
    } catch {
      return { success: false, error: "Network error" };
    }
  }

  // Gallery - fetch all users’ tasks
  async getAllTasks() {
    try {
      const res = await fetch(`${this.baseURL}/tasks`, {
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message };
      return { success: true, tasks: data.tasks || [] };
    } catch {
      return { success: false, error: "Network error" };
    }
  }

  // ✅ Create new task (frontend matches backend POST /api/tasks)
  async createTask(task) {
    console.log("Create task response:", task);
    try {
      const res = await fetch(`${this.baseURL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(task),
      });

      const data = await res.json();
      console.log("Create task response:", data);
      return res.ok
        ? { success: true, task: data.task }
        : { success: false, error: data.message };
    } catch {
      return { success: false, error: "Network error" };
    }
  }

  // Delete task
  async deleteTask(taskId) {
    try {
      const res = await fetch(`${this.baseURL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      return res.ok
        ? { success: true }
        : { success: false, error: data.message };
    } catch {
      return { success: false, error: "Network error" };
    }
  }

  // Update status
  async updateStatus(taskId, status) {
    try {
      const res = await fetch(`${this.baseURL}/tasks/${taskId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      return res.ok
        ? { success: true }
        : { success: false, error: data.message };
    } catch {
      return { success: false, error: "Network error" };
    }
  }
}

window.taskService = new TaskService();
