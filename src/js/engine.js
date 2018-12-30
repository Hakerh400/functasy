'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Parser = require('./parser');
const Serializer = require('./serializer');

const DEBUG = 0;

class Engine{
  constructor(src){
    this.funcs = Parser.parse(Buffer.from(src));
    this.mainFunc = this.funcs.keys().next().value;
    this.stack = [new StackFrame(new Closure(this.mainFunc))];
  }

  read(){ throw new TypeError('Cannot perform virtual method "read"'); }
  write(){ throw new TypeError('Cannot perform virtual method "write"'); }

  reset(){
    this.stack.length = 0;
    this.stack.push(new StackFrame(new Closure(this.mainFunc)));
  }

  run(ticksNum=null){
    const {stack} = this;

    while(stack.length !== 0){
      if(ticksNum !== null && --ticksNum < 0) return 0;

      if(DEBUG){
        log('\n' + '-'.repeat(150) + '\n');
        require('../../JavaScript/debug')(stack.map(f => {
          log(f.toString());
        }).join(''));
      }

      var frame = O.last(stack);

      if(frame.len() === 0){ // The current function is finished
        if(!frame.hasVal()) // Meta function is called
          // When called, meta function returns itself
          frame.setVal(new Closure(frame.closure.func));

        // Pop the last stack frame
        stack.pop();

        // If this was not the last function, put the value on the previous frame
        if(stack.length !== 0)
          O.last(stack).setVal(frame.getVal());

        continue;
      }

      // Get the next element from the current closure
      var elem = frame.next();
      var len = frame.len();

      // val - old value, v - new value
      var val = frame.getVal();
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
            if(DEBUG) log('Initialize the stack frame with the meta function');
            frame.setVal(v);
          }else if(next.isIdent()){ // Case 2: [empty] [identifier]
            // Output 1
            if(DEBUG) log('Output 1');
            this.write(1);
            // Evaluate the next element and save it in the frame value
            frame.setVal(n);
          }else{                    // Case 3: [empty] [function]
            // Read the next bit
            if(DEBUG) log('Read the next bit');
            if(this.read() & 1){
              // If the next bit is 1, call the function
              if(DEBUG) log('The bit is 1, call the function');
              call(n, v);
            }else{
              // If the next bit is 0, return the function
              if(DEBUG) log('The bit is 0, return the function');
              frame.setVal(n);
            }
          }
        }else{
          if(next === null){        // Case 4: [value] [empty]
            // Output 0
            if(DEBUG) log('Output 0');
            this.write(0);
          }else if(next.isIdent()){ // Case 5: [value] [identifier]
            // Update the value associated with the given identifier
            if(DEBUG) log('Update the value associated with the given identifier');
            frame.set(next.id, val);
          }else{                    // Case 6: [value] [function]
            // Perform the call in the reversed order
            if(DEBUG) log('Perform the call in the reversed order');
            call(n, val);
          }
        }

        continue;
      }

      if(val === null){ // There is nothing on the current stack frame
        // Initialize the stack frame value
        frame.setVal(v);
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
      }else{
        // Otherwise just push the new frame to the stack
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
    Parser.serialize(ser, this.mainFunc);

    /**
     * Save the stack including all accessible closures
     */

    const clos = new Map();
    const refs = new Map();

    this.stack.forEach((frame, index) => {
      const {closure} = frame;

      ser.write(1); // Another stack frame

      if(index === 0){
        if(closure.func === this.mainFunc){
          ser.write(0);
          saveMainClos();
        }else{
          ser.write(1);
          saveClos(closure);
        }
      }else{
        saveClos(closure);
      }

      if(closure.func.isArgUsed){
        ser.write(1);
        saveRef(frame.arg); // Save frame's argument
      }else{
        ser.write(0);
      }

      ser.write(frame.index, frame.total()); // Save current index

      if(!frame.hasVal()){ // If there is no value in the current frame
        ser.write(0); // Has no value
      }else{
        ser.write(1); // Has a value
        saveRef(new Reference(frame.getVal())); // Save frame's value
      }
    });
    ser.write(0); // No more stack frames

    // Return the saved engine state as a buffer
    return ser.getOutput();

    function saveRef(ref){
      // Prepare a new queue
      var queue = [ref];

      while(queue.length !== 0){
        // Obtain the closure from the next reference
        var closure = queue.shift().get();

        if(closures.size === 0){ // If there are no saved references
          saveFunc();
        }else{ // If there is at least one saved reference
          if(closures.has(closure)){ // If the closure is already saved
            ser.write(0); // Old closure
            ser.write(closures.get(closure), closures.size - 1); // Closure's index
            continue;
          }

          closures.add(closure, closures.size); // Add the closure to the map
          ser.write(1); // New closure
          saveFunc();
        }

        // Push all closure's references into the queue
        for(var ident of closure.func.idents)
          queue.push(closure.idents[ident]);
      }

      function saveFunc(){
        // Save closure's function
        ser.write(funcs.get(closure.func), funcs.size - 1);
      }
    }
  }

  load(buf){
    var ser = new Serializer(buf);

    // Load all functions and extract the main function
    this.funcs = Parser.deserialize(ser);
    this.mainFunc = this.funcs.keys().next().value;

    // Reset the stack
    this.stack.length = 0;

    /**
     * Load the stack including all accessible closures
     */

    var closures = new Map();

    // Iterate over stack frames
    while(ser.read()){
      // Load another reference and construct a new frame using extracted closure
      var frame = new StackFrame(loadRef().get());

      frame.index = ser.read(frame.total()); // Load current index
      if(!ser.read()) // If there is no value in the current frame
        continue;

      frame.setVal(loadRef()); // Load frame's value
    }

    function loadRef(){
      // Prepare a new queue
      var queue = [ref];

      while(queue.length !== 0){
        // Obtain the closure from the next reference
        var closure = queue.shift().get();

        if(closures.size === 0){ // If there are no saved references
          saveFunc();
        }else{ // If there is at least one saved reference
          if(closures.has(closure)){ // If the closure is already saved
            ser.write(0); // Old closure
            ser.write(closures.get(closure), closures.size - 1); // Closure's index
            continue;
          }

          closures.add(closure, closures.size); // Add the closure to the map
          ser.write(1); // New closure
          saveFunc();
        }

        // Push all closure's references into the queue
        for(var ident of closure.func.idents)
          queue.push(closure.idents[ident]);
      }

      function loadFunc(){
        // Save closure's function
        ser.write(funcs.get(closure.func), funcs.size - 1);
      }
    }
  }

  toString(){
    return this.stack.map((frame, index) => {
      return `${TAB.repeat(index)}${frame}`;
    }).join('\n');
  }
};

module.exports = Engine;

class StackFrame{
  constructor(closure, arg=null){
    if(!closure.func.isArgUsed)
      arg = null;

    this.closure = closure;
    this.arg = arg !== null ? new Reference(arg) : null;
    this.val = null;
    this.index = 0;
  }

  hasVal(){
    return this.val !== null;
  }

  getVal(){
    return this.val;
  }

  setVal(val){
    this.val = val;
  }

  total(){
    return this.closure.func.elems.length;
  }

  len(){
    return this.total() - this.index;
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

  toString(){
    return `${
      this.val !== null ? this.val : ''}.${
      this.closure.toString(0, this.index)
    }`;
  }
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

  toString(parens, index){
    return this.func.toString(parens, index);
  }
};

class Reference{
  constructor(val){
    this.val = val;
  }

  get(){ return this.val; }
  set(val){ this.val = val; }

  toString(){
    return this.val.toString();
  }
};