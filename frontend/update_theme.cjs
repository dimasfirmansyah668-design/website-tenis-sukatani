const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace fonts
css = css.replace(/'Space Grotesk', sans-serif/g, "'Inter', sans-serif");

// Replace gradients
css = css.replace(/linear-gradient\(135deg, var\(--color-primary\), var\(--color-primary-dark\)\)/g, 'var(--color-primary)');
css = css.replace(/linear-gradient\(135deg, #059669, #34d399\)/g, '#059669');
css = css.replace(/linear-gradient\(135deg, #dc2626, #f87171\)/g, '#ef4444');
css = css.replace(/radial-gradient\([^)]+\)/g, 'transparent');

// Replace dark cyan/purple glows with subtle shadows or lighter colors
css = css.replace(/rgba\(56,189,248/g, 'rgba(5,150,105'); // Swap cyan to emerald primary
css = css.replace(/rgba\(167,139,250/g, 'rgba(14,165,233'); // Swap purple to sky blue

// Replace white/dark alpha borders suitable for light theme
css = css.replace(/rgba\(255,255,255,0\.0[0-9]\)/g, 'rgba(0,0,0,0.05)');
css = css.replace(/rgba\(255,255,255,0\.[1-9]\)/g, 'rgba(0,0,0,0.1)');

// Replace modal background to be lighter
css = css.replace(/rgba\(0,0,0,0\.75\)/g, 'rgba(0,0,0,0.4)');
css = css.replace(/rgba\(0,0,0,0\.6\)/g, 'rgba(0,0,0,0.4)'); // sidebar overlay

// Replace shadow glow values
css = css.replace(/box-shadow: 0 0 10px rgba\([^)]+\)/g, 'box-shadow: var(--shadow-sm)');
css = css.replace(/box-shadow: 0 0 18px rgba\([^)]+\)/g, 'box-shadow: var(--shadow-md)');
css = css.replace(/box-shadow: 0 4px 14px rgba\([^)]+\)/g, 'box-shadow: var(--shadow-sm)');
css = css.replace(/box-shadow: 0 6px 22px rgba\([^)]+\)/g, 'box-shadow: var(--shadow-md)');
css = css.replace(/box-shadow: 0 8px 28px rgba\([^)]+\)/g, 'box-shadow: var(--shadow-md)');

// In light themes, text is dark, so replace #fff in selected states with #ffffff (or let it be since #fff on primary green is fine)

// Save
fs.writeFileSync(cssPath, css);
console.log('CSS updated successfully.');
