const fs = require('fs');
const path = require('path');

const fixes = [
  { match: /bg-surface dark:bg-slate-900-container-lowest( dark:bg-slate-800)?/g, replace: 'bg-surface-container-lowest dark:bg-slate-800' },
  { match: /bg-surface dark:bg-slate-900-container-low( dark:bg-slate-800)?/g, replace: 'bg-surface-container-low dark:bg-slate-800' },
  { match: /bg-surface dark:bg-slate-900-container-highest( dark:bg-slate-700)?/g, replace: 'bg-surface-container-highest dark:bg-slate-700' },
  { match: /bg-surface dark:bg-slate-900-container-high( dark:bg-slate-700)?/g, replace: 'bg-surface-container-high dark:bg-slate-700' },
  { match: /hover:bg-surface dark:bg-slate-900-container( dark:hover:bg-slate-700)?/g, replace: 'hover:bg-surface-container dark:hover:bg-slate-700' },
  { match: /bg-surface dark:bg-slate-900-container( dark:bg-slate-800)?/g, replace: 'bg-surface-container dark:bg-slate-800' },
  { match: /text-on-surface dark:text-white-variant( dark:text-slate-300)?/g, replace: 'text-on-surface-variant dark:text-slate-300' }
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
        console.log('Fixed: ' + fullPath);
      }
    }
  }
}

const rootDir = path.join(__dirname, 'src', 'app');
processDirectory(rootDir);
console.log('Done fixing dark mode classes.');
