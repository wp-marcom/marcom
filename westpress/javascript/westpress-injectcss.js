//Load Custom CSS in HEAD

const csslink = document.createElement('link');
csslink.href = 'https://kalebbadger.github.io/marcom/westpress/css/westpress-cssbase.css';
csslink.rel = 'stylesheet';

document.getElementsByTagName('head')[0].appendChild(csslink);