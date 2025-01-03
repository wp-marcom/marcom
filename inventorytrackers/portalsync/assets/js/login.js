// Define role permissions
const rolePermissions = {
  admin: ["admin", "warehouse", "mister", "tmc"], // Admin sees everything
  warehouse: ["warehouse", "lprice", "molson"], // Warehouse sees specific roles
  lprice: ["lprice"], // Sees only what’s assigned to "lprice"
  molson: ["molson"] // Sees only what’s assigned to "molson"
};

// Define users array
const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "eastwarehouse", password: "eastwarehouse", role: "warehouse" },
  { username: "lprice", password: "lprice", role: "lprice" },
  { username: "molson", password: "molson", role: "molson" }
];

// Check user authentication
function checkAuthentication() {
  const userRole = sessionStorage.getItem("userRole");

  if (!userRole && !window.location.pathname.endsWith("pages-login.html")) {
    // Redirect to login page if no user is logged in
    alert("You must be logged in to access this page.");
    window.location.href = "pages-login.html";
  }
}

// Handle login form submission
document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("yourUsername").value;
  const password = document.getElementById("yourPassword").value;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    //alert("Login successful!");
    sessionStorage.setItem("userRole", user.role);
    window.location.href = "index.html"; // Redirect to main page
  } else {
    alert("Invalid credentials. Please try again.");
  }
});

// Apply role-based visibility
function applyRoleBasedVisibility() {
  const userRole = sessionStorage.getItem("userRole");
  console.log("User role from sessionStorage:", userRole);

  document.querySelectorAll("[data-role]").forEach(item => {
    // Always-visible elements
    if (item.classList.contains("always-visible") || item.getAttribute("data-role") === "public") {
      item.style.display = ""; // Show element
      return; // Skip further processing
    }

    const rolesAllowed = item.getAttribute("data-role")?.split(",") || [];
    if (
      userRole === "admin" || // Admin sees everything
      (rolePermissions[userRole] && rolePermissions[userRole].some(role => rolesAllowed.includes(role)))
    ) {
      item.style.display = ""; // Show element
    } else {
      item.style.display = "none"; // Hide element
    }
  });
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  checkAuthentication();

  if (!window.location.pathname.endsWith("pages-login.html")) {
    applyRoleBasedVisibility();
  }
});
