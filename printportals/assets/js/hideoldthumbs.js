(function() {
    // Wait for the DOM to be fully loaded before running the code
    document.addEventListener("DOMContentLoaded", function() {
        // Example company value (this could be dynamically set based on login data)
        var company = "company1";
        
        // Log to verify that the script is running
        console.log("Setting company to:", company);

        // Set the data-company attribute on the body element
        document.body.setAttribute("data-company", company);

        // Log to verify that the attribute is set
        console.log("data-company attribute set to:", document.body.getAttribute("data-company"));
    });
})();
