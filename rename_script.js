const fs = require('fs');

try {
    fs.renameSync('src/app/(dashboard)', 'src/app/dashboard');
    console.log('Renamed (dashboard) to dashboard');
} catch (e) {
    console.error('Failed to rename (dashboard):', e.message);
}

try {
    fs.renameSync('src/app/mock', 'src/app/(public)');
    console.log('Renamed mock to (public)');
} catch (e) {
    console.error('Failed to rename mock:', e.message);
}
