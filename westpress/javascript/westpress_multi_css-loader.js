var userName = document.getElementById("ctl00_ctl08_lblUserName").innerHTML

//Vantage West
if (userName.includes("Vantage")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/vwcu_catalog_rebrand.css";}

//Pima Federal
else if (userName.includes("Pima Federal")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/pfcu_catalog.css";}

//Sierra Tucson
else if (userName.includes("Sierra Tucson")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/sierratucson_catalog.css";
}

//Cochise College
else if (userName.includes("Cochise College")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/cochisecollege_catalog.css";}

//Cochise County
else if (userName.includes("Cochise County")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/cochisecounty_catalog.css";
}

//Flowing Wells Unified School District
else if (userName.includes("FWUSD")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/fwusd_catalog.css";
}
