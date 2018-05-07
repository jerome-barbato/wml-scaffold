var yaml  = require('js-yaml');
var fs    = require('fs');
var path  = require('path');
var mkdir = require('mkdirp');
var _camelCase = require('lodash.camelcase');

var wml = (function (config) {

	wml.files = [];

	config = Object.assign({
		outputPath: '.',
		type: 'twig-scss'

	}, config);

	wml.prototype.process = function(args){

		if( typeof args === 'object' && args.type === 'load')
		{
			return loadFile(args.data);
		}
		else if( typeof args === 'object' && args.type === 'write')
		{
			return writeFiles(args.data);
		}
		else
		{
			return loadTags()
				.then(function(tags){
					config.tags = tags;
					return loadFile(args);
				})
				.then(generateFiles)
				.then(function(){
					return writeFiles(wml.files);
				})
		}
	};


	function camelCase(string)
	{
		string = _camelCase(string);
		return string.charAt(0).toUpperCase() + string.slice(1);
	}


	function loadTags(){

		return new Promise(function (resolve, reject) {

			try {
				var tags = yaml.safeLoad(fs.readFileSync('structure/'+config.type+'/tags.wml', 'utf8'));
				resolve(tags);

			} catch (e) {
				reject(e);
			}
		});
	}


	function generateFiles(structure){

		return Promise.all(Object.keys(structure).map(function(key){
			if( key === 'layout' )
				return generateLayout(structure[key]);
			else
				return generatePage(key, structure[key]);
		}));
	}


	function generateLayout(structure){

		return Promise.all(structure.map(function(layout){
			var name = Object.keys(layout)[0];
			return generatePage(name, layout[name], 'layout');
		}));
	}


	function generatePage(name, structure, type){

		return new Promise(function (resolve, reject) {

			try {

				if( typeof type === 'undefined' )
					type = 'page';

				var files = [];

				var structure_path = 'structure/'+config.type+'/'+type;
				var structure_files = fs.readdirSync(structure_path);

				structure_files.forEach(function(structure_file){

					var content = fs.readFileSync(structure_path+'/'+structure_file, 'utf8');
					content = content
						.replace(/{{ name }}/g, name)
						.replace(/#{\$name}/g, name);

					if( type === 'page' )
					{
						if( structure !== null && typeof structure === 'object' && typeof structure[0] !== 'undefined' && 'layout' in structure[0])
							content = content.replace(/{% extends layout %}\r\n/, '{% extends \'layout/'+structure[0].layout+'.twig\' %}\n');
						else
							content = content.replace(/{% extends layout %}\r\n/, '');
					}

					var components = [];

					if( structure!= null && Array.isArray(structure) )
					{
						structure.forEach(function(component){

							var key = Object.keys(component)[0].split('|');

							if( key[0] !== 'layout')
								components.push("{% include 'component/"+key[0]+".twig' %}");
						});
					}

					content = content.replace('<components></components>', components.join('\n\t'));

					var filepath = '/' + type + '/' + (structure_files.length > 1 ? name + '/' + name : name ) + path.extname(structure_file);

					var file = {};
					file[filepath] = content;

					files.push(file);
				});

				wml.files = wml.files.concat(files);

				if( structure == null || !Array.isArray(structure) )
				{
					resolve(files);
				}
				else
				{
					generateComponents(structure).then(function(){
						resolve(files);
					}).catch(reject);
				}

			} catch (e) {
				reject(e);
			}
		});
	}


	function processData(data){

		var _data = {
			scss: [],
			elements: [],
			content: [],
			components: []
		};


		data.forEach(function(key){
			Object.keys(_data).forEach(function(_key) {
				if (key[_key].length)
					_data[_key].push(key[_key]);
			});
		});

		if( _data.content.length )
			_data.content = '{% set data = {' + format(_data.content, ',', '\n\t', '\n')+'} %}'+'\n\n';
		else
			_data.content = '';

		_data.scss = format(_data.scss, '', '\n\t');
		_data.elements = format(_data.elements, '', '\n\t');
		_data.components = format(_data.components, '', '\n\t');

		return _data;
	}


	function format(array, after, before, last)
	{
		var formatted = '';
		var i = 1;

		array.map(function(value){

			formatted += (typeof before !== 'undefined' ? before : '') + value + (typeof after !== 'undefined' && i < array.length ? after : '');
			i++;
		});

		return formatted + (typeof last !== 'undefined' ? last : '');
	}

	function generateComponents(components){

		return Promise.all(components.map(function(component){
			return generateComponent(component);
		}));
	}


	function generateComponent(component){

		return new Promise(function (resolve, reject) {

			try {
				var key = Object.keys(component)[0];
				var definition = key.split('|');
				var name = definition[0];

				var modifiers = {
					type: name,
					extend: false,
					loop: false,
					tag: false
				};

				definition.forEach(function(filter){

					filter = filter.replace(')','').split('(');

					if( filter[0] in modifiers )
						modifiers[filter[0]] = filter.length > 1 ? filter[1] : true;
				});

				if( name !== 'layout')
				{
					var elements = component[key];

					var structure_path = modifiers.extend ? config.outputPath + '/component/' + modifiers.extend : 'structure/' + config.type + '/' + modifiers.type;

					if( !fs.existsSync(structure_path) )
						structure_path = 'structure/' + config.type + '/default';

					var structure_files = fs.readdirSync(structure_path);

					generateData(elements).then(function(data) {

						var files = [];

						var tag = modifiers.tag ? modifiers.tag : ( name in config.tags ? config.tags[name] : config.tags['default'] );
						tag = typeof tag === 'object' && 'is' in tag ? tag.is : tag;

						structure_files.forEach(function(structure_file){

							var filepath = '/component/' + (structure_files.length > 1 ? name + '/' + name : name) + path.extname(structure_file);
							var content = fs.readFileSync(structure_path + '/' + structure_file, 'utf8');

							if( content.indexOf('<elements></elements>') !== -1 )
								content = data.content + content;

							content = content
								.replace(/{{ name }}/g, camelCase(name))
								.replace(/#{\$name}/g, camelCase(name))
								.replace('<tag', '<'+tag)
								.replace('</tag>', '</'+tag+'>')
								.replace('<elements></elements>', data.elements)
								.replace('<components></components>', data.components)
								.replace('&__#{$elements}{ }', data.scss)
								.replace('\n\t\n\t', '\n\t');

							var file = {};
							file[filepath] = content;

							files.push(file);
						});

						wml.files = wml.files.concat(files);

						resolve({name:name, files:files, modifiers:modifiers});
					});
				}
				else
				{
					resolve(false);
				}
			}
			catch (e) {
				reject(e);
			}
		});
	}


	function getData(element){

		return new Promise(function (resolve, reject) {

			var data = {
				scss :'',
				elements :'',
				content :'',
				components:''
			};

			if( typeof element === 'object')
			{
				generateComponent(element).then(function(component){

					var components = [];

					if( component.modifiers.loop )
						components.push("{% for i in 1.."+(component.modifiers.loop===true?4:component.modifiers.loop)+" %}");

					components.push("\t{% include 'component/"+component.name+".twig' %}");

					if( component.modifiers.loop )
						components.push("{% endfor %}");

					data.components = components.join('\n\t');

					resolve(data);
				});
			}
			else
			{
				if( typeof element === 'string' && element !== 'layout' )
				{
					var tag = element in config.tags ? config.tags[element] : config.tags['default'];
					var html_tag = typeof tag === 'object' && 'is' in tag ? tag.is : ( typeof tag === 'string' ? tag : 'div');
					var content = typeof tag === 'object' && 'data' in tag ? tag.data : '';

					data.content = element+' : '+( content.indexOf('(') !== -1 || content.indexOf('{') !== -1 ? content :  '\''+content+'\'');

					data.scss = '&__'+element+'{  }';

					if( typeof tag === 'object' && 'html' in tag)
						data.elements = tag.html.replace(/{{ data/g, '{{ data.'+element).replace('<tag', '<'+html_tag).replace('</tag>', '</'+html_tag+'>').replace('{{ name }}', element);
					else if( typeof tag === 'object' && 'innerHtml' in tag)
						data.elements = '<'+html_tag+' element="'+element+'">'+tag.innerHtml.replace(/{{ data/g, '{{ data.'+element)+'</'+html_tag+'>';
					else
						data.elements = '<'+html_tag+' element="'+element+'">{{ data.'+element+'|raw }}</'+html_tag+'>';
				}

				resolve(data);
			}
		});
	}


	function generateData(elements){

		if( elements !== null && Array.isArray(elements) )
		{
			return Promise.all(elements.map(function(element){
				return getData(element);
			})).then(function(data){
				return processData(data)
			});
		}
		else
		{
			return Promise.resolve({
				scss: '',
				elements: '',
				content: '',
				components: ''
			});
		}
	}


	function writeFile(data){

		if( Array.isArray(data) )
			return writeFiles(data);
		else
			return new Promise(function (resolve, reject) {

				var filePath = Object.keys(data)[0];
				var content = data[filePath];

				filePath = config.outputPath + filePath;

				try {
					var dirname = path.dirname(filePath);
					mkdir.sync(dirname);

					if( !fs.existsSync(filePath) )
					{
						fs.writeFileSync(filePath, content);
						resolve(true);
					}
					else
					{
						resolve(false);
					}
				}
				catch (e) {
					reject(e);
				}
			});
	}

	function writeFiles(structure){

		return Promise.all(structure.map(writeFile));
	}


	function loadFile(file){

		return new Promise(function (resolve, reject) {
			try {
				var object = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
				resolve(object);
			} catch (e) {
				reject(e);
			}
		});
	}
});


module.exports = function (config) {
	return new wml(config);
};