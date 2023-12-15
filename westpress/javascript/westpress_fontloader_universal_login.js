//Load Figtree Family on Login Page
const googlelink = document.createElement('link');
googlelink.href = 'https://fonts.googleapis.com';
googlelink.rel = 'preconnect';

const googlelink2 = document.createElement('link');
googlelink2.href = 'https://fonts.gstatic.com';
googlelink2.rel = 'preconnect';

const fontlink = document.createElement('link');
fontlink.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap';
fontlink.rel = 'stylesheet';


document.getElementsByTagName('head')[0].appendChild(googlelink);


document.getElementsByTagName('head')[0].appendChild(googlelink2);

document.getElementsByTagName('head')[0].appendChild(fontlink);
