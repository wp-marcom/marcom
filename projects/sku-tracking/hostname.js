const os = require('os');

const userInfo = os.userInfo();
const username = userInfo.username;

console.log(`Current username: ${username}`);