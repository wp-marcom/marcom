const rolePermissions = {
  admin: ["admin", "warehouse", "mister", "tmc"], // Admin sees everything
  warehouse: ["warehouse", "lprice", "molson"], // Sees everything except "admin"
  lprice: ["lprice"], // Sees only what’s assigned to "mister"
  molson: ["molson"], // Sees only what’s assigned to "tmc"
};


window.addEventListener("DOMContentLoaded", () => {
  const userRole = sessionStorage.getItem("userRole");
  console.log("User role from sessionStorage:", userRole);

  document.querySelectorAll(".nav-item").forEach(item => {
    const rolesAllowed = item.getAttribute("data-role")?.split(",") || [];
    if (
      userRole === "admin" || // Admin sees everything
      (rolePermissions[userRole] && rolePermissions[userRole].some(role => rolesAllowed.includes(role)))
    ) {
      item.style.display = ""; // Show item
    } else {
      item.style.display = "none"; // Hide item
    }
  });
});

