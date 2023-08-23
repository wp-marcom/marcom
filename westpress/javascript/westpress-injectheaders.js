var userName = document.getElementById("ctl00_ctl08_lblUserName").innerHTML


const scriptlinkdefault = document.createElement('script');
scriptlinkdefault.src = 'nothing-here';
scriptlinkdefault.type = 'text/javascript';
scriptlinkdefault.language = 'javascript';

//Switch loaded font families by username details

const fontlink = document.createElement('link');
fontlink.rel = 'stylesheet';

if (userName!== ""){

    //Mister
    if (userName.includes("Kaleb")){scriptlinkdefault.src = 'nothing-here-either';}
}

else{scriptlinkdefault.src = 'nothing-here';}


//DO NOT TOUCH ANYHING BELOW THIS LINE - SAME FOR ALL.

const googlelink = document.createElement('link');
googlelink.href = 'https://fonts.googleapis.com';
googlelink.rel = 'preconnect';

const googlelink2 = document.createElement('link');
googlelink2.href = 'https://fonts.gstatic.com';
googlelink2.rel = 'preconnect';


document.getElementsByTagName('head')[0].appendChild(scriptlinkdefault);
document.getElementsByTagName('head')[0].appendChild(scriptlinkdefault);
document.getElementsByTagName('head')[0].appendChild(scriptlinkdefault);

