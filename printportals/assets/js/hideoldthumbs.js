document.addEventListener("DOMContentLoaded", function () {
    console.log("Script is running!"); // Check if this appears in Console
});

document.addEventListener("DOMContentLoaded", function () {
    // List of image URLs to hide
    const blockedImages = [
        "https://images.printable.com/printonelogos/images/895/5913/folders/2956766/de665160-b21b-4859-88c2-cd85d0131f40.png",
        "https://images.printable.com/some-other-image.jpg"
    ];

    document.querySelectorAll("img").forEach(img => {
        if (blockedImages.includes(img.src)) {
            img.style.display = "none"; // Hide the image
            img.alt = ""; // Remove alt text
        }
    });
});
