'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const parser = require('./parser');
const Serializer = require('./serializer');

class Engine{
  constructor(src){
    this.src = parser.parse(Buffer.from(src));
    this.meta = new Closure(parser.meta());
  }

  run(timeout=10e3){
    var chain = this.src;
    var closure = new Closure(chain);
    var stack = [new StackFrame(closure)];

    var t = Date.now();

    while(stack.length !== 0){
      if(Date.now() - t > timeout)
        throw new Error(`Timeout of ${timeout}ms exceeded`);

      var frame = O.last(stack);

      if(frame.len() === 0){ // The current chain is finished
        if(frame.val === null){ // Meta chain is called
          // When called, meta chain returns itself
          frame.val = this.meta;
          continue;
        }

        // Pop the last stack frame
        stack.pop();

        // If this was not the last chain, put the value on the previous frame
        if(stack.length !== 0)
          O.last(stack).val = frame.val;

        continue;
      }

      // Get the next element from the current closure
      var elem = frame.next();
      var len = frame.len();

      // val - old value, v - new value
      var val = frame.val;
      var v = frame.eval(elem);

      if(v.isMeta()){ // Meta chain
        /**
         * Meta chain is special. Its behavior depends on the
         * situation it appears in. There are 6 different cases
         */

        var next = frame.next();
        var n = frame.eval(next);

        if(val === null){
          if(next === null){        // Case 1: [empty] [empty]
            // Initialize the stack frame with the meta chain
            frame.val = v;
          }else if(next.isIdent()){ // Case 2: [empty] [ident]
            // Output 1
            this.write(1);
            // Evaluate the next element and save it in the frame value
            frame.val = n;
          }else{                    // Case 3: [empty] [chain]
            // Read the next bit
            if(this.read()){
              // If the next bit is 1, call the chain
              call(n, v);
            }else{
              // If the next bit is 0, return the chain
              frame.val = n;
            }
          }
        }else{
          if(next === null){        // Case 4: [value] [empty]
            // Output 0
            this.write(0);
          }else if(next.isIdent()){ // Case 5: [value] [ident]
            // Update the value associated with the given identifier
            frame.set(next.id, val);
          }else{                    // Case 6: [value] [chain]
            // Perform the call in the reversed order
            call(n, val);
          }
        }

        continue;
      }

      if(val === null){ // There is nothing on the current stack frame
        // Initialize the stack frame value
        frame.val = v;
        continue;
      }

      call(val, v);
    }

    // Call the given chain with the given argument
    function call(chain, arg){
      // Create a new stack frame
      var newFrame = chain.call(arg);

      if(O.last(stack).len() === 0){
        /**
         * In case this was the last call from the current chain,
         * replace the current stack frame with the new one
         */

        stack[stack.length - 1] = newFrame;
      }else{ // Otherwise just push the new frame to the stack
        stack.push(newFrame);
      }
    }
  }
};

module.exports = Engine;

class StackFrame{
  constructor(closure, val=null){
    this.closure = closure;
    this.val = val;
  }

  eval(elem){ return this.closure.eval(elem); }
  next(){ return this.closure.next(); }
  len(){ return this.closure.len(); }
  get(ident){ return this.closure.get(ident); }
  set(ident, val){ this.closure.set(ident, val); }

  toString(){
    var {closure} = this;
    var str = this.val !== null ? '[V]' : '[.]';
    str += ' ' + closure;
    str = str.padEnd(50);

    for(var ident in closure.idents){
      ident |= 0;
      var val = this.get(ident);
      if(val === null) continue;
      str += parser.toName(ident) + ': ';
      str += `(${val.toString(1)})`;
      str += ' '.repeat(3);
    }

    return str;
  }
};

class Closure{
  constructor(from, idents=null, arg=null){
    this.elems = from.elems;

    var depth = from.depth;
    this.depth = depth;

    this.idents = O.obj();

    for(var ident in from.idents){
      ident |= 0;

      if(ident <= depth - 2)
        this.idents[ident] = idents[ident];
    }

    if((this.depth - 1) in from.idents)
      this.idents[this.depth - 1] = new Reference(arg);

    this.index = 0;
  }

  call(arg){
    var closure = new Closure(this, this.idents, arg);
    return new StackFrame(closure);
  }

  eval(elem){
    if(elem === null) return null;
    if(elem.isIdent()) return this.get(elem.id);
    return new Closure(elem, this.idents);
  }

  next(){
    if(this.len() === 0) return null;
    return this.elems[this.index++];
  }

  len(){ return this.elems.length - this.index; }
  get(ident){ return this.idents[ident].get(); }
  set(ident, val){ this.idents[ident].set(val); }
  isMeta(){ return this.len() === 0; }

  toString(full=0){
    var elems = this.elems;
    if(!full) elems = elems.slice(this.index);
    return elems.join('');
  }
};

class Reference{
  constructor(val){
    this.val = val;
  }

  get(){ return this.val; }
  set(val){ this.val = val; }
};