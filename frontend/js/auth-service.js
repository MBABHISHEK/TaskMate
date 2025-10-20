// Authentication Service Client
class AuthService {
  constructor() {
    this.baseURL = "http://localhost:3001/api";
    this.token = localStorage.getItem("CloudDocsToken") || null;
  }

  // Save token to memory and localStorage
  setToken(token) {
    this.token = token;
    localStorage.setItem("CloudDocsToken", token);
  }

  // Get headers for authenticated requests
  getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: this.token ? `Bearer ${this.token}` : "",
    };
  }

  // Register new user
  async register(userData) {
    console.log(userData);
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        this.setToken(data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  }

  // Login existing user
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        this.setToken(data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: "Network error occurred" };
    }
  }

  // Get currently logged-in user
  async getCurrentUser() {
    if (!this.token) return null;

    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      } else {
        this.logout();
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  // Logout user
  logout() {
    this.token = null;
    localStorage.removeItem("CloudDocsToken");
  }

  // Check if user is logged in
  isAuthenticated() {
    return !!this.token;
  }
}

// Create global auth service instance
window.authService = new AuthService();
