
// Get the modal

// Get the modal  -the grey shadowy box in the BG
var modal = document.getElementById('growlPopup1');

var closeButt = document.getElementsByClassName("growl-notification__close")[0];
var okayButt = document.getElementsByClassName("growl-notification__button")[0];

var queuePop = document.querySelectorAll('[threedots="Marketing"]')[0];

document.querySelectorAll('[threedots="Marketing"]')[0].addEventListener("click", myFunction);

function myFunction() {
  document.querySelectorAll('[threedots="Marketing"]')[0].innerText = "YOU CLICKED ME!";
}


//window.onload = function () {
//     document.getElementById('popup1').style.visibility = "visible";
//};

queuePop.onclick = function() {
  document.getElementById('growlPopup1').style.visibility = "visible";
}


window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    document.getElementById('growlPopup1').style.visibility = "hidden";
  }
}
closeButt.onclick = function() {
  modal.style.display = "none";
}
okayButt.onclick = function() {
  modal.style.display = "none";
}
