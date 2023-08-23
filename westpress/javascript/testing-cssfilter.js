var y = window.userId;
var z = document.getElementById("ctl00_ctl08_lblUserName").innerHTML;
var x = document.getElementById("ctl00_ctl08_lblUserName").innerHTML;

//Mister
if (z.includes("Kaleb Badger")){
document.querySelector("link[href='https://westpress.com/MarcomContent/MCW/CSS/MCW_Catalog_v13.css?v=2']").href = "https://wp-marcom.github.io/marcom/mister/css/mister_catalog.css";
  
const boxes = document.getElementsByTagName("div");
boxes[0].classList.remove("gridRow3Cols");

var animation = bodymovin.loadAnimation({
  container: document.getElementById('ctl00_ctl08_lblUserName'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'https://lottie.host/d6baa922-327a-4396-9063-1f101457e9ef/7cBrRDdq3t.json'
})
  
  
}
