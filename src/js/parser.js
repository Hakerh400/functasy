'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const tokenizer = require('./tokenizer');
const {toId, toName} = require('./idents');

class Parser{
  constructor(){
    this.stack = [new Function];
    this.funcs = new Map([[this.stack[0], 0]]);
  }

  add(type, val){
    const {stack, funcs} = this;

    /**
     * Type:
     *   0 - Identifier
     *   1 - Function
     * Value:
     *   For identifier: id
     *   For function:
     *     0 - Function end
     *     1 - Function start
     */

    if(type === 0){ // Identifier
      O.last(stack).push(new Identifier(val, stack.length));

      for(var i = val + 1; i !== stack.length; i++)
        stack[i].addIdent(val);

      return;
    }

    if(val === 0){ // Function end
      var func = stack.pop();
      O.last(stack).push(func);
      return;
    }
    
    // Function start
    var func = new Function(stack.length);
    stack.push(func);
    funcs.set(func, funcs.size);
  }

  finalize(){
    for(var func of this.funcs.keys())
      func.finalize();
  }

  static parse(buf){
    const parser = new Parser;

    for(var {type, val} of tokenizer.tokenize(buf))
      parser.add(type, val);

    parser.finalize();
    return parser.funcs;
  }

  static load(ser){
    return Function.load(ser);
  }
};

module.exports = Parser;

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
    return toName(this.id, this.depth);
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
    if(ident === this.depth - 1)
      this.isArgUsed = 1;
    else
      this.idents.add(ident);
  }

  sortIdents(){ O.sortAsc(this.idents); }
  isIdent(){ return 0; }
  isFunc(){ return 1; }
  isMeta(){ return this.len() === 0; }

  finalize(){
    this.idents = O.sortAsc(Array.from(this.idents));
    return this;
  }

  save(ser=new Serializer){
    const stack = [this.elems.slice()];

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
      if(stack.length !== 1) ser.write(!isIdent); // Write the type of the element

      if(isIdent) // If the element is an identifier
        ser.write(elem.id, stack.length - 2); // Write the identifier's id
      else // If the element is a function
        stack.push(elem.elems.slice()) // Push function's elements to the stack
      
    }

    return ser;
  }

  static load(ser){
    const parser = new Parser;
    const {stack} = parser;

    while(1){
      if(!ser.read()){ // No more elements
        if(stack.length === 1) // Main function is finished
          break;

        parser.add(1, 0); // End of the current function
        continue;
      }

      if(stack.length !== 1 && !ser.read()){ // Identifier
        parser.add(0, ser.read(stack.length - 2)); // Read the identifier's id
        continue;
      }

      parser.add(1, 1); // Start of a new function
    }

    parser.finalize();
    return parser.funcs;
  }

  toString(parens=1, index=0){
    var depth = this.depth + 1;
    var str = '';

    var stack = [this.elems.slice(index)];

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

    if(parens) str = `(${str})`;
    return str;
  }
};