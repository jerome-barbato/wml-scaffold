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
};

deleteFolderRecursive('./export');

function test(input, output, done) {
	wml({outputPath:'./export'})
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

	/*it('Test write file', function(done) {
		test(
			{type:'write', data:[{'/test.twig':'<div block="Test"></div>'}]},
			[true],
			done
		);
    });

	it('Test write file in subfolder', function(done) {
		test(
			{type:'write', data:[{'/asset/component/test/test.twig':'<div block="Test"></div>'}]},
			[true],
			done
		);
    });

	it('Test write files', function(done) {
		test(
			{type:'write', data:[{'/asset/component/test/test.twig':'<div block="Test"></div>'},{'/asset/component/test/test.scss':'.Test{  }'}]},
			[true, true],
			done
		);
    });

    it('Test load simple structure', function(done) {
        test(
        	{type:'load', data:'./test/simple.wml'},
	        {simple:null},
	        done
        );
    });

    it('Test simple generation', function(done) {
        test(
        	'./test/simple.wml',
	        [[true]],
	        done
        );
    });*/

    it('Test complex generation', function(done) {
        test(
        	'./test/complex.wml',
	        [[true]],
	        done
        );
    });
});