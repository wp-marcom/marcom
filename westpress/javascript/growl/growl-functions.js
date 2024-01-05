// Get the modal
var modal = document.getElementById('popupContainer');

var span = document.getElementsByClassName("growl-notification__close-icon")[0];
var body = document.getElementsByClassName("growl-notification__body")[0];

window.onload = function () {
     document.getElementById('popupContainer').style.visibility = "visible";

};

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
    document.getElementById('popupContainer').style.visibility = "hidden";
  }
}
span.onclick = function() {
  modal.style.display = "none";
}

body.onclick = function() {
  modal.style.display = "none";
}
