'use strict';

const fs = require('fs');
const path = require('path');
const O = require('omikron');

module.exports = require(`./${process.env.IMPL === 'cpp' ? 'cpp' : 'js'}`);