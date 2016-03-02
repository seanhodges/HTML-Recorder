/**
 * Created by sean on 31/01/16.
 *
 * This proxies through to Gatling to build a stress test environment
 */

var superagent = require('superagent');
require('superagent-proxy')(superagent);
var chai = require('chai');
var expect = chai.expect;

var TARGET_HOST = 'http://localhost:17142';

describe('stress test GET', function() {
    it('should generate a poster via a GET', function (done) {
        superagent
            .get(TARGET_HOST + '/convert/test.png?src=http://localhost/MNN487118_Test/Entertainment1+300+x+250.html&width=300&height=250')
            .end(function (err, res) {
                if (res.text) console.error(res.text);

                expect(res.status).to.equal(200);
                done();
            })
    });
});

describe.only('stress test POST', function() {
    it('should generate a poster via a POST', function (done) {
        superagent
            .post(TARGET_HOST + '/convert/test.png')
            .type('form')
            .attach('creative', 'test-resources/MNN487118_Test.zip', 'MNN487118_Test.zip')
            .proxy('http://localhost:8888')
            .end(function (err, res) {
                if (res.text) console.error(res.text);

                expect(res.status).to.equal(200);
                done();
            })
    });
});