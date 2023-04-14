var y = window.userId
var z = document.getElementById("ctl00_ctl08_lblUserName").innerHTML
var x = document.getElementById("ctl00_ctl08_lblUserName").innerHTML

//Vantage West
if (z.includes("Vantage")){
document.querySelector("link[href='https://kalebbadger.github.io/marcom/westpress/css/westpress-cssbase.css']").href = "https://kalebbadger.github.io/marcom/westpress/css/vwcu-catalog.css";}

//Pima Federal
else if (z.includes("Pima Federal")){
document.querySelector("link[href='https://kalebbadger.github.io/marcom/westpress/css/westpress-cssbase.css']").href = "https://westpress.com/MarcomContent/WestPress/CSS/PFCUs_Catalog.css?v=1";}

//Sierra Tucson
else if (z.includes("Sierra Tucson")){
document.querySelector("link[href='https://kalebbadger.github.io/marcom/westpress/css/westpress-cssbase.css']").href = "https://westpress.com/MarcomContent/WestPress/CSS/SIET_Catalog.css?v=1";}

//Cochise College
else if (z.includes("Cochise College")){
document.querySelector("link[href='https://kalebbadger.github.io/marcom/westpress/css/westpress-cssbase.css']").href = "https://westpress.com/MarcomContent/WestPress/CSS/CochiseCollege_Catalog.css?v=1";}

//Cochise County
else if (z.includes("Cochise County")){
document.querySelector("link[href='https://kalebbadger.github.io/marcom/westpress/css/westpress-cssbase.css']").href = "https://westpress.com/MarcomContent/WestPress/CSS/CochiseCounty_Catalog.css?v=2";
}

//Senior Resource Group
else if (z.includes("Senior Resource Group")){
document.querySelector("link[href='https://kalebbadger.github.io/marcom/westpress/css/westpress-cssbase.css']").href = "https://westpress.com/MarcomContent/WestPressMarketingPromo/CSS/SRG_Catalog.css?v=39";
}
