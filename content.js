console.log("Nagi loaded");

const banner = document.createElement("div");
banner.textContent = "Nagi is running";
banner.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999999;
  background: red;
  color: white;
  padding: 4px 10px;
  font: 14px sans-serif;
`;
document.body.appendChild(banner);