'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const {toId, toName} = require('./idents');

const WHITESPACE_CHARS = [0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x20, 0xA0];

module.exports = {
  tokenize,
};

function tokenize(buf){
  var tokens = [];

  for(var token of iter(buf))
    tokens.push(token);

  return tokens;
}

class Token{
  constructor(type, val, depth=null){
    this.type = type;
    this.val = val;
    this.depth = depth;
  }

  toString(){
    if(this.type === 0)
      return this.val === 1 ? '(' : ')';
    return toName(this.val, this.depth);
  }
};

function *iter(buf){
  var depth = 0;
  var line = '';
  var pos = 0;

  for(var i = 0; i !== buf.length; i++){
    var byte = buf[i];
    var char = O.sfcc(byte);

    if(byte === 0x0A || byte === 0x0D){
      line = '';
      pos = 0;
    }else{
      line += char;
      pos++;
    }

    if(WHITESPACE_CHARS.includes(byte)) continue;

    if(char === '('){
      depth++;
      yield new Token(1, 1);
      continue;
    }

    if(char === ')'){
      if(depth === 0) err('Unmatched parenthese');
      depth--;
      yield new Token(1, 0);
      continue;
    }

    if(/[0-9a-zA-Z]/.test(char)){
      var firstMax = 0;
      var len = 0;

      for(var d = depth; d !== 0; d = d / 62 | 0){
        firstMax = d;
        len++;
      }

      var ident = char;
      var line1 = line;
      var pos1 = pos;

      for(var j = i + 1; ident.length < len && j < buf.length; j++){
        var b = buf[j];
        var c = O.sfcc(b);

        if(b === 0x0A || b === 0x0D){
          line1 = '';
          pos1 = 0;
        }else{
          line1 += c;
          pos1++;
        }

        if(WHITESPACE_CHARS.includes(b)) continue;
        if(!/[0-9a-zA-Z]/.test(c)) break;

        ident += c;
      }

      var id = toId(ident);
      if(id >= depth) err('This identifier cannot be used here');

      i = j - 1;
      line = line1;
      pos = pos1;

      yield new Token(0, id, depth);
      continue;
    }

    err('Illegal token');
  }

  if(depth !== 0) err('Unexpected end of input');

  function err(msg){
    if(pos !== 0){
      pos--;

      for(var j = i + 1; j < buf.length; j++){
        var byte = buf[j];
        var char = O.sfcc(byte);

        if(byte === 0x0A || byte === 0x0D) break;
        line += char;
      }
    }

    error(`${line}\n${' '.repeat(pos)}^\n\nSyntaxError: ${msg}`);
  }
}

function error(msg){
  throw new SyntaxError(`\n${msg}`);
}