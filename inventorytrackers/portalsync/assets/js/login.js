// Define role permissions
const rolePermissions = {
  admin: ["admin", "warehouse", "misterAdmin", "tmcAdmin"], // Admin sees everything
  warehouse: ["warehouse", "misterAdmin", "tmcAdmin"], // Warehouse sees specific roles
  misterAdmin: ["misterAdmin"],
  sierraTucsonAdmin: ["sierraTucsonAdmin"],
  lprice: ["lprice"], // Sees only what’s assigned to "lprice"
  pfcuAdmin: ["pfcuAdmin"], // Sees only what’s assigned to
  vwcuAdmin: ["vwcuAdmin"], // Sees only what’s assigned to
  tmcAdmin: ["tmcAdmin"] // Sees only what’s assigned to "molson"
};

// Define users array
//const users = [
//  { username: "admin", password: "admin123", role: "admin", fullName: "Admin User" },
//  { username: "eastwarehouse", password: "eastwarehouse", role: "warehouse", fullName: "East Warehouse" },
//  { username: "east1", password: "east1", role: "warehouse", fullName: "East Warehouse 1" },
//  { username: "east2", password: "east2", role: "warehouse", fullName: "East Warehouse 2" },
//  { username: "linda", password: "Charlie1", role: "lprice", fullName: "Linda" },
//  { username: "dave", password: "dave", role: "lprice", fullName: "Dave" },
//  { username: "acharles", password: "acharles", role: "acharles", fullName: "Andy" },
//  { username: "molson", password: "molson", role: "molson", fullName: "Marlo" }
//];

//Define User Groups as an Array Object instead
const users = [
  { username: "admin", password: "admin123", roles: ["admin"], fullName: "Admin User" },
  { username: "eastwarehouse", password: "eastwarehouse", roles: ["warehouse"], fullName: "East Warehouse" },
  { username: "east1", password: "east1", roles: ["warehouse"], fullName: "East Warehouse 1" },
  { username: "east2", password: "east2", roles: ["warehouse"], fullName: "East Warehouse 2" },
  { username: "quietbindery", password: "quietbindery", roles: ["warehouse"], fullName: "Quiet Bindery" },
  { username: "becky", password: "becky", roles: ["warehouse"], fullName: "Becky Wigginton-Colón" },
  { username: "cruz", password: "cruz", roles: ["warehouse"], fullName: "Cruz" },
  { username: "linda", password: "Charlie1", roles: ["misterAdmin", "sierraTucsonAdmin"], fullName: "Linda" },
  { username: "dave", password: "dave", roles: ["sierraTucsonAdmin"], fullName: "Dave" },
  { username: "acharles", password: "acharles", roles: ["pfcuAdmin", "vwcuAdmin"], fullName: "Andy" },
  { username: "molson", password: "molson", roles: ["tmcAdmin"], fullName: "Marlo" }
];

// Define page permissions
const pagePermissions = {
  "tracker-mister.html": ["admin", "warehouse", "misterAdmin"], // Admin and lprice roles
  "tracker-mister-washpass.html": ["admin", "warehouse", "misterAdmin"], // Admin and lprice roles
  "tracker-mister-washpass-client.html": ["admin", "warehouse", "misterAdmin"], // Admin and lprice roles
  "tracker-siet.html": ["admin", "warehouse", "sierraTucsonAdmin"], // Admin and lprice roles
  "tracker-tmc.html": ["admin", "warehouse", "tmcAdmin"], // Admin and molson roles
  "tracker-nmc.html": ["admin", "warehouse", "ctapia"], // Admin and 
  "tracker-vwcu.html": ["admin", "warehouse", "vwcuAdmin"], // Admin and 
  "tracker-pfcu.html": ["admin", "warehouse", "pfcuAdmin"], // Admin and
  "tracker-uafoundation.html": ["admin", "warehouse", "acharles"], // Admin and
  "tracker-uofa.html": ["admin", "warehouse", "gnelson"], // Admin and
  "dashboard.html": ["admin", "warehouse", "misterAdmin", "sierraTucsonAdmin", "tmcAdmin", "pfcuAdmin", "vwcuAdmin"], // Only admin can access
  "warehouse-page.html": ["admin", "warehouse"], // Admin and warehouse roles
};


// Check user authentication
function checkAuthentication() {
  const userRoles = JSON.parse(sessionStorage.getItem("userRoles") || "[]");
  const currentPage = window.location.pathname.split("/").pop(); // Get the current page name

  // If the user is logged in and they try to access the login page
  if (userRoles.length > 0 && currentPage === "login.html") {
    alert("You are already logged in.");
    const lastPage = sessionStorage.getItem("lastValidPage") || "dashboard.html";
    window.location.href = lastPage;
    return;
  }

  // If no user is logged in and they're trying to access a protected page
  if (userRoles.length === 0 && currentPage !== "login.html") {
    alert("You must be logged in to access this page.");
    window.location.href = "login.html";
  }
}

function checkAuthorization() {
  const userRoles = JSON.parse(sessionStorage.getItem("userRoles") || "[]");
  const currentPage = window.location.pathname.split("/").pop(); // Get the current page name

  // Allow access to login page without checking roles
  if (currentPage === "login.html") {
    return;
  }

  // Get allowed roles for the current page
  const allowedRoles = pagePermissions[currentPage] || [];

  // Check if any of the user's roles are included in the allowed roles
  const isAuthorized = userRoles.some(role => allowedRoles.includes(role));

  if (!isAuthorized) {
    alert("You do not have permission to access this page.");
    const lastPage = sessionStorage.getItem("lastValidPage") || "login.html";
    window.location.href = lastPage;
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
    // Save user's roles and full name
    sessionStorage.setItem("userRoles", JSON.stringify(user.roles));
    sessionStorage.setItem("userFullName", user.fullName);

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
  const userRoles = JSON.parse(sessionStorage.getItem("userRoles") || "[]");
  console.log("User roles from sessionStorage:", userRoles);

  document.querySelectorAll("[data-role]").forEach(item => {
    // Always-visible elements
    if (item.classList.contains("always-visible") || item.getAttribute("data-role") === "public") {
      item.style.display = "";
      return;
    }

    const rolesAllowed = item.getAttribute("data-role")?.split(",").map(role => role.trim()) || [];

    // Check if any of the user's roles match the allowed roles
    const hasAccess = userRoles.some(role => 
      role === "admin" || // Admin sees everything
      rolesAllowed.includes(role)
    );

    item.style.display = hasAccess ? "" : "none";
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
