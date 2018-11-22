'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const parser = require('./parser');
const Serializer = require('./serializer');

class Engine{
  constructor(src){
    this.funcs = parser.parse(Buffer.from(src));
    this.mainFunc = this.funcs.keys().next().value;
    this.stack = [new StackFrame(new Closure(this.mainFunc))];

    this.read = O.nop;
    this.write = O.nop;
  }

  reset(){
    this.stack.length = 0;
    this.stack.push(new StackFrame(new Closure(this.mainFunc)));
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
            if(this.read() & 1){
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
     * Save the current state of the engine,
     * so that it can be loaded later
     */

    const {funcs} = this;
    const ser = new Serializer();

    // Save the main function including all nested functions
    parser.serialize(ser, this.mainFunc);

    /**
     * Save the stack including all accessible closures
     */

    var refs = new Map();

    for(var frame of this.stack){
      ser.write(1); // Another stack frame
      saveRef(new Reference(frame.closure)); // Save frame's closure as a new reference
    }
    ser.write(0); // No more stack frames

    // Return the saved engine state as a buffer
    return ser.getOutput();

    function saveRef(ref){
      // Prepare a new queue
      var queue = [ref];

      while(queue.length !== 0){
        // Obtain the closure from the next reference
        var closure = queue.shift().get();

        if(refs.has(closure)){ // If the closure is already saved
          ser.write(0); // Old closure
          ser.write(refs.get(closure), refs.size - 1); // Closure's index
          return;
        }

        /**
         * If the closure isn't already saved, iterate over
         * its references and save each of them
         */

        ser.write(1); // New closure
        ser.write(funcs.get(closure.func), funcs.size - 1) // Save closure's function

        // Push all closure's references into the queue
        for(var ident of closure.func.idents)
          queue.push(closure.idents[ident]);
       }
    }
  }

  load(buf){
    var ser = new Serializer(buf);
  }
};

module.exports = Engine;

class StackFrame{
  constructor(closure, arg=null){
    this.closure = closure;
    this.arg = arg !== null ? new Reference(arg) : null;
    this.val = null;
    this.index = 0;
  }

  len(){
    return this.closure.func.elems.length - this.index;
  }

  next(){
    if(this.len() === 0) return null;
    return this.closure.func.elems[this.index++];
  }

  eval(elem){
    if(elem === null) return null;

    if(elem.isIdent()){
      if(elem.id === this.closure.func.depth - 1)
        return this.arg.get();
      return this.closure.get(elem.id);
    }

    return new Closure(elem, this.closure.idents, this.arg);
  }

  call(closure, arg){
    return new StackFrame(closure, arg);
  }

  get(ident){
    if(ident === this.closure.func.depth - 1)
      return this.arg.get();
    return this.closure.get(ident);
  }

  set(ident, val){
    if(ident === this.closure.func.depth - 1)
      return this.arg.set(val);
    return this.closure.set(ident, val);
  }

  isMeta(){ return this.closure.isMeta(); }
};

class Closure{
  constructor(func, idents, arg){
    this.func = func;
    this.idents = O.obj();

    for(var ident of func.idents){
      ident |= 0;

      if(ident === this.func.depth - 2){
        this.idents[ident] = arg;
        break;
      }

      this.idents[ident] = idents[ident];
    }
  }

  get(ident){ return this.idents[ident].get(); }
  set(ident, val){ this.idents[ident].set(val); }
  isMeta(){ return this.func.isMeta(); }
};

class Reference{
  constructor(val){
    this.val = val;
  }

  get(){ return this.val; }
  set(val){ this.val = val; }
};