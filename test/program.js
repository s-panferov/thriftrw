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

'use strict';

var path = require('path');
var test = require('tape');
var ThriftProgram = require('../thrift-program').ThriftProgram;

var basedir = path.join(__dirname, 'thrift', 'include');

test('program sync', function t(assert) {
    var filename = path.join(basedir, 'User.thrift');
    var program = ThriftProgram.analyseSync(filename);
    assert.ok(program);
    assert.pass('thrift program parses');
    testProgram(assert, program);

    assert.end();
});

test('program async', function t(assert) {
    assert.plan(5);

    var filename = path.join(basedir, 'User.thrift');
    ThriftProgram.analyse(filename, function cb(err, prog) {
        assert.notOk(err);
        assert.ok(prog);
        assert.pass('thrift program parses');
        testProgram(assert, prog);
    });
});

function testProgram(assert, program) {
    var userSpec = program.getSpec(path.join(basedir, 'User.thrift'));
    var profileSpec = program.getSpec(path.join(basedir, 'Profile.thrift'));
    var avatarSpec = program.getSpec(path.join(basedir, 'Avatar.thrift'));

    var resolvedProfile = userSpec.resolve({type: 'Identifier', name: 'Profile.Profile'});
    var originalProfile = profileSpec.resolve({type: 'Identifier', name: 'Profile'});

    assert.equal(resolvedProfile, originalProfile);

    var resolvedAvatar = profileSpec.resolve({type: 'Identifier', name: 'Avatar.Avatar'});
    var originalAvatar = avatarSpec.resolve({type: 'Identifier', name: 'Avatar'});

    assert.equal(resolvedAvatar, originalAvatar);
}
