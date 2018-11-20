'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const tokenizer = require('./tokenizer');
const {toId, toName} = require('./idents');

module.exports = {
  parse,
  meta,
};

function parse(buf){
  var chains = [new Chain];

  for(var {type, val} of tokenizer.tokenize(buf)){
    if(type === 0){
      O.last(chains).push(new Identifier(val, chains.length));

      for(var i = val + 1; i !== chains.length; i++)
        chains[i].addIdent(val)

      continue;
    }

    if(val === 1){
      chains.push(new Chain(chains.length));
    }else{
      var chain = chains.pop();
      O.last(chains).push(chain);
    }
  }

  return chains[0];
}

function meta(){
  return new Chain;
}

class Element{
  constructor(){}

  isChain(){ return null; }
};

class Identifier extends Element{
  constructor(id, depth){
    super();

    this.id = id;
    this.depth = depth;
  }

  isIdent(){ return 1; }
  isChain(){ return 0; }
  isMeta(){ return 0; }

  toString(){
    return tokenizer.toName(this.id, this.depth);
  }
};

class Chain extends Element{
  constructor(depth=0, elems=[], idents=O.obj()){
    super();

    this.depth = depth;
    this.elems = elems;
    this.idents = idents;
  }

  len(){ return this.elems.length; }
  push(elem){ this.elems.push(elem); }
  addIdent(ident){ this.idents[ident] = 1; }

  isIdent(){ return 0; }
  isChain(){ return 1; }
  isMeta(){ return this.len() === 0; }

  toString(){
    var depth = this.depth + 1;
    var str = '';

    var stack = [this.elems.slice()];

    while(stack.length !== 0){
      var arr = O.last(stack);

      if(arr.length === 0){
        depth--;
        if(stack.length !== 1) str += ')';
        stack.pop();
        continue;
      }

      var elem = arr.shift();

      if(elem.isIdent()){
        str += toName(elem.id, depth);
        continue;
      }

      depth++;
      str += '(';
      stack.push(elem.elems.slice());
    }

    if(depth !== 0) str = `(${str})`;
    return str;
  }
};