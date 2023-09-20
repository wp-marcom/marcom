
// Get the modal
var modal = document.getElementById('popup1');

var span = document.getElementsByClassName("close")[0];

window.onload = function () {
document.getElementById('popup1').style.visibility = "visible";
};

    setTimeout(function(){ 
    document.getElementById("popup1").style.display= "none"
   }, 3000);


window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    document.getElementById('popup1').style.visibility = "hidden";
  }
}
span.onclick = function() {
  modal.style.display = "none";
}
