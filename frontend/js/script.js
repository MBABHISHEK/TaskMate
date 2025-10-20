// Main application script
let currentUser = null;

// Wait for DOM to load
document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is authenticated
  if (typeof authService !== "undefined" && authService.isAuthenticated()) {
    currentUser = await authService.getCurrentUser();
  }

  updateUI();
  setupAuthModal();

  // Load dashboard tasks if logged in
  if (currentUser) {
    loadDashboardtasks();
  }
});

// ---------------------
// Update navigation & hero UI
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
        <a href="upload.html" class="btn btn-primary">Upload task</a>
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

// ---------------------
// Auth modal setup
// ---------------------
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
  alert("You have been logged out.");
}

// ---------------------
// Load user tasks and stats
// ---------------------
// Render dashboard tasks with stats
async function loadDashboardtasks() {
  if (!currentUser) return;

  const grid = document.getElementById("usertasksGrid");
  const totaltasksSpan = document.getElementById("totaltasks");
  const publictasksSpan = document.getElementById("publictasks");
  const privatetasksSpan = document.getElementById("privatetasks");
  const storageUsedSpan = document.getElementById("storageUsed");

  const result = await taskService.getUsertasksWithStats();
  console.log(result);
  if (result.success) {
    totaltasksSpan.textContent = result.stats.total;
    publictasksSpan.textContent = result.stats.public;
    privatetasksSpan.textContent = result.stats.private;
    storageUsedSpan.textContent = (
      result.stats.storageUsed /
      (1024 * 1024)
    ).toFixed(2); // MB

    grid.innerHTML = "";
    result.tasks.forEach((img) => {
      const div = document.createElement("div");
      div.classList.add("gallery-item");
      div.innerHTML = `
      <div class="task-container">
        <iframe class="gallery-task" src="${
          img.url
        }" width="100%" height="300px"></iframe>
       <div class="task-overlay">
          <a href="${
            img.url
          }" download class="btn btn-secondary">To View Full task</a>
            <button class="btn btn-danger btn-delete" data-id="${
              img.id
            }">Delete</button>
          </div>
        </div>
        <div class="task-info">
        <p class="task-name">${img.original_name}</p>
         <p class="task-visibility ${img.is_public ? "public" : "private"}">
            ${img.is_public ? "Public" : "Private"}
      `;
      grid.appendChild(div);
    });
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const taskId = e.target.dataset.id;
        if (confirm("Are you sure you want to delete this task?")) {
          const delResult = await taskService.deletetask(taskId);
          if (delResult.success) {
            alert("task deleted successfully");
            loadDashboardtasks(); // Refresh dashboard after deletion
          } else {
            alert("Failed to delete task: " + delResult.error);
          }
        }
      });
    });
  } else {
    grid.innerHTML = `<p style="color:red;">Failed to load tasks: ${result.error}</p>`;
  }
}

// Render gallery tasks (all users, public + private)
async function loadGallerytasks() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  const result = await taskService.getAlltasks();
  if (result.success) {
    grid.innerHTML = "";
    result.tasks.forEach((img) => {
      const div = document.createElement("div");
      div.classList.add("gallery-item");
      div.innerHTML = `
      <div class="task-container">
      <iframe class="gallery-task" src="${
        img.url
      }" width="100%" height="300px"></iframe>
      <div class="task-overlay">
      <a href="${
        img.url
      }" download class="btn btn-secondary">To View Full task</a>
        </div>
        <p class="task-name">${img.original_name}</p>
         <p class="task-visibility ${img.is_public ? "Private" : "Public"}">
            ${img.is_public ? "Private" : "Public"}
      `;
      grid.appendChild(div);
    });
  } else {
    grid.innerHTML = `<p style="color:red;">Failed to load tasks: ${result.error}</p>`;
  }
}

// On DOM load
document.addEventListener("DOMContentLoaded", async () => {
  if (currentUser && document.getElementById("usertasksGrid")) {
    await loadDashboardtasks();
  }
  if (document.getElementById("galleryGrid")) {
    await loadGallerytasks();
  }
});
