/**
 * Post-build script to create a clean WeChat miniprogram wxss file
 * Removes all Tailwind CSS v4 syntax and generates compatible CSS
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const appWxssPath = path.join(distPath, 'app.wxss');

// Minimal WeChat-compatible CSS
const minimalWxss = `page {
  height: 100%;
  background-color: #ffffff;
}

page, view, text {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

button, input, textarea {
  font-family: inherit;
}

::-moz-selection {
  background-color: rgba(0, 0, 0, 0.1);
}

::selection {
  background-color: rgba(0, 0, 0, 0.1);
}
`;

if (fs.existsSync(appWxssPath)) {
  // Replace with minimal compatible CSS
  fs.writeFileSync(appWxssPath, minimalWxss);
  console.log('✅ Replaced app.wxss with WeChat-compatible styles');
} else {
  console.log('⚠️ app.wxss not found, creating new one');
  fs.writeFileSync(appWxssPath, minimalWxss);
}
