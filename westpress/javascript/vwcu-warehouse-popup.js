var y = window.userId
var z = document.getElementById("ctl00_ctl08_lblUserName").innerHTML
var x = document.getElementById("ctl00_ctl08_lblUserName").innerHTML

//Vantage West
if (z.includes("Vantage")){

// Get the modal
var modal = document.getElementById('popup1');

var span = document.getElementsByClassName("close")[0];

window.onload = function () {
     document.getElementById('popup1').style.visibility = "visible";
};

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    document.getElementById('popup1').style.visibility = "hidden";
  }
}
span.onclick = function() {
  modal.style.display = "none";
}


} else if (z.includes("Pima Federal")){
document.querySelector("link[href='https://westpress.com/MarcomContent/WestPress/CSS/WestPress_Generic_Catalog.css?v=1']").href = "https://westpress.com/MarcomContent/WestPress/CSS/PFCUs_Catalog.css?v=1";
} else if (z.includes("Sierra Tucson")){
document.querySelector("link[href='https://westpress.com/MarcomContent/WestPress/CSS/WestPress_Generic_Catalog.css?v=1']").href = "https://westpress.com/MarcomContent/WestPress/CSS/SIET_Catalog.css?v=1";
} else if (z.includes("Cochise College")){
document.querySelector("link[href='https://westpress.com/MarcomContent/WestPress/CSS/WestPress_Generic_Catalog.css?v=1']").href = "https://westpress.com/MarcomContent/WestPress/CSS/CochiseCollege_Catalog.css?v=1";
}else if (z.includes("Cochise County")){
document.querySelector("link[href='https://westpress.com/MarcomContent/WestPress/CSS/WestPress_Generic_Catalog.css?v=1']").href = "https://westpress.com/MarcomContent/WestPress/CSS/CochiseCounty_Catalog.css?v=2";
}