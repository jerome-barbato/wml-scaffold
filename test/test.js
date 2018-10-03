/* jshint mocha: true, maxlen: false */
var wml = require('../index.js'),
	expect = require('chai').expect,
	fs = require('fs');

function deleteFolderRecursive(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) {
				deleteFolderRecursive(curPath);
			} else {
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
}

deleteFolderRecursive('./export');

function test(input, params, output, done) {
	wml(params)
		.process(input)
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
        test('./test/complex.wml', {outputPath:'./export', design:'atomic'}, true, done);
    });
});