'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const {Engine} = require('..');

describe('Engine', () => {
  it('Detects invalid syntax', () => {
    [
      '(', // Missing closed parenthese
      ')', // Missing open parenthese
      ')(', // Unmatched parentheses
      '(1)', // Invalid identifier
      '0', // Illegal global identifier
      '~', // Illegal character
    ].forEach(src => {
      assert.throws(() => new Engine(src));
    });
  });

  it('Saves and loads program');
});