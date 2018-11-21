'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const tokenizer = require('./tokenizer');
const {toId, toName} = require('./idents');

module.exports = {
  parse,
};

function parse(buf){
  var funcs = [new Function];
  var funcsSet = new Set(funcs);

  for(var {type, val} of tokenizer.tokenize(buf)){
    if(type === 0){
      O.last(funcs).push(new Identifier(val, funcs.length));

      for(var i = val + 1; i !== funcs.length; i++)
        funcs[i].addIdent(val);

      continue;
    }

    if(val === 1){
      var func = new Function(funcs.length);
      funcs.push(func);
      funcsSet.add(func);
    }else{
      var func = funcs.pop();
      O.last(funcs).push(func);
    }
  }

  for(var func of funcsSet)
    func.finalize();

  return funcs[0];
}

class Element{
  constructor(){}

  isIdent(){ return 0; }
  isFunc(){ return 0; }
  isMeta(){ return 0; }
};

class Identifier extends Element{
  constructor(id, depth){
    super();

    this.id = id;
    this.depth = depth;
  }

  isIdent(){ return 1; }
  isFunc(){ return 0; }
  isMeta(){ return 0; }

  toString(){
    return tokenizer.toName(this.id, this.depth);
  }
};

class Function extends Element{
  constructor(depth=0, elems=[], idents=new Set){
    super();

    this.depth = depth;
    this.elems = elems;
    this.idents = idents;

    this.isArgUsed = 0;
  }

  len(){ return this.elems.length; }
  push(elem){ this.elems.push(elem); }

  addIdent(ident){
    this.idents.add(ident);
    if(ident === this.depth - 1)
      this.isArgUsed = 1;
  }

  sortIdents(){ O.sortAsc(this.idents); }
  isIdent(){ return 0; }
  isFunc(){ return 1; }
  isMeta(){ return this.len() === 0; }

  finalize(){
    this.idents = O.sortAsc(Array.from(this.idents));
    return this;
  }

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