let currentUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof authService !== "undefined" && authService.isAuthenticated()) {
    currentUser = await authService.getCurrentUser();
  }

  updateUI();
  setupAuthModal();

  if (currentUser && document.getElementById("userTasksGrid")) {
    await loadDashboardTasks();
  }
  if (document.getElementById("galleryGrid")) {
    await loadGalleryTasks();
  }
});

// ---------------------
// Update navigation
// ---------------------
function updateUI() {
  const navLinks = document.getElementById("navLinks");
  const heroButtons = document.getElementById("heroButtons");

  if (navLinks) {
    if (currentUser) {
      navLinks.innerHTML = `
        <a href="../index.html">Home</a>
        <a href="/pages/gallery.html">Repository</a>
        <span>Welcome, ${currentUser.username}</span>
        <a href="/pages/dashboard.html">Dashboard</a>
        <a href="/pages/upload.html">Upload</a>
        <a href="#" id="logoutLink">Logout</a>
      `;
      document.getElementById("logoutLink").addEventListener("click", logout);
    } else {
      navLinks.innerHTML = `
        <a href="../index.html">Home</a>
        <a href="/pages/gallery.html">Repository</a>
        <a href="#" id="loginLink">Login</a>
        <a href="#" id="registerLink">Register</a>
      `;
      document
        .getElementById("loginLink")
        .addEventListener("click", showLoginModal);
      document
        .getElementById("registerLink")
        .addEventListener("click", showRegisterModal);
    }
  }

  if (heroButtons) {
    if (currentUser) {
      heroButtons.innerHTML = `
        <a href="upload.html" class="btn btn-primary">Add Task</a>
        <a href="dashboard.html" class="btn btn-secondary">My Dashboard</a>
      `;
    } else {
      heroButtons.innerHTML = `
        <a href="#" id="getStartedLink" class="btn btn-primary">Get Started</a>
        <a href="gallery.html" class="btn btn-secondary">View Repository</a>
      `;
      document
        .getElementById("getStartedLink")
        ?.addEventListener("click", showRegisterModal);
    }
  }
}

// ---------------------
// Logout
// ---------------------
function logout() {
  authService.logout();
  currentUser = null;
  updateUI();
  alert("Logged out successfully.");
}

// ---------------------
// Load Dashboard Tasks
// ---------------------
async function loadDashboardTasks() {
  if (!currentUser) return;

  const grid = document.getElementById("userTasksGrid");
  const total = document.getElementById("totalTasks");
  const completed = document.getElementById("completedTasks");
  const pending = document.getElementById("pendingTasks");

  const res = await taskService.getUserTasksWithStats();
  if (!res.success) {
    grid.innerHTML = `<p style="color:red;">${res.error}</p>`;
    return;
  }

  total.textContent = res.stats.total;
  completed.textContent = res.stats.completed;
  pending.textContent = res.stats.pending;

  grid.innerHTML = "";
  res.tasks.forEach((task) => {
    const div = document.createElement("div");
    div.classList.add("task-card");
    div.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description || ""}</p>
      <p>Status: <strong>${task.status}</strong></p>
      <p>Due: ${task.dueDate || "N/A"}</p>
      <button class="btn btn-danger btn-delete" data-id="${
        task.id
      }">Delete</button>
      <button class="btn btn-secondary btn-toggle-status" data-id="${
        task.id
      }" data-status="${task.status}">
        Mark as ${task.status === "Pending" ? "Completed" : "Pending"}
      </button>
    `;
    grid.appendChild(div);
  });

  // Delete task
  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("Delete this task?")) {
        const delRes = await taskService.deleteTask(id);
        if (delRes.success) loadDashboardTasks();
        else alert(delRes.error);
      }
    });
  });

  // Toggle status
  document.querySelectorAll(".btn-toggle-status").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const newStatus =
        e.target.dataset.status === "Pending" ? "Completed" : "Pending";
      const updRes = await taskService.updateStatus(id, newStatus);
      if (updRes.success) loadDashboardTasks();
      else alert(updRes.error);
    });
  });
}

// ---------------------
// Load Gallery Tasks
// ---------------------
async function loadGalleryTasks() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const res = await taskService.getAllTasks();
  if (!res.success) {
    grid.innerHTML = `<p style="color:red;">${res.error}</p>`;
    return;
  }

  grid.innerHTML = "";
  res.tasks.forEach((task) => {
    const div = document.createElement("div");
    div.classList.add("task-card");
    div.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description || ""}</p>
      <p>Status: <strong>${task.status}</strong></p>
      <p>Due: ${task.dueDate || "N/A"}</p>
    `;
    grid.appendChild(div);
  });
}
