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

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var Thrift = require('./thrift').Thrift;

function ThriftProgram(specs) {
    if (typeof specs === 'undefined') {
        this.specs = Object.create(null);
    }
}

ThriftProgram.analyseSync = function analyseSync(fileName, resolver) {
    if (typeof resolver === 'undefined') {
        resolver = new FileSystemResolver(path.dirname(fileName));
    }

    var program = new ThriftProgram();
    program.analyseSpecSync(fileName, resolver);
    program.linkImports();
    program.link();

    return program;
};

ThriftProgram.prototype.analyseSpecSync = function analyseSpecSync(fileName, resolver) {
    var self = this;
    var syntax = Thrift.parse(resolver.resolveSync(fileName));

    var thrift = new Thrift({
        source: syntax,
        program: self
    });

    self.specs[fileName] = thrift;

    var imports = thrift.imports;
    var moduleNames = Object.keys(imports);
    var index = 0;
    for (index = 0; index < moduleNames.length; index++) {
        var moduleName = moduleNames[index];
        var moduleFileName = imports[moduleName].relativePath;
        var resolvedFileName = resolver.resolvePath(fileName, moduleFileName);

        // Cache resolved file name inside imports.
        imports[moduleName].absolutePath = resolvedFileName;

        self.analyseSpecSync(resolvedFileName, resolver);
    }
};

ThriftProgram.analyse = function analyse(fileName, resolver, callback) {
    if (typeof resolver === 'function') {
        callback = resolver;
        resolver = new FileSystemResolver(path.dirname(fileName));
    }

    var program = new ThriftProgram();

    program.analyseSpec(fileName, resolver, function cb(err) {
        if (err) {
            callback(err);
        } else {
            program.linkImports();
            program.link();
            callback(null, program);
        }
    });
};

ThriftProgram.prototype.analyseSpec = function analyseSpec(fileName, resolver, callback) {
    var self = this;

    resolver.resolve(fileName, function cb(err, source) {
        if (err) {
            callback(err);
            return;
        }

        var syntax = Thrift.parse(source.toString());
        var thrift = new Thrift({
            source: syntax,
            program: self
        });

        self.specs[fileName] = thrift;

        var resolvedFiles = 0;
        var imports = thrift.imports;
        var modules = Object.keys(imports);

        var index = 0;
        var lastError = null;

        for (index = 0; index < modules.length; index++) {
            var moduleName = modules[index];
            var moduleFileName = imports[moduleName].relativePath;
            var resolvedFileName = resolver.resolvePath(fileName, moduleFileName);

            // Cache resolved file name inside imports.
            imports[moduleName].absolutePath = resolvedFileName;

            self.analyseSpec(resolvedFileName, resolver, fileResolvedCb);
        }

        if (modules.length === 0) {
            callback();
        }

        function fileResolvedCb(analyseErr) {
            if (analyseErr) {
                lastError = analyseErr;
            }
            resolvedFiles++;
            if (resolvedFiles === modules.length) {
                if (lastError) {
                    callback(lastError);
                } else {
                    callback();
                }
            }
        }
    });
};

ThriftProgram.prototype.linkImports = function linkImports() {
    var self = this;
    var fileNames = Object.keys(self.specs);
    for (var index = 0; index < fileNames.length; index++) {
        self.specs[fileNames[index]].linkImports();
    }
};

ThriftProgram.prototype.link = function link() {
    var self = this;
    var fileNames = Object.keys(self.specs);
    for (var index = 0; index < fileNames.length; index++) {
        self.specs[fileNames[index]].linkImports();
    }
};

ThriftProgram.prototype.getSpec = function getSpec(fileName) {
    var spec = this.specs[fileName];
    assert(spec, 'Spec is unknown: ' + fileName);

    return spec;
};

module.exports.ThriftProgram = ThriftProgram;

function FileSystemResolver() {

}

FileSystemResolver.prototype.resolvePath = function prepareFileName(baseFileName, fileName) {
    var preparedFileName;
    if (path.basename(fileName) === fileName) {
        preparedFileName = './' + fileName
    } else {
        preparedFileName = fileName;
    }

    return path.resolve(path.dirname(baseFileName), preparedFileName);
};

FileSystemResolver.prototype.resolveSync = function resolveSync(fileName) {
    return fs.readFileSync(fileName).toString();
};

FileSystemResolver.prototype.resolve = function resolve(fileName, callback) {
    fs.readFile(fileName, callback);
};

module.exports.FileSystemResolver = FileSystemResolver;
