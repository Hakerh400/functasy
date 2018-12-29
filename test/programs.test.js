'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const functasy = require('..');

const TICKS_NUM = 1e5;
const EXTENSION = 'txt';

const cwd = __dirname;
const programs = path.join(cwd, 'programs');

describe('Programs', () => {
  it('Empty program', () => {
    // Program with empty source code terminates immediately and doesn't output anything
    var name = 'empty';
    var input = randStr();
    var output = '';
    test(name, input, output);
  });

  it('Hello, World!', () => {
    // Print "Hello, World!"
    var name = 'hello-world';
    var input = randStr();
    var output = 'Hello, World!';
    test(name, input, output);
  });

  it('Cat', () => {
    // The cat program is a program that copies its input to its output
    var name = 'cat';
    var input = randStr();
    var output = input;
    test(name, input, output);
  });

  function test(name, input, expected){
    var src = fs.readFileSync(path.join(programs, `${name}.${EXTENSION}`));
    var actual = functasy.run(src, input, functasy.IO, 1, TICKS_NUM, 'utf8');

    if(actual === null)
      throw new Error(`The program did not complete in ${TICKS_NUM} ticks`);

    assert.strictEqual(actual, expected, Buffer.from(actual).toString('hex'));
  }

  function randStr(){
    return O.ca(O.rand(10, 30), () => randChar()).join('');
  }

  function randChar(){
    return O.sfcc(O.rand(32, 126));
  }
});