'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const tokenizer = require('./tokenizer');
const {toId, toName} = require('./idents');

module.exports = {
  parse,
  serialize,
  deserialize,
};

function parse(buf){
  var stack = [new Function];
  var funcs = new Map([[stack[0], 0]]);

  for(var {type, val} of tokenizer.tokenize(buf)){
    if(type === 0){
      O.last(stack).push(new Identifier(val, stack.length));

      for(var i = val + 2; i !== stack.length; i++)
        stack[i].addIdent(val);

      continue;
    }

    if(val === 0){
      var func = stack.pop();
      O.last(stack).push(func);
      continue;
    }
    
    var func = new Function(stack.length);
    stack.push(func);
    funcs.set(func, funcs.size);
  }

  for(var func of funcs.keys())
    func.finalize();

  return funcs;
}

function serialize(ser, func){
  var stack = [func.elems.slice()];

  while(stack.length !== 0){
    var frame = O.last(stack);

    if(frame.length === 0){
      ser.write(0); // No more elements
      stack.pop();
      continue;
    }

    var elem = frame.shift();
    ser.write(1); // Another element

    var isIdent = elem.isIdent(); // Check if the element is an identifier
    if(stack.length !== 1) ser.write(!isIdent); // Save the type of the element

    if(isIdent){ // If the element is an identifier
      ser.write(elem.id, stack.length - 2); // Save the identifier's id
    }else{ // If the element is a function
      stack.push(elem.elems.slice()) // Push function's elements to the stack
    }
  }

  return ser;
}

function deserialize(ser){
  return ser;
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