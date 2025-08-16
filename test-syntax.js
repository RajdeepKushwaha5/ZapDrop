// Simple brace counter test
const fs = require('fs');

const content = fs.readFileSync('src/components/FileUploader.tsx', 'utf8');

let openBraces = 0;
let closeBraces = 0;
let openParens = 0;
let closeParens = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') openBraces++;
  if (content[i] === '}') closeBraces++;
  if (content[i] === '(') openParens++;
  if (content[i] === ')') closeParens++;
}

console.log(`Open braces: ${openBraces}`);
console.log(`Close braces: ${closeBraces}`);
console.log(`Open parens: ${openParens}`);
console.log(`Close parens: ${closeParens}`);
console.log(`Brace difference: ${openBraces - closeBraces}`);
console.log(`Paren difference: ${openParens - closeParens}`);
