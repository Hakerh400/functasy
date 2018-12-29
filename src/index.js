'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');
const Engine = require('./engine');
const IO = require('./io');
const IOBit = require('./io-bit');
const EngineWithIO = require('./engine-with-io');
const Serializer = require('./serializer');
const {toId, toName} = require('./idents');

module.exports = {
  Engine,
  IO,
  IOBit,
  EngineWithIO,
  Serializer,
  toId,
  toName,
  run,
};

function run(src, input, ioCtor, pad, ticksNum, encoding){
  var eng = new EngineWithIO(src, input, ioCtor, pad);
  if(!eng.run(ticksNum)) return null;
  return eng.getOutput(encoding);
}