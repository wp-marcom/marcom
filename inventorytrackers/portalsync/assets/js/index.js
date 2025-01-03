window.addEventListener("DOMContentLoaded", () => {
    const userRole = sessionStorage.getItem("userRole");
    console.log("User role from sessionStorage:", userRole);

    document.querySelectorAll(".nav-item").forEach(item => {
        const role = item.getAttribute("data-role");
        if (role && role !== userRole && role !== "guest") {
            item.style.display = "none"; // Hide items not allowed for this role
        } else {
            item.style.display = ""; // Show allowed items (default display)
        }
    });
});
