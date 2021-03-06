// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/* global Buffer */
'use strict';

var bufrw = require('bufrw');
var TYPE = require('./TYPE');
var errors = require('bufrw/errors');

var I64RW = bufrw.AtomRW(8,
    function readTInt64From(buffer, offset) {
        var value = new Buffer(8);
        buffer.copy(value, 0, offset, offset + 8);
        return new bufrw.ReadResult(null, offset + 8, value);
    },
    function writeTInt64Into(value, buffer, offset) {
        // istanbul ignore if
        if (!(value instanceof Buffer)) {
            return bufrw.WriteResult.error(errors.expected(value, 'a buffer'));
        }
        value.copy(buffer, offset, 0, 8);
        return new bufrw.WriteResult(null, offset + 8);
    });

// TODO decide whether to do buffer or [hi, lo] based on annotations
function ThriftI64() { }

ThriftI64.prototype.rw = I64RW;
ThriftI64.prototype.name = 'i64';
ThriftI64.prototype.typeid = TYPE.I64;
ThriftI64.prototype.surface = Buffer;

module.exports.I64RW = I64RW;
module.exports.ThriftI64 = ThriftI64;
