window.addEventListener("DOMContentLoaded", () => {
    const userRole = sessionStorage.getItem("userRole");
    console.log("User role from sessionStorage:", userRole);

    document.querySelectorAll(".nav-item").forEach(item => {
        const rolesAllowed = item.getAttribute("data-role")?.split(",") || [];
        if (rolesAllowed.includes(userRole) || userRole === "admin") {
            item.style.display = ""; // Show item
        } else {
            item.style.display = "none"; // Hide item
        }
    });
});
