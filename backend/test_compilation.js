const fs = require('fs');
const path = require('path');
const vm = require('vm');

function checkJSFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'tests') {
                checkJSFiles(fullPath);
            }
        } else if (file.endsWith('.js')) {
            try {
                const code = fs.readFileSync(fullPath, 'utf8');
                new vm.Script(code);
            } catch (e) {
                console.error(`SYNTAX ERROR in ${fullPath}:`);
                console.error(e.message);
                process.exit(1);
            }
        }
    }
}
try {
    checkJSFiles(__dirname);
    console.log("ALL BACKEND FILES COMPILED SUCCESSFULLY.");
} catch (e) {
    console.error(e);
}
