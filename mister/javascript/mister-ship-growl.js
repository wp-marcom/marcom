window.onload = function displayGrowl(message) {
    $('.growl-notice').fadeIn().html(message);
    setTimeout(function(){ 
      $('.growl-notice').fadeOut();
    }, 2000);
  }