'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const parser = require('./parser');
const Serializer = require('./serializer');

class Engine{
  constructor(src){
    var func = parser.parse(Buffer.from(src));
    this.stack = [new StackFrame(func)];
  }

  run(ticksNum=null){
    const {stack} = this;

    while(stack.length !== 0){
      if(ticksNum !== null && --ticksNum < 0) return 0;
      var frame = O.last(stack);

      if(frame.len() === 0){ // The current function is finished
        if(frame.val === null){ // Meta function is called
          // When called, meta function returns itself
          frame.val = new Closure(frame.func);
          continue;
        }

        // Pop the last stack frame
        stack.pop();

        // If this was not the last function, put the value on the previous frame
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

      if(v.isMeta()){ // Meta function
        /**
         * Meta function is special. Its behavior depends on the
         * situation it appears in. There are 6 different cases
         */

        var next = frame.next();
        var n = frame.eval(next);

        if(val === null){
          if(next === null){        // Case 1: [empty] [empty]
            // Initialize the stack frame with the meta function
            frame.val = v;
          }else if(next.isIdent()){ // Case 2: [empty] [ident]
            // Output 1
            this.write(1);
            // Evaluate the next element and save it in the frame value
            frame.val = n;
          }else{                    // Case 3: [empty] [function]
            // Read the next bit
            if(this.read()){
              // If the next bit is 1, call the function
              call(n, v);
            }else{
              // If the next bit is 0, return the function
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
          }else{                    // Case 6: [value] [function]
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

    return 1;

    // Call the given function with the given argument
    function call(closure, arg){
      // Create a new stack frame
      var newFrame = O.last(stack).call(closure, arg);

      if(O.last(stack).len() === 0){
        /**
         * In case this was the last call from the current function,
         * replace the current stack frame with the new one
         */

        stack[stack.length - 1] = newFrame;
      }else{ // Otherwise just push the new frame to the stack
        stack.push(newFrame);
      }
    }
  }

  save(){
    /**
     * Export the current state of the engine,
     * so that it can be restored later
     */

    const {stack} = this;
    var ser = new Serializer();

    var funcs = new Map();
    var refs = new Map();

    // Write all stack frames
    for(var frame of stack){
      ser.write(1); // Another stack frame

      // This is the function template used by the current stack frame
      var func = frame.func;

      if(funcs.has(func)){ // The function template is already seen
        ser.write(0); // Known template
        ser.write(funcs.get(func), funcs.size - 1); // Template index
      }else{ // The function template is not seen before
        ser.write(1); // New template
        ser.writeInt(func.depth) // Write depth
        ser.writeInt(func.elems.length) // Write number of elements
        funcs.set(func, funcs.size); // Add to known templates
      }

      ser.write(frame.len(), func.elems.length) // Write number of elements
    }

    ser.write(0); // No more stack frames

    // Write all function templates
    for(var func of funcs){
      /**
       * Number of function templates is known, so there
       * is no need to specify it again
       */

      ser.writeInt(func.depth) // Write function's depth

      // Iterate over function's elements
      for(var elem of func.elems){
        ser.write(1); // Another element
      }

      ser.write(0); // No more elements
    }

    return ser.getOutput();
  }

  restore(buf){
    var ser = new Serializer(buf);
  }
};

module.exports = Engine;

class Closure{
  constructor(func, idents, arg=null){
    this.func = func;
    this.idents = O.obj();

    for(var ident of func.idents){
      if(ident >= func.depth) break;
      this.idents[ident] = idents[ident];
    }

    if(arg !== null && func.isArgUsed)
      this.idents[this.func.depth - 1] = arg;

    this.index = 0;
  }

  eval(elem){
    if(elem === null) return null;
    if(elem.isIdent()) return this.get(elem.id);
    return new Closure(elem, this.idents);
  }

  next(){
    if(this.len() === 0) return null;
    return this.func.elems[this.index++];
  }

  len(){ return this.func.elems.length - this.index; }
  get(ident){ return this.idents[ident].get(); }
  set(ident, val){ this.idents[ident].set(val); }
  isMeta(){ return this.len() === 0; }

  toString(full=0){
    var elems = this.func.elems;
    if(!full) elems = elems.slice(this.index);
    return elems.join('');
  }
};

class StackFrame extends Closure{
  constructor(func, idents, arg=null){
    if(arg !== null) arg = new Reference(arg);
    super(func, idents, arg);
    this.val = null;
  }

  call(closure, arg){
    return new StackFrame(closure.func, closure.idents, arg);
  }

  toString(){
    var str = this.val !== null ? '[V]' : '[.]';
    str += ' ' + super.toString();
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

class Reference{
  constructor(val){
    this.val = val;
  }

  get(){ return this.val; }
  set(val){ this.val = val; }
};