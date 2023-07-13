var userName = document.getElementById("ctl00_ctl08_lblUserName").innerHTML


const fontlinkdefault = document.createElement('link');
fontlinkdefault.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap';
fontlinkdefault.rel = 'stylesheet';

//Switch loaded font families by username details

const fontlink = document.createElement('link');
fontlink.rel = 'stylesheet';

if (userName!== ""){

    //Vantage West
    if (userName.includes("Vantage")){fontlink.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap';}

    //Pima Federal
    else if (userName.includes("Pima Federal")){fontlink.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap';}

    //Sierra Tucson
    else if (userName.includes("Sierra Tucson")){fontlink.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap';}

    //Cochise College
    else if (userName.includes("Cochise College")){fontlink.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap';}

    //Cochise County
    else if (userName.includes("Cochise County")){fontlink.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap';}

    //Senior Resource Group
    else if (userName.includes("Senior Resource Group")){fontlink.href = 'https://fonts.googleapis.com/css2?family=Arvo:wght@700&family=Figtree:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';}

    else{fontlink.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap';}
}

else{fontlink.href = 'https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap';}


//DO NOT TOUCH ANYHING BELOW THIS LINE - SAME FOR ALL.

const googlelink = document.createElement('link');
googlelink.href = 'https://fonts.googleapis.com';
googlelink.rel = 'preconnect';

const googlelink2 = document.createElement('link');
googlelink2.href = 'https://fonts.gstatic.com';
googlelink2.rel = 'preconnect';


document.getElementsByTagName('head')[0].appendChild(googlelink);
document.getElementsByTagName('head')[0].appendChild(googlelink2);
document.getElementsByTagName('head')[0].appendChild(fontlink);

