var div = document.createElement("div");
div.style.width = "100px";
div.style.height = "100px";
div.style.background = "red";
div.style.color = "white";
div.innerHTML = "Hello";

document.getElementById("ctl00_content_CtlCatalogGrid_CtlCatalogItemRepeater_ctl00_CatalogGridRow_divGridRow").appendChild(div);
