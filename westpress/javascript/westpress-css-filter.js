var y = window.userId
var z = document.getElementById("ctl00_ctl08_lblUserName").innerHTML
var x = document.getElementById("ctl00_ctl08_lblUserName").innerHTML

//Vantage West
if (z.includes("Vantage")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_catalog_base.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/vwcu_catalog_rebrand.css";}

//Pima Federal
else if (z.includes("Pima Federal")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_catalog_base.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/pfcu_catalog.css";}

//Sierra Tucson
else if (z.includes("Sierra Tucson")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_catalog_base.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/sierratucson_catalog.css";
document.getElementById('ctl00_content_CartShipping_CtlAddressSelector_ctlAddressForm_lblCompany').innerHTML = 'Purchase Order:';
}

//Cochise College
else if (z.includes("Cochise College")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_catalog_base.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/cochisecollege_catalog.css";}

//Cochise County
else if (z.includes("Cochise County")){
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_catalog_base.css']").href = "https://wp-marcom.github.io/marcom/westpress/css/cochisecounty_catalog.css";
}
