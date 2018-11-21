'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const IO = require('./io');

class Serializer extends IO{
  constructor(buf){
    super(buf, 1);
  }

  read(max=1){
    if(max === 0) return 0;

    var mask = 1 << 31 - Math.clz32(max);
    var limit = 1;
    var num = 0;

    while(mask !== 0){
      num <<= 1;
      if(!limit || (max & mask)){
        var bit = super.read();
        num |= bit;
        if(!bit) limit = 0;
      }
      mask >>= 1;
    }

    return num;
  }

  write(num, max=1){
    if(max === 0) return;

    var mask = 1 << 31 - Math.clz32(max);
    var limit = 1;

    while(mask !== 0){
      if(!limit || (max & mask)){
        var bit = num & mask ? 1 : 0;
        super.write(bit);
        if(!bit) limit = 0;
      }
      mask >>= 1;
    }

    return num;
  }

  getOutput(encoding=null, trim=1){
    var buf = super.getOutput();
    var len = buf.length;

    if(trim && len !== 0 && buf[len - 1] === 0){
      for(var i = len - 1; i !== -1; i--)
        if(buf[i] !== 0) break;
      buf = Buffer.from(buf.slice(0, i + 1));
    }

    if(encoding !== null) buf = buf.toString(encoding);
    return buf;
  }
};

module.exports = Serializer;