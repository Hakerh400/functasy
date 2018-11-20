'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const functasy = require('..');
const Serializer = require('../src/serializer');

const cwd = __dirname;
const programs = path.join(cwd, 'programs');

describe('Engine', () => {
  it('Cat', () => {
    // The cat program is a program that copies its standard input to its standard output.
    var src = fs.readFileSync(path.join(programs, 'cat.txt'));
    var input = O.ca(O.rand(20, 30), () => O.sfcc(O.rand(32, 126))).join('');
    var expected = input;
    var actual = functasy.run(src, input, 'utf8');
    assert.strictEqual(actual, expected);
  });
});

describe('Serializer', () => {
  it('Properly handles integers', () => {
    var ser = new Serializer();

    ser.write(0);
    ser.write(1);
    ser.write(1);
    ser.write(0);

    ser.write(37, 131);
    ser.write(22, 22);
    ser.write(101, 153);
    ser.write(1023, 1023);
    ser.write(1023, 1024);

    ser = new Serializer(ser.getOutput());

    assert.strictEqual(ser.read(), 0);
    assert.strictEqual(ser.read(1), 1);
    assert.strictEqual(ser.read(3), 2);

    assert.strictEqual(ser.read(131), 37);
    assert.strictEqual(ser.read(22), 22);
    assert.strictEqual(ser.read(153), 101);
    assert.strictEqual(ser.read(1023), 1023);
    assert.strictEqual(ser.read(1024), 1023);
  });

  it('Converts string to byte array', () => {
    var str = 'Serializable string';
    var ser = new Serializer();

    for(var char of str){
      ser.write(1);
      ser.write(O.cc(char) - 32, 94);
    }

    ser = new Serializer(ser.getOutput());
    var strNew = '';

    while(ser.read())
      strNew += O.sfcc(ser.read(94) + 32);

    assert.strictEqual(strNew, str);
  });

  it('Reads from buffer', () => {
    var buf = Buffer.from('001a', 'hex');
    var ser = new Serializer(buf);

    assert.strictEqual(ser.read((1 << 24) - 1), 0x5800);
  });

  it('Trims zeros from end', () => {
    var ser = new Serializer();

    ser.write(0, 175);
    ser.write(1);

    ser.write(0, 1392);
    ser.write(0, 11);
    ser.write(0, 2 ** 31 - 1);

    assert.ok(ser.getOutput(null, 0).length > 2);
    assert.strictEqual(ser.getOutput('hex'), '0001');
  });
});