'use strict';

const fs = require('fs');
const path = require('path');
const O = require('./framework');

module.exports = {
  toId,
  toName,
};

function toId(ident){
  return ident.split('').reduce((a, b) => {
    var i = /[0-9]/.test(b) ? Number(b) :
            /[a-z]/.test(b) ? 10 + O.cc(b) - O.cc('a') :
            36 + O.cc(b) - O.cc('A');

    return a * 62 + i;
  }, 0);
}

function toName(id, depth=id + 1){
  var ident = '';

  for(var d = depth; d !== 0; d = d / 62 | 0){
    var n = id % 62;
    id = id / 62 | 0;

    var c = n < 10 ? O.sfcc(O.cc('0') + n) :
            n < 36 ? O.sfcc(O.cc('a') + n - 10) :
            O.sfcc(O.cc('0') + n - 36);

    ident = c + ident;
  }

  return ident;
}