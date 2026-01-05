const primeDirectory = "C:\\projects\\";
const robot = require(`${primeDirectory}node_modules\\robotjs`);

console.log('Move your mouse to where you want to click...');
console.log('Press Ctrl+C to stop');
console.log('');

setInterval(() => {
  const mouse = robot.getMousePos();
  console.log(`Current mouse position - X: ${mouse.x}, Y: ${mouse.y}`);
}, 1000);