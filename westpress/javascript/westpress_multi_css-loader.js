var userName = document.getElementById("ctl00_ctl08_lblUserName").innerHTML

//Vantage West
if (userName.includes("Vantage")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/vwcu/css/vwcu_multi_custom.css";}

//Pima Federal
else if (userName.includes("Pima Federal")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/pfcu/css/pfcu_multi_custom.css";}

//Sierra Tucson
else if (userName.includes("Sierra Tucson")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/siet/css/siet_multi_custom.css";
}

//Cochise College
else if (userName.includes("Cochise College")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/cochisecollege/css/cochisecollege_multi_custom.css";}

//Cochise County
else if (userName.includes("Cochise County")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/cochisecounty/css/cochisecounty_multi_custom.css";
}

//Flowing Wells Unified School District
else if (userName.includes("FWUSD")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/fwusd/css/fwusd_multi_custom.css";
}

//Family Life
else if (userName.includes("Intentional Life Media")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpressmarketing/familylife/css/familylife_multi_custom.css";
}

//Senior Resource Group
else if (userName.includes("Senior Resource Group")){
  
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpressmarketing/srg/css/srg_multi_custom.css";
}

//OneAZ Credit Union
else if (userName.includes("OneAZ Credit Union")){
  
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpressmarketing/oneaz/css/one_az_multi_custom.css";
}
