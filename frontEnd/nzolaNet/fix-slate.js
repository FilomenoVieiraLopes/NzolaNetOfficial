const fs = require('fs');
const path = require('path');

const fixes = [
  { match: /\bbg-slate-50\b(?! dark:bg-)/g, replace: 'bg-slate-50 dark:bg-slate-900' },
  { match: /\btext-slate-950\b(?! dark:text-)/g, replace: 'text-slate-950 dark:text-white' },
  { match: /\btext-slate-500\b(?! dark:text-)/g, replace: 'text-slate-500 dark:text-slate-400' },
  { match: /\btext-slate-600\b(?! dark:text-)/g, replace: 'text-slate-600 dark:text-slate-300' },
  { match: /\btext-slate-700\b(?! dark:text-)/g, replace: 'text-slate-700 dark:text-slate-300' },
  { match: /\btext-slate-400\b(?! dark:text-)/g, replace: 'text-slate-400 dark:text-slate-500' },
  { match: /\bborder-slate-200\b(?! dark:border-)/g, replace: 'border-slate-200 dark:border-slate-700' },
  { match: /\bbg-slate-950\b(?! dark:bg-)/g, replace: 'bg-slate-950 dark:bg-slate-800' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      content = content.replace(/class="([^"]+)"/g, (match, classStr) => {
        let newClassStr = classStr;
        for (const rule of fixes) {
          if (rule.match.test(newClassStr)) {
            newClassStr = newClassStr.replace(rule.match, rule.replace);
            modified = true;
          }
        }
        return `class="${newClassStr}"`;
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed slate colors: ' + fullPath);
      }
    }
  }
}

const rootDir = path.join(__dirname, 'src', 'app');
processDirectory(rootDir);
console.log('Done fixing slate colors.');
