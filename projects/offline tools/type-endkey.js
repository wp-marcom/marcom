const robot = require('robotjs');

// Function to press End key repeatedly
function pressEndRepeatedly(times, delayMs = 100) {
    for (let i = 0; i < times; i++) {
        robot.keyTap('end');
        robot.setKeyboardDelay(delayMs); // Optional: add delay between presses
    }
}

// Give a delay to switch to the desired window before the script starts
setTimeout(() => {
    pressEndRepeatedly(100); // Press End 10 times
}, 5000); // 5 seconds delay