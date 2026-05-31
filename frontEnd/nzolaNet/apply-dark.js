const fs = require('fs');
const path = require('path');

const replacements = [
  { match: /\bbg-background\b(?! dark:bg-)/g, replace: 'bg-background dark:bg-slate-900' },
  { match: /\bbg-surface\b(?! dark:bg-)/g, replace: 'bg-surface dark:bg-slate-900' },
  { match: /\bbg-white\b(?! dark:bg-)/g, replace: 'bg-white dark:bg-slate-800' },
  { match: /\bbg-surface-container-lowest\b(?! dark:bg-)/g, replace: 'bg-surface-container-lowest dark:bg-slate-800' },
  { match: /\bbg-surface-container-low\b(?! dark:bg-)/g, replace: 'bg-surface-container-low dark:bg-slate-800' },
  { match: /\bbg-surface-container\b(?!(-| dark:bg-))/g, replace: 'bg-surface-container dark:bg-slate-800' },
  { match: /\bbg-surface-container-high\b(?! dark:bg-)/g, replace: 'bg-surface-container-high dark:bg-slate-700' },
  { match: /\bbg-secondary-container\b(?! dark:bg-)/g, replace: 'bg-secondary-container dark:bg-slate-700/50' },
  { match: /\btext-on-surface\b(?!(-| dark:text-))/g, replace: 'text-on-surface dark:text-white' },
  { match: /\btext-gray-900\b(?! dark:text-)/g, replace: 'text-gray-900 dark:text-white' },
  { match: /\btext-on-surface-variant\b(?! dark:text-)/g, replace: 'text-on-surface-variant dark:text-slate-300' },
  { match: /\btext-secondary\b(?!(-| dark:text-))/g, replace: 'text-secondary dark:text-slate-400' },
  { match: /\btext-gray-600\b(?! dark:text-)/g, replace: 'text-gray-600 dark:text-slate-400' },
  { match: /\btext-gray-700\b(?! dark:text-)/g, replace: 'text-gray-700 dark:text-slate-300' },
  { match: /\bborder-outline-variant\/10\b(?! dark:border-)/g, replace: 'border-outline-variant/10 dark:border-slate-800' },
  { match: /\bborder-outline-variant\/20\b(?! dark:border-)/g, replace: 'border-outline-variant/20 dark:border-slate-800' },
  { match: /\bborder-gray-200\b(?! dark:border-)/g, replace: 'border-gray-200 dark:border-slate-700' },
  { match: /\bhover:bg-surface-container\b(?!(-| dark:hover:bg-))/g, replace: 'hover:bg-surface-container dark:hover:bg-slate-700' },
  { match: /\bhover:bg-gray-50\b(?! dark:hover:bg-)/g, replace: 'hover:bg-gray-50 dark:hover:bg-slate-700' },
  { match: /\bhover:bg-gray-300\b(?! dark:hover:bg-)/g, replace: 'hover:bg-gray-300 dark:hover:bg-slate-600' },
  { match: /\bbg-gray-200\/80\b(?! dark:bg-)/g, replace: 'bg-gray-200/80 dark:bg-slate-700/50' }
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
      
      // Process each class attribute
      content = content.replace(/class="([^"]+)"/g, (match, classStr) => {
        let newClassStr = classStr;
        for (const rule of replacements) {
          if (rule.match.test(newClassStr)) {
            newClassStr = newClassStr.replace(rule.match, rule.replace);
            modified = true;
          }
        }
        return `class="${newClassStr}"`;
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

const rootDir = path.join(__dirname, 'src', 'app');
processDirectory(rootDir);
console.log('Done processing dark mode classes.');
