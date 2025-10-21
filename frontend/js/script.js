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
      const logoutLink = document.getElementById("logoutLink");
      if (logoutLink) logoutLink.addEventListener("click", logout);
    } else {
      navLinks.innerHTML = `
        <a href="../index.html">Home</a>
        <a href="/pages/gallery.html">Repository</a>
        <a href="#" id="loginLink">Login</a>
        <a href="#" id="registerLink">Register</a>
      `;
      const loginLink = document.getElementById("loginLink");
      const registerLink = document.getElementById("registerLink");
      if (loginLink) loginLink.addEventListener("click", showLoginModal);
      if (registerLink)
        registerLink.addEventListener("click", showRegisterModal);
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
      const getStartedLink = document.getElementById("getStartedLink");
      if (getStartedLink)
        getStartedLink.addEventListener("click", showRegisterModal);
    }
  }
}
function setupAuthModal() {
  const authModal = document.getElementById("authModal");
  if (!authModal) return;

  const closeModal = document.getElementById("closeModal");
  const authForm = document.getElementById("authForm");
  const authSwitchLink = document.getElementById("authSwitchLink");
  const authTitle = document.getElementById("authTitle");
  const authButton = document.getElementById("authButton");
  const authSwitchText = document.getElementById("authSwitchText");
  const confirmPasswordContainer = document.getElementById(
    "confirmPasswordContainer"
  );

  let isLoginMode = true;

  if (closeModal) {
    closeModal.addEventListener(
      "click",
      () => (authModal.style.display = "none")
    );
  }

  window.addEventListener("click", (event) => {
    if (event.target === authModal) authModal.style.display = "none";
  });

  if (authSwitchLink) {
    authSwitchLink.addEventListener("click", () => {
      isLoginMode = !isLoginMode;
      if (isLoginMode) {
        authTitle.textContent = "Login";
        authButton.textContent = "Login";
        authSwitchText.textContent = "Don't have an account? ";
        authSwitchLink.textContent = "Register";
        if (confirmPasswordContainer)
          confirmPasswordContainer.style.display = "none";
      } else {
        authTitle.textContent = "Register";
        authButton.textContent = "Register";
        authSwitchText.textContent = "Already have an account? ";
        authSwitchLink.textContent = "Login";
        if (confirmPasswordContainer)
          confirmPasswordContainer.style.display = "block";
      }
      if (authForm) authForm.reset();
    });
  }

  if (authForm) {
    authForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.getElementById("username")?.value;
      const password = document.getElementById("password")?.value;
      if (!username || !password) return;

      if (isLoginMode) {
        const result = await authService.login({ username, password });
        if (result.success) {
          currentUser = result.user;
          authModal.style.display = "none";
          updateUI();
          if (document.getElementById("usertasksGrid")) loadUsertasks();
          alert("Login successful!");
        } else alert("Login failed: " + result.error);
      } else {
        const confirmPassword =
          document.getElementById("confirmPassword")?.value;
        if (password !== confirmPassword) {
          alert("Passwords do not match!");
          return;
        }
        const result = await authService.register({ username, password });
        if (result.success) {
          currentUser = result.user;
          authModal.style.display = "none";
          updateUI();
          if (document.getElementById("usertasksGrid")) loadUsertasks();
          alert("Registration successful!");
        } else alert("Registration failed: " + result.error);
      }
    });
  }
}

// ---------------------
// Show modals
// ---------------------
function showLoginModal() {
  const authModal = document.getElementById("authModal");
  if (!authModal) return;
  document.getElementById("authTitle").textContent = "Login";
  document.getElementById("authButton").textContent = "Login";
  document.getElementById("authSwitchText").textContent =
    "Don't have an account? ";
  document.getElementById("authSwitchLink").textContent = "Register";
  document.getElementById("confirmPasswordContainer").style.display = "none";
  authModal.style.display = "flex";
}

function showRegisterModal() {
  const authModal = document.getElementById("authModal");
  if (!authModal) return;
  document.getElementById("authTitle").textContent = "Register";
  document.getElementById("authButton").textContent = "Register";
  document.getElementById("authSwitchText").textContent =
    "Already have an account? ";
  document.getElementById("authSwitchLink").textContent = "Login";
  document.getElementById("confirmPasswordContainer").style.display = "block";
  authModal.style.display = "flex";
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
      <p>Due: ${task.due_date || "N/A"}</p>
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

// upload-task.js
const form = document.getElementById("taskForm");
const message = document.getElementById("formMessage");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newTask = {
    title: document.getElementById("taskTitle").value,
    description: document.getElementById("taskDescription").value,
    dueDate: document.getElementById("taskDueDate").value || null,
    status: document.getElementById("taskStatus").value,
  };

  console.log("Creating task:", newTask);

  try {
    const res = await taskService.createTask(newTask);

    if (res.success) {
      message.innerText = "✅ Task created successfully!";
      form.reset();
    } else {
      message.innerText = "❌ " + res.error;
    }
  } catch (err) {
    message.innerText = "❌ " + err.message;
  }
});
