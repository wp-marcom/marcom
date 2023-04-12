var y = window.userId
var z = document.getElementById("ctl00_ctl08_lblUserName").innerHTML
var x = document.getElementById("ctl00_ctl08_lblUserName").innerHTML

//Senior Resource Group
if (z.includes("Mister")){

const googlelink = document.createElement('link');
googlelink.href = 'https://fonts.googleapis.com';
googlelink.rel = 'preconnect';

const googlelink2 = document.createElement('link');
googlelink2.href = 'https://fonts.gstatic.com';
googlelink2.rel = 'preconnect';

const fontlink = document.createElement('link');
fontlink.href = 'https://fonts.googleapis.com/css2?family=Arvo:wght@700&family=Figtree:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';
fontlink.rel = 'stylesheet';


document.getElementsByTagName('head')[0].appendChild(googlelink);


document.getElementsByTagName('head')[0].appendChild(googlelink2);

document.getElementsByTagName('head')[0].appendChild(fontlink);

} 
else if (z.includes("OTHER NAME")){

} 