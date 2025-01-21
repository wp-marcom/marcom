// Define role permissions
const rolePermissions = {
  admin: ["admin", "warehouse", "mister", "tmc"], // Admin sees everything
  warehouse: ["warehouse", "lprice", "molson"], // Warehouse sees specific roles
  lprice: ["lprice"], // Sees only what’s assigned to "lprice"
  acharles: ["acharles"], // Sees only what’s assigned to "lprice"
  molson: ["molson"] // Sees only what’s assigned to "molson"
};

// Define users array
const users = [
  { username: "admin", password: "admin123", role: "admin", fullName: "Admin User" },
  { username: "eastwarehouse", password: "eastwarehouse", role: "warehouse", fullName: "East Warehouse" },
  { username: "lprice", password: "lprice", role: "lprice", fullName: "Linda" },
  { username: "acharles", password: "acharles", role: "acharles", fullName: "Andy" },
  { username: "molson", password: "molson", role: "molson", fullName: "Marlo" }
];

// Define page permissions
const pagePermissions = {
  "tracker-mister.html": ["admin", "warehouse", "lprice"], // Admin and lprice roles
  "tracker-siet.html": ["admin", "warehouse", "lprice"], // Admin and lprice roles
  "tracker-tmc.html": ["admin", "warehouse", "molson"], // Admin and molson roles
  "tracker-nmc.html": ["admin", "warehouse", "ctapia"], // Admin and 
  "tracker-vwcu.html": ["admin", "warehouse", "acharles"], // Admin and 
  "tracker-pfcu.html": ["admin", "warehouse", "acharles"], // Admin and
  "tracker-uafoundation.html": ["admin", "warehouse", "acharles"], // Admin and
  "tracker-uofa.html": ["admin", "warehouse", "gnelson"], // Admin and
  "dashboard.html": ["admin", "warehouse"], // Only admin can access
  "warehouse-page.html": ["admin", "warehouse"], // Admin and warehouse roles
};


// Check user authentication
function checkAuthentication() {
  const userRole = sessionStorage.getItem("userRole");
  const currentPage = window.location.pathname.split("/").pop(); // Get the current page name

  // If the user is already logged in and navigates to the login page
  if (userRole && currentPage === "login.html") {
    alert("You are already logged in.");
    const lastPage = sessionStorage.getItem("lastValidPage") || "dashboard.html";
    window.location.href = lastPage; // Redirect to last valid page or homepage
    return;
  }

  // If no user is logged in and not on the login page, redirect to login
  if (!userRole && currentPage !== "login.html") {
    alert("You must be logged in to access this page.");
    window.location.href = "login.html";
  }
}

function checkAuthorization() {
  const userRole = sessionStorage.getItem("userRole");
  const currentPage = window.location.pathname.split("/").pop(); // Get the current page name

  // If the current page is the login page, allow access without checking roles
  if (currentPage === "login.html") {
    return;
  }

  // Get allowed roles for the current page
  const allowedRoles = pagePermissions[currentPage] || [];

  if (!userRole || !allowedRoles.includes(userRole)) {
    alert("You do not have permission to access this page.");
    const lastPage = sessionStorage.getItem("lastValidPage") || "login.html";
    window.location.href = lastPage; // Redirect to the last valid page or default to dashboard.html
  } else {
    // Save the current page as the last valid page
    sessionStorage.setItem("lastValidPage", currentPage);
  }
}


// Handle login form submission
document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("yourUsername").value;
  const password = document.getElementById("yourPassword").value;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
   // alert("Login successful!");
    sessionStorage.setItem("userRole", user.role);
    sessionStorage.setItem("userFullName", user.fullName); // Save user's full name
    window.location.href = "dashboard.html"; // Redirect to main page
  } else {
    alert("Invalid credentials. Please try again.");
  }
});

// Function to update the username in the header
function updateUserDisplayName() {
  const userFullName = sessionStorage.getItem("userFullName");

  if (userFullName) {
    document.getElementById("userAccount").textContent = userFullName; // Set the username in the element
  }
}



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

// On page load, update the username if logged in
window.addEventListener("DOMContentLoaded", () => {
  checkAuthentication();
  checkAuthorization()
  updateUserDisplayName();


  if (!window.location.pathname.endsWith("login.html")) {
    applyRoleBasedVisibility();
  }
});
