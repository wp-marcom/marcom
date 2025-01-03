const rolePermissions = {
  admin: ["admin", "warehouse", "mister", "tmc"], // Admin sees everything
  warehouse: ["warehouse", "lprice", "molson"], // Sees everything except "admin"
  lprice: ["lprice"], // Sees only what’s assigned to "mister"
  molson: ["molson"], // Sees only what’s assigned to "tmc"
};


window.addEventListener("DOMContentLoaded", () => {
  const userRole = sessionStorage.getItem("userRole");
  console.log("User role from sessionStorage:", userRole);

  document.querySelectorAll("[data-role]").forEach(item => {
  if (item.classList.contains("always-visible") || item.getAttribute("data-role") === "public") {
    item.style.display = ""; // Always visible
    return; // Skip further processing
  }

  const rolesAllowed = item.getAttribute("data-role")?.split(",") || [];
  if (
    userRole === "admin" || 
    (rolePermissions[userRole] && rolePermissions[userRole].some(role => rolesAllowed.includes(role)))
  ) {
    item.style.display = ""; // Show item
  } else {
    item.style.display = "none"; // Hide item
  }
});

});

