'use strict';

const fs = require('fs');
const path = require('path');
const O = require('./framework');
const {toId, toName} = require('./idents');

const LOG_STR = 1;

const cwd = __dirname;
const headerFile = path.join(cwd, 'header.txt');

const header = fs.readFileSync(headerFile, 'utf8');

module.exports = preproc;

function preproc(buf){
  var str = Array.from(buf)
    .map(byte => O.sfcc(byte))
    .join('');

  str = O.sanl(str).join('\n')
    .replace(/\b0\b/g, ' #0 ')
    .replace(/\b1\b/g, ' #1 ')
    .replace(/\bmore\b/g, ' #2 ')
    .replace(/\bread\b/g, ' #3 ')
    .replace(/\bwrite\b/g, ' #4 ')
    .replace(/\[\s*\]/g, ' ')
    .replace(/}/g, ';}')
    .replace(/(?:;\s*)+/g, a => {
      var index = a.lastIndexOf(';');
      return a.replace(/;/g, (a, i) => {
          if(i !== index) return '';
          return ';';
        }).replace(/[^;\n]/g, '');
    });

  while(1){
    var match = str.match(/\bvar ([0-9a-zA-Z]+)\b/);
    if(match === null) break;

    var {index} = match;
    var ident = match[1];

    for(var i = index, d = 0; i !== str.length; i++){
      var c = str[i];
      if(c === '(' || c === '{') d++;
      else if(c === ')' || c === '}') d--;
      if(d === -1) break;
    }

    str = `${str.slice(0, i)}}()${str.slice(i)}`;

    for(var i = index, d = 0; i !== 0; i--){
      var c = str[i];
      if(c === '(' || c === '{') d--;
      else if(c === ')' || c === '}') d++;
      if(d === -1) break;
    }

    if(i !== 0) i++;
    str = `${str.slice(0, index)}${str.slice(index + 4)}`;
    str = `${str.slice(0, i)}[${ident}]{${str.slice(i)}`;
  }

  while(1){
    var match = str.match(/\[[^\]]*\]/);
    if(match === null) break;

    var {index} = match;
    var idents = match[0].match(/[0-9a-zA-Z_]+/g);
    var depth = 10;
    var d = 0;

    for(var i = 0; i !== str.length; i++){
      var c = str[i];
      if(i === index) d = depth;
      if(c === '(' || c === '{') depth++;
      else if(c === ')' || c === '}') depth--;
      if(depth === d && c === '}') break;
    }

    var s = str.slice(index + match[0].length, i)
      .replace(/[0-9a-zA-Z_]+/g, a => {
        var i = idents.indexOf(a);
        if(i === -1) return a;
        return `${a}_${d + i}`;
      });

    str = str.slice(0, index) + '{'.repeat(idents.length - 1) +
          s + '}'.repeat(idents.length - 1) +
          str.slice(i);
  };

  str = str
    .replace(/\s*\,\s*/g, ')(')
    .replace(/[0-9a-zA-Z_]+_(\d+)/g, (a, b) => ` #${toName(b | 0)} `);

  while(1){
    var match = str.match(/[#@]([0-9a-zA-Z])\s*=\s*/);
    if(match === null) break;

    var {index} = match;
    var ident = match[1];
    var depth = 0;

    for(var i = index; i !== str.length; i++){
      var c = str[i];
      if(c === '(' || c === '{') depth++;
      else if(c === ')' || c === '}') depth--;
      else if(c === ';' && depth === 0) break;
    }

    str = `${str.slice(0, i)} #9 ${ident}${str.slice(i)}`;
    str = `${str.slice(0, index)}${str.slice(index + match[0].length)}`;
  };

  str = str
    .replace(/\(\s*\)/g, '#0 ')
    .replace(/;}/g, '}')
    .replace(/;/g, '#9{#8}')
    .replace(/{\s*}/g, '#0 ');

  while(1){
    var match = str.match(/\(/);
    if(match === null) break;

    var {index} = match;
    var depth = 0;
    var s = '';

    for(var i = index + 1; i !== str.length; i++){
      var c = str[i];
      if(c === ')' || c === '}') depth--;
      if(depth === 0) s += c;
      if(c === '(' || c === '{') depth++;
      if(depth === -1) break;
    }

    var b = !s.includes('=') && (s.match(/[({#]/g) || []).length > 1;

    str = str.slice(0, index) + (b ? '<' : '') +
          str.slice(index + 1, i) + (b ? '>' : '') +
          str.slice(i + 1);
  }

  str = str
    .replace(/</g, '(')
    .replace(/>/g, ')');

  do{
    var prev = str;
    str = str.replace(/\(([^\)]*)\)/g, (a, b) => `#9{#7@0}{${b}}`);
  }while(str !== prev);

  str = str
    .replace(/\{/g, '(')
    .replace(/\}/g, ')');

  var depth = 10;
  var depths = O.ca(str.length, i => {
    if(str[i] === '(') depth++;
    else if(depth !== 0 && str[i] === ')') depth--;
    return depth;
  });

  str = str.replace(/([#@])([0-9a-zA-Z]+)/g, (a, b, c, i) => {
    var id = toId(c);
    if(b === '@') id = depths[i] - id - 1;
    return toName(id);
  });

  var depth = 0;
  str = O.sanl(str)
    .map(line => {
      prev = depth;
      depth += Math.sign((line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length);
      if(depth < 0) depth = 0;
      return ' '.repeat(Math.min(prev, depth) << 1) + line.replace(/\s+/g, '');
    }).join('\n');

  if(LOG_STR) log(str);
  str = header.replace(/#/m, str);

  return Buffer.from(str);
}