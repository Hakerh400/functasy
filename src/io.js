'use strict';

const fs = require('fs');
const path = require('path');
const O = require('./framework');

class IO{
  constructor(input, mode=0){
    this.input = Buffer.from(input);
    this.output = Buffer.alloc(1);

    this.mode = mode;

    this.inputIndex = 0;
    this.outputIndex = 0;
    this.byte = 0;
  }

  read(){
    const {input} = this;
    var i = this.inputIndex;

    if((i >> 4) >= input.length) return 0;
    this.inputIndex += this.mode ? 2 : 1;

    if((i & 1) === 0) return 1;
    return input[i >> 4] & (1 << ((i >> 1) & 7)) ? 1 : 0;
  }

  write(bit){
    this.byte |= bit << (this.outputIndex++ & 7);
    if((this.outputIndex & 7) === 0) this.addByte();
  }

  addByte(){
    var len = this.outputIndex - 1 >> 3;

    if(len === this.output.length){
      var buf = Buffer.alloc(len);
      this.output = Buffer.concat([this.output, buf]);
    }

    this.output[len] = this.byte;
    this.byte = 0;
  }

  getOutput(){
    if((this.outputIndex & 7) !== 0) this.addByte();
    var len = Math.ceil(this.outputIndex / 8);
    return Buffer.from(this.output.slice(0, len));
  }
};

module.exports = IO;