// Define users array (you can modify or extend this array as needed)
const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "editor", password: "editor123", role: "editor" },
  { username: "guest", password: "guest123", role: "guest" }
];

// Login form submission handler
document.getElementById("loginForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("yourUsername").value;
  const password = document.getElementById("yourPassword").value;

  // Find the user from the users array
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    alert("Login successful!");

    // Save the user role in session storage
    sessionStorage.setItem("userRole", user.role);

    // Redirect to the main page or dashboard
    window.location.href = "index.html";
  } else {
    alert("Invalid credentials. Please try again.");
  }
});
console.log(window.location.pathname);
// On pages that require a user to be logged in (like the dashboard):
if (window.location.pathname !== "/pages-login.html") { // Only check if not on login page
  window.addEventListener("DOMContentLoaded", () => {
    const userRole = sessionStorage.getItem("userRole");

    if (userRole) {
      // Show/Hide menu items based on role
      document.querySelectorAll(".nav-item").forEach(item => {
        const role = item.getAttribute("data-role");

        // Hide elements that don't match the role
        if (role !== userRole && role !== "guest") {
          item.style.display = "none";
        }
      });
    } else {
      // Redirect to login page if no user role
      alert("No user logged in!");
      window.location.href = "pages-login.html"; // Redirect to login if no user role
    }
  });
}
