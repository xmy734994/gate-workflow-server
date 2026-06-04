/**
 * Post-build script to clean up WeChat miniprogram wxss files
 * Removes Tailwind CSS v4 syntax that WeChat doesn't support
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const appWxssPath = path.join(distPath, 'app.wxss');

if (fs.existsSync(appWxssPath)) {
  let content = fs.readFileSync(appWxssPath, 'utf-8');
  
  // Remove @theme default inline reference{...} blocks
  content = content.replace(/@theme\s+default\s+inline\s+reference\{[\s\S]*?\}/g, '');
  
  // Remove @theme default{...} blocks  
  content = content.replace(/@theme\s+default\{[\s\S]*?\}/g, '');
  
  // Remove @theme inline{...} blocks
  content = content.replace(/@theme\s+inline\{[\s\S]*?\}/g, '');
  
  // Remove @custom-variant directives
  content = content.replace(/@custom-variant\s+[^;]+;/g, '');
  
  // Remove @tailwind directives
  content = content.replace(/@tailwind\s+utilities;?/g, '');
  
  // Clean up multiple consecutive semicolons
  content = content.replace(/;{2,}/g, ';');
  
  // Remove leading/trailing whitespace and clean up dangling characters
  content = content.trim();
  
  // Remove leading } that may be left over from removed blocks
  if (content.startsWith('}')) {
    content = content.substring(1);
  }
  
  fs.writeFileSync(appWxssPath, content);
  console.log('✅ Cleaned app.wxss for WeChat miniprogram compatibility');
  
  // Show first 100 chars to verify
  console.log('First 100 chars:', content.substring(0, 100));
} else {
  console.log('⚠️ app.wxss not found, skipping cleanup');
}
