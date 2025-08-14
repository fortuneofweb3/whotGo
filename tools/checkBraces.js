const fs = require('fs');

const file = process.argv[2] || 'src/App.jsx';
const src = fs.readFileSync(file, 'utf8');

function posToLineCol(s, pos) {
  const upTo = s.slice(0, pos);
  const lines = upTo.split(/\n/);
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

let inLineComment = false;
let inBlockComment = false;
let inSingle = false;
let inDouble = false;
let inBacktick = false;
let tplDepth = 0;

let depth = 0; // global brace depth
let firstNeg = -1;

for (let i = 0; i < src.length; i++) {
  const ch = src[i];
  const prev = src[i - 1];

  if (inLineComment) {
    if (ch === '\n') inLineComment = false;
    continue;
  }
  if (inBlockComment) {
    if (prev === '*' && ch === '/') inBlockComment = false;
    continue;
  }

  if (!inSingle && !inDouble && !inBacktick) {
    if (prev === '/' && ch === '/') { inLineComment = true; continue; }
    if (prev === '/' && ch === '*') { inBlockComment = true; continue; }
  }

  if (inSingle) { if (ch === '\'' && prev !== '\\') inSingle = false; continue; }
  if (inDouble) { if (ch === '"' && prev !== '\\') inDouble = false; continue; }

  if (!inBacktick) {
    if (ch === '\'' && prev !== '\\') { inSingle = true; continue; }
    if (ch === '"' && prev !== '\\') { inDouble = true; continue; }
  }

  if (ch === '`' && !inSingle && !inDouble) {
    if (!(inBacktick && prev === '\\')) {
      inBacktick = !inBacktick;
      if (inBacktick) tplDepth = 0;
      continue;
    }
  }

  if (inBacktick) {
    if (ch === '{' && prev === '$') { tplDepth++; continue; }
    if (ch === '}' && tplDepth > 0) { tplDepth--; continue; }
    continue;
  }

  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth < 0 && firstNeg === -1) firstNeg = i;
  }
}

console.log('Global brace depth at EOF:', depth);
if (firstNeg !== -1) {
  const lc = posToLineCol(src, firstNeg);
  console.log('First negative brace at pos', firstNeg, 'line', lc.line, 'col', lc.col);
}

// Now find where App closes
const appStart = src.indexOf('const App = () => {');
if (appStart !== -1) {
  let j = appStart;
  let d = 0;
  inLineComment = inBlockComment = inSingle = inDouble = inBacktick = false;
  tplDepth = 0;
  for (; j < src.length; j++) {
    const ch = src[j];
    const prev = src[j - 1];

    if (inLineComment) { if (ch === '\n') inLineComment = false; continue; }
    if (inBlockComment) { if (prev === '*' && ch === '/') inBlockComment = false; continue; }
    if (!inSingle && !inDouble && !inBacktick) {
      if (prev === '/' && ch === '/') { inLineComment = true; continue; }
      if (prev === '/' && ch === '*') { inBlockComment = true; continue; }
    }
    if (inSingle) { if (ch === '\'' && prev !== '\\') inSingle = false; continue; }
    if (inDouble) { if (ch === '"' && prev !== '\\') inDouble = false; continue; }
    if (!inBacktick) {
      if (ch === '\'' && prev !== '\\') { inSingle = true; continue; }
      if (ch === '"' && prev !== '\\') { inDouble = true; continue; }
    }
    if (ch === '`' && !inSingle && !inDouble) {
      if (!(inBacktick && prev === '\\')) { inBacktick = !inBacktick; if (inBacktick) tplDepth = 0; continue; }
    }
    if (inBacktick) {
      if (ch === '{' && prev === '$') { tplDepth++; continue; }
      if (ch === '}' && tplDepth > 0) { tplDepth--; continue; }
      continue;
    }
    if (ch === '{') d++;
    else if (ch === '}') { d--; if (d === 0) { const lc = posToLineCol(src, j); console.log('App closes at line', lc.line, 'col', lc.col, 'pos', j); break; } }
  }
}


