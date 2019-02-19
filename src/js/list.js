'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

class List{
  constructor(){
    this.arr = [];
  }

  add(elem){
    this.arr.push(elem);
  }

  next(){
    return this.arr.pop();
  }

  hasMore(){ return this.arr.length !== 0; }
  isEmpty(){ return this.arr.length === 0; }
};

module.exports = List;