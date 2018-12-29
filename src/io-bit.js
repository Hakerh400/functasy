'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class IOBit{
  constructor(input='', pad=0){
    this.input = String(input).split('').map(a => a | 0);
    this.output = '';

    this.pad = pad;

    this.inputIndex = pad ? 0 : 1;
  }

  static name(){ return 'Bit'; }
  static isBit(){ return 1; }

  read(){
    const {input} = this;
    var i = this.inputIndex;

    if((i >> 1) >= input.length) return 0;
    this.inputIndex += this.pad ? 1 : 2;

    if((i & 1) === 0) return 1;
    return input[i >> 1];
  }

  write(bit){
    this.output += bit | 0;
  }

  getOutput(encoding=null){
    var buf = Buffer.from(this.output);
    if(encoding !== null) buf = buf.toString(encoding);
    return buf;
  }
};

module.exports = IOBit;