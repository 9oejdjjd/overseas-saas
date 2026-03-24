const fs = require('fs');
console.log('Copying (dashboard) to dashboard...');
fs.cpSync('src/app/(dashboard)', 'src/app/dashboard', {recursive: true});
console.log('Copying mock to (public)...');
fs.cpSync('src/app/mock', 'src/app/(public)', {recursive: true});
console.log('Done!');
