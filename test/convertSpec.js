/**
 * Created by sean on 31/01/16.
 */

var superagent = require('superagent');
var chai = require('chai');
var expect = chai.expect;

describe('html edge poster generation', function() {

    it('should generate a poster for MNN487118_Test.zip via a GET', function (done) {
        superagent
            .get('http://localhost:17142/convert/test.png?src=http://localhost/MNN487118_Test/Entertainment1+300+x+250.html&width=300&height=250')
            .end(function (err, res) {
                expect(res.status).to.equal(200);
                done();
            })
    });

    it('should generate a CC2015 poster for MNN487118_Test.zip via a POST', function (done) {
        superagent
            .post('http://localhost:17142/convert/test.png')
            .type('form')
            .attach('creative', 'test-resources/MNN487118_Test.zip', 'MNN487118_Test.zip')
            .end(function (err, res) {
                expect(res.status).to.equal(200);
                done();
            })
    });

    it('should generate a CC2015 poster for test-fitting-test.zip via a POST', function (done) {
        superagent
            .post('http://localhost:17142/convert/test.png')
            .type('form')
            .attach('creative', 'test-resources/test-fitting-test.zip', 'test-fitting-test.zip')
            .end(function (err, res) {
                expect(res.status).to.equal(200);
                done();
            })
    });
});