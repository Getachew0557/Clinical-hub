import { existsSync } from 'fs';
import { resolve } from 'path';

const p = resolve('./src/config/database.js');
console.log('Path:', p);
console.log('Exists:', existsSync(p));

import('./src/config/database.js').then(m => {
    console.log('Import successful');
}).catch(err => {
    console.error('Import failed:', err);
});
