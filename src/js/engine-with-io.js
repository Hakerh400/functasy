'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Engine = require('./engine');
const IO = require('./io');

class EngineWithIO extends Engine{
  constructor(src, input='', ioCtor=IO, pad=0){
    super(src);

    const io = new ioCtor(input, pad);
    this.io = io;

    this.read = io.read.bind(io);
    this.write = io.write.bind(io);
    this.getOutput = io.getOutput.bind(io);
  }

  save(){
    return super.save();
  }

  load(buf){
    super.load(buf);
  }
};

module.exports = EngineWithIO;