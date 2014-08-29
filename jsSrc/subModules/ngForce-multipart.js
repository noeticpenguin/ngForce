/*
 * Introducing 'multipart'
 * -----------------------
 *
 * A module that helps build a multipart HTTP request body consisting of
 * binary and/or non-binary parts.
 *
 * The resulting body can be returned as an ArrayBuffer via req.getBuffer(),
 * or as a string via req.toString().
 *
 * Usage:
 *  var req = new MultipartRequest('my_boundary');
 *
 *  var part1 = new RequestPart();
 *  part1.addHeader('My-Header', 'some value');
 *  part1.addHeader('My-Other-Header', 'some other value');
 *  part1.setBody({ Title: "My Title" });
 *  req.addPart(part1);
 *
 *  var part2 = new RequestPart();
 *  part2.addHeader('Content-Type', 'application/octet-stream');
 *  part2.setBody(<ARRAY_BUFFER>);
 *  req.addPart(part2);
 *
 *  var buffer = req.getBuffer();
 *
 * @author  https://github.com/lukemcfarlane
 * @date    July 2014
 */
angular.module('multipart', []);

/**
 * Build a part of a MultipartRequest that can contain any number of headers
 * and a body. The body can be either of the following types:
 *  - ArrayBuffer (binary data)
 *  - Object (JSON data)
 *  - String
 *
 * The resulting request part can be returned either as an ArrayBuffer (getBuffer()), or
 * as a string (toString());
 */
angular.module('multipart').service('RequestPart', function() {
    function RequestPart() {
        this.headers = [];
    }

    RequestPart.prototype.setBody = function(body) {
        this.body = body;
        switch (toString.call(body)) {
            case '[object ArrayBuffer]':
                this.bodyType = 'arraybuffer';
                break;
            case '[object String]':
                this.bodyType = 'string';
                break;
            case '[object Object]':
                this.bodyType = 'json';
                break;
            default:
                throw Error('Unsupported multipart body type: ' + toString.call(body));
        }
    };

    RequestPart.prototype.addHeader = function(name, value) {
        this.headers.push({
            name: name,
            value: value
        });
    };

    RequestPart.prototype.getRawHeaders = function() {
        var rawHeadersArr = [];
        for (var i = 0; i < this.headers.length; i++) {
            var h = this.headers[i];
            rawHeadersArr.push(h.name + ': ' + h.value);
        }
        return rawHeadersArr.join('\n');
    };

    RequestPart.prototype.getBuffer = function() {
        var bufferArr = [];
        var rawHeaders = this.getRawHeaders();
        bufferArr.push((new StringView(rawHeaders)).buffer);
        bufferArr.push((new StringView('\n\n')).buffer);
        if (this.bodyType === 'arraybuffer') {
            bufferArr.push(this.body);
        } else if (this.bodyType === 'string') {
            bufferArr.push((new StringView(this.body)).buffer);
        } else if (this.bodyType === 'json') {
            var jsonStr = JSON.stringify(this.body);
            bufferArr.push((new StringView(jsonStr)).buffer);
        }
        return joinBuffers(bufferArr);
    };

    RequestPart.prototype.toString = function() {
        return (new StringView(this.getBuffer())).toString();
    };

    function joinBuffers(arrayBuffers) {
        var lengthSum = 0;
        for (var i = 0; i < arrayBuffers.length; i++) {
            lengthSum += arrayBuffers[i].byteLength;
        }

        var joined = new Uint8Array(lengthSum);

        var offset = 0;
        for (var i = 0; i < arrayBuffers.length; i++) {
            var ab = arrayBuffers[i];
            joined.set(new Uint8Array(ab), offset);
            offset += ab.byteLength;
        }

        return joined.buffer;
    }

    return RequestPart;
});

/**
 * Build a multipart request that consists of one or more request parts.
 *
 * The resulting multipart request body can be returned either as an
 * ArrayBuffer (getBuffer()), or as a string (toString());
 */
angular.module('multipart').service('MultipartRequest', ['RequestPart',
    function(RequestPart) {
        function MultipartRequest(boundaryStr) {
            this.boundaryStr = boundaryStr;
            this.parts = [];
        }

        MultipartRequest.prototype.addPart = function(part) {
            this.parts.push(part);
        };

        MultipartRequest.prototype.getBuffer = function() {
            var bufferArr = [];
            bufferArr.push((new StringView('--' + this.boundaryStr + '\n')).buffer);
            for (var i = 0; i < this.parts.length; i++) {
                bufferArr.push(this.parts[i].getBuffer());
                bufferArr.push((new StringView('\n\n')).buffer);
                if (i !== this.parts.length - 1) { // if not the last part
                    bufferArr.push((new StringView('--' + this.boundaryStr + '\n')).buffer);
                }
            }
            bufferArr.push((new StringView('--' + this.boundaryStr + '--')).buffer);
            return joinBuffers(bufferArr);
        };

        MultipartRequest.prototype.toString = function() {
            return (new StringView(this.getBuffer())).toString();
        };

        function joinBuffers(arrayBuffers) {
            var lengthSum = 0;
            for (var i = 0; i < arrayBuffers.length; i++) {
                lengthSum += arrayBuffers[i].byteLength;
            }

            var joined = new Uint8Array(lengthSum);

            var offset = 0;
            for (var i = 0; i < arrayBuffers.length; i++) {
                var ab = arrayBuffers[i];
                joined.set(new Uint8Array(ab), offset);
                offset += ab.byteLength;
            }

            return joined.buffer;
        }

        return MultipartRequest;
    }
]);