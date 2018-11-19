'use strict';

const fs = require('fs');
const path = require('path');
const O = require('./framework');
const Engine = require('./engine');
const IO = require('./io');

module.exports = {
  Engine,
  run,
};

function run(src, input, encoding){
  var engine = new Engine(src);
  var io = new IO(input);

  engine.read = io.read.bind(io);
  engine.write = io.write.bind(io);

  engine.run();

  return io.getOutput(encoding);
}