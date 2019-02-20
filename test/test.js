/* jshint mocha: true, maxlen: false */
var wml = require('../index.js'),
	expect = require('chai').expect;


function test(params, output, done) {
	wml(params).process()
		.then(function(result) {
           expect(output).to.eql(result);
			done();
		})
		.catch(function(error) {
			console.log(error);
		});
}

describe('Test for pages', function() {

    it('Test complex generation', function(done) {
       // test('./test/complex.wml', {outputPath:'./export', design:'component'}, true, done);
        test({inputPath:'./test/complex.wml', outputPath:'./export', design:'atomic'}, true, done);
    });
});