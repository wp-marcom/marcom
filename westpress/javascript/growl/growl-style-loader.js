//Load CSS and JS for Growl Notifications
const sheetLinkColor = document.createElement('link');
sheetLinkColor.href = 'https://wp-marcom.github.io/marcom/westpress/css/growl/colored-theme.min.css';
sheetLinkColor.rel = 'stylesheet';

const sheetLinkDark = document.createElement('link');
sheetLinkDark.href = 'https://wp-marcom.github.io/marcom/westpress/css/growl/dark-theme.min.css';
sheetLinkDark.rel = 'stylesheet';

const sheetLinkLight = document.createElement('link');
sheetLinkLight.href = 'https://wp-marcom.github.io/marcom/westpress/css/growl/light-theme.min.css';
sheetLinkLight.rel = 'stylesheet';

const sheetScript = document.createElement('script');
sheetLinkLight.type = 'text/javascript';
sheetLinkLight.src = 'https://wp-marcom.github.io/marcom/westpress/javascript/growl/growl-notification.min.js';


document.getElementsByTagName('head')[0].appendChild(sheetLinkColor);
document.getElementsByTagName('head')[0].appendChild(sheetLinkDark);
document.getElementsByTagName('head')[0].appendChild(sheetLinkLight);
document.getElementsByTagName('head')[0].appendChild(sheetScript);
