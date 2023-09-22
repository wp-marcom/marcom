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
sheetScript.type = 'text/javascript';
sheetScript.src = 'https://js-libraries.pages.dev/growl-notification.min.js';

const jqScript = document.createElement('script');
jqScript.type = 'text/javascript';
jqScript.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js';


document.getElementsByTagName('head')[0].appendChild(sheetLinkColor);
document.getElementsByTagName('head')[0].appendChild(sheetLinkDark);
document.getElementsByTagName('head')[0].appendChild(sheetLinkLight);
document.getElementsByTagName('head')[0].appendChild(sheetScript);
document.getElementsByTagName('head')[0].appendChild(jqScript);
