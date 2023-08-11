var y = window.userId;
var z = document.getElementById("ctl00_ctl08_lblUserName").innerHTML;
var x = document.getElementById("ctl00_ctl08_lblUserName").innerHTML;

//Mister
if (z.includes("Kaleb Badger")){
document.querySelector("link[href='https://westpress.com/MarcomContent/MCW/CSS/MCW_Catalog_v13.css?v=2']").href = "https://wp-marcom.github.io/marcom/mister/css/mister_catalog.css";
  
let a = document.getElementsByClassName( "gridRow3Cols" );
[...a].forEach( x => x.className += " container-fluid" );
[...a].forEach( x => x.classList.remove("gridRow3Cols") );
  
}
