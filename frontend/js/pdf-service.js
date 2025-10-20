class taskService {
  constructor() {
    this.baseURL = "http://localhost:3002/api";
  }

  getAuthHeaders() {
    const token = localStorage.getItem("CloudDocsToken");
    return { Authorization: token ? `Bearer ${token}` : "" };
  }

  // Dashboard - current user tasks + stats
  async getUsertasksWithStats() {
    try {
      const res = await fetch(`${this.baseURL}/tasks/my-tasks`, {
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) return { success: false, error: data.message };
      console.log(res.ok);
      const tasks = (data.tasks || []).map((img) => ({
        ...img,
        url: img.url.startsWith("http")
          ? img.url
          : `http://localhost:3002${img.url.startsWith("/") ? "" : "/"}${
              img.url
            }`,
      }));

      console.log(tasks.url);
      const total = tasks.length;
      const publicCount = tasks.filter((i) => i.is_public === 1).length;
      const privateCount = total - publicCount;
      const storageUsed = tasks.reduce((acc, i) => acc + i.file_size, 0);
      console.log(tasks.length);
      return {
        success: true,
        tasks,
        stats: {
          total,
          public: publicCount,
          private: privateCount,
          storageUsed,
        },
      };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }

  // Gallery - all tasks
  async getAlltasks() {
    try {
      const res = await fetch(`${this.baseURL}/tasks/public`);
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message };

      const tasks = data.tasks.map((img) => ({
        ...img,
        url: `http://localhost:3002/${img.file_path.replace(/\\/g, "/")}`,
      }));
      return { success: true, tasks };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }

  async uploadtask(formData) {
    console.log(formData);
    try {
      const res = await fetch(`${this.baseURL}/tasks/upload`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      console.log(res.ok);
      return res.ok
        ? { success: true, task: data.task }
        : { success: false, error: data.message };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }

  async deletetask(taskId) {
    try {
      const res = await fetch(`${this.baseURL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      return res.ok
        ? { success: true }
        : { success: false, error: data.message };
    } catch (err) {
      return { success: false, error: "Network error" };
    }
  }
}

window.taskService = new taskService();
