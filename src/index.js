'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Engine = require('./engine');
const IO = require('./io');
const EngineWithIO = require('./engine-with-io');

module.exports = {
  Engine,
  IO,
  EngineWithIO,
  run,
};

function run(src, input, ticksNum, encoding){
  var eng = new EngineWithIO(src, input);
  if(!eng.run(ticksNum)) return null;
  return eng.getOutput(encoding);
}