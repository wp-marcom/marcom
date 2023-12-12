var userName = document.getElementById("ctl00_ctl08_lblUserName").innerHTML

//Senior Resource Group
if (userName.includes("Senior Resource Group")){
  
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpressmarketing/srg/css/srg_multi_custom.css";
}

//OneAZ Credit Union
else if (userName.includes("OneAZ Credit Union")){
  
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpressmarketing/oneaz/css/one_az_multi_custom.css";
}

