'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class IO{
  constructor(input='', pad=0){
    this.input = Buffer.from(input);
    this.output = Buffer.alloc(1);

    this.pad = pad;

    this.inputIndex = pad ? 0 : 1;
    this.outputIndex = 0;
    this.byte = 0;
  }

  static name(){ return 'Standard'; }
  static isBit(){ return 0; }

  hasMore(){
    return (this.inputIndex >> 4) < this.input.length;
  }

  read(){
    const {input} = this;
    var i = this.inputIndex;

    if((i >> 4) >= input.length) return 0;
    this.inputIndex += this.pad ? 1 : 2;

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

  getOutput(encoding=null){
    if((this.outputIndex & 7) !== 0) this.addByte();
    var len = Math.ceil(this.outputIndex / 8);
    var buf = Buffer.from(this.output.slice(0, len));
    if(encoding !== null) buf = buf.toString(encoding);
    return buf;
  }
};

module.exports = IO;