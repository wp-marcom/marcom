var userName = document.getElementById("ctl00_ctl08_lblUserName").innerHTML

//Senior Resource Group
if (userName.includes("Senior Resource Group")){
  
document.querySelector("link[href='https://wp-marcom.github.io/marcom/westpress/css/westpress_multi_custom.css']").href = "https://wp-marcom.github.io/marcom/westpressmarketing/css/srg_multi_custom.css";
}
