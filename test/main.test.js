'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../src/framework');
const functasy = require('..');

const cwd = __dirname;
const testSuite = path.join(cwd, 'test-suite');

describe('Functasy', () => {
  fs.readdirSync(testSuite).forEach(name => {
    it(name, () => {
      var dir = path.join(testSuite, name);

      var src = fs.readFileSync(path.join(dir, 'src.txt'));
      var input = fs.readFileSync(path.join(dir, 'input.txt'));

      var expected = fs.readFileSync(path.join(dir, 'output.txt'), 'utf8');
      var actual = functasy.run(src, input, 'utf8');

      assert.equal(expected, actual);
    });
  });
});