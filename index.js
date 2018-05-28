
var yaml       = require('js-yaml');
var fs         = require('fs');
var path       = require('path');
var mkdir      = require('mkdirp');
var _camelCase = require('lodash.camelcase');
var _snakeCase = require('lodash.snakecase');

var wml = (function (config) {

	var self = this;

	wml.files = [];
	wml.uid = {};

	config = Object.assign({
		outputPath: '.',
		acf: {
			path: 'structure/acf',
			ignore: ['close', 'previous', 'next', 'next', 'scroll_down']
		},
		type: 'vue-twig-scss',
		alias: {
			'description': 'text',
			'breadcrumb': 'nav',
			'thumbnail': 'image',
			'poster': 'image',
			'picto': 'icon'
		},
		rewrite: {
			'img': 'image',
			'email': 'mail',
			'url': 'link',
			'prev': 'previous'
		},
		components: ['slider', 'slide']

	}, config);


	wml.prototype.process = function(args){

		return self.loadUniqID()
			.then(function(uid){
				wml.uid = uid;
				return self.loadTags();
			})
			.then(function(tags){
				config.tags = tags;
				return self.loadFile(args);
			})
			.then(self.generateFiles)
			.then(function(){
				return self.writeFiles(wml.files);
			})
			.then(self.writeUniqID)
	};


	function camelCase(string) {

		string = _camelCase(string);
		return string.charAt(0).toUpperCase() + string.slice(1);
	}


	wml.prototype.loadUniqID = function(){

		return new Promise(function (resolve, reject) {
			try {
				var filePath = '.uniqid';
				if( fs.existsSync(filePath) ) {
					var uid = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
					resolve(uid);
				}
				else {
					resolve({});
				}

			} catch (e) {
				reject(e);
			}
		});
	};


	wml.prototype.writeUniqID = function(){

		return new Promise(function (resolve, reject) {
			try {
				fs.writeFileSync('.uniqid', JSON.stringify(wml.uid));
				resolve(true);
			}
			catch (e) {
				reject(e);
			}
		});
	};


	wml.prototype.loadTags = function(){

		return new Promise(function (resolve, reject) {
			try {
				var tags = yaml.safeLoad(fs.readFileSync('structure/'+config.type+'/tags.wml', 'utf8'));
				resolve(tags);

			} catch (e) {
				reject(e);
			}
		});
	};


	wml.prototype.generateFiles = function(structure){

		return Promise.all(Object.keys(structure).map(function(key){
			if( key === 'layout' )
				return self.generateLayout(structure[key]);
			else
				return self.generatePage(key, structure[key]);
		}));
	};


	wml.prototype.generateLayout = function(structure){

		return Promise.all(structure.map(function(layout){
			var name = Object.keys(layout)[0];
			return self.generatePage(name, layout[name], 'layout');
		}));
	};


	wml.prototype.generatePage = function(name, structure, type){

		return new Promise(function (resolve, reject) {
			try {
				if( !isDefined(type) )
					type = 'page';

				name = _snakeCase(name);

				var files = [];

				var structure_path = 'structure/'+config.type+'/'+type;
				var structure_files = fs.readdirSync(structure_path);

				structure_files.forEach(function(structure_file){
					var content = fs.readFileSync(structure_path+'/'+structure_file, 'utf8');

					content = content
						.replace(/{{ name }}/g, name)
						.replace(/#{\$name}/g, name);

					if( type === 'page' ) {
						if( isArray(structure) && isObject(structure[0]) && 'layout' in structure[0]) {
							var layout_name = _snakeCase(structure[0].layout);
							content = content.replace(/{% extends layout %}\r\n/, '{% extends \'layout/'+layout_name+'.twig\' %}\n');
						}
						else {
							content = content.replace(/{% extends layout %}\r\n/, '');
						}
					}

					var components = [];

					if( isArray(structure) ) {
						structure.forEach(function(component){
							var key = ( isObject(component) ? Object.keys(component)[0] : component).split('|');

							if( key[0] !== 'layout') {
								var component_name = _snakeCase(key[0]);
								components.push("{% include 'component/"+component_name+".twig' %}");
							}
						});
					}

					content = content.replace('<components></components>', components.join('\n\t'));

					var filepath = '/' + type + '/' + (structure_files.length > 1 ? name + '/' + name : name ) + path.extname(structure_file);

					var file = {};
					file[filepath] = content;

					files.push(file);
				});

				addFiles(files);

				if( isArray(structure) ) {
					self.generateComponents(structure).then(function(){
						resolve(files);
					}).catch(reject);
				}
				else {
					resolve(files);
				}

			} catch (e) {
				reject(e);
			}
		});
	};


	function processData(data, indent){

		var _data = {
			scss: [],
			elements: [],
			content: [],
			components: [],
			fields: []
		};

		data.forEach(function(key){

			Object.keys(_data).forEach(function(_key) {
				if (isObject(key[_key]) || ( (isString(key[_key]) || isArray(key[_key])) && key[_key].length))
					_data[_key].push(key[_key]);
			});
		});

		if( indent )
			_data.content = format(_data.content, ',\n\t');
		else
			_data.content = format(_data.content, ',');

		_data.scss = format(_data.scss, '', '\n\t');
		_data.elements = format(_data.elements, '', '\n\t');
		_data.components = format(_data.components, '', '\n\t');

		return _data;
	}


	function format(array, after, before, last) {

		var formatted = '';
		var i = 1;

		array.map(function(value){
			formatted += ( isDefined(before) ? before : '') + value + (isDefined(after) && i < array.length ? after : '');
			i++;
		});

		return formatted + (isDefined(last) ? last : '');
	}


	wml.prototype.generateComponents = function(components){

		return Promise.all(components.map(function(component){
			return self.generateComponent(component);
		}));
	};


	wml.prototype.getModifiers = function(key){

		var definition = key.split('|');
		var name = definition[0].replace('$', '');

		if( hasKey(config, 'rewrite') && hasKey(config.rewrite, name) )
			name = config.rewrite[name];

		var modifiers = {
			name: name,
			type: _snakeCase(name),
			extend: false,
			loop: false,
			tag: false
		};

		if( hasKey(config, 'alias') &&  hasKey(config.alias, modifiers.type) )
			modifiers.type = config.alias[modifiers.type];

		definition.forEach(function(filter){

			filter = filter.replace(')','').split('(');

			if( hasKey(modifiers, filter[0]) && filter[0] !== 'name' )
				modifiers[filter[0]] = filter.length > 1 ? filter[1] : true;
		});

		if( modifiers.loop === true )
			modifiers.loop = 2;

		return modifiers;
	};


	function ucFirst(str) {
		if (isString(str) && str.length > 0) {
			return str[0].toUpperCase() + str.substring(1);
		} else {
			return str;
		}
	}


	function getId( prefix, key ){

		if( hasKey(wml.uid, prefix+key) )
			return wml.uid[prefix+key];

		var id = getUniqid( prefix );

		wml.uid[prefix+key] = id;

		return id;

	}


	function getUniqid( prefix ){

		if ( !isDefined(prefix) )
			prefix = "";

		var retId;
		var formatSeed = function (seed, reqWidth) {
			seed = parseInt(seed, 10).toString(16); // to hex str
			if (reqWidth < seed.length) { // so long we split
				return seed.slice(seed.length - reqWidth);
			}
			if (reqWidth > seed.length) { // so short we pad
				return Array(1 + (reqWidth - seed.length)).join('0') + seed;
			}
			return seed;
		};

		// BEGIN REDUNDANT
		if (!this.php_js) {
			this.php_js = {};
		}

		// END REDUNDANT
		if (!this.php_js.uniqidSeed) { // init seed with big random int
			this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
		}

		this.php_js.uniqidSeed++;

		retId = prefix; // start with prefix, add current milliseconds hex string
		retId += formatSeed(parseInt(new Date().getTime() / 1000, 10), 8);
		retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string

		return retId;

	}


	wml.prototype.generateComponent = function(component){

		return new Promise(function (resolve, reject) {

			try {

				var key = isObject(component) ? Object.keys(component)[0] : component;
				var modifiers = self.getModifiers(key);
				var name = modifiers.name;
				var filename = _snakeCase(name);

				if( name !== 'layout') {

					var structure_path = modifiers.extend ? config.outputPath + '/component/' + modifiers.extend : 'structure/' + config.type + '/' + modifiers.type;

					if( !fs.existsSync(structure_path) )
						structure_path = 'structure/' + config.type + '/default';

					var structure_files = fs.readdirSync(structure_path);

					var elements = isObject(component) ? component[key] : false;

					self.generateData(elements).then(function(data) {

						var files = [];

						var tag = modifiers.tag ? modifiers.tag : ( hasKey(config.tags, modifiers.type ) ? config.tags[modifiers.type] : config.tags['default'] );
						tag = hasKey(tag, 'is') ? tag.is : (isString(tag) ? tag : 'div');

						structure_files.forEach(function(structure_file){

							var filepath = '/component/' + (structure_files.length > 1 ? filename + '/' + filename : filename) + path.extname(structure_file);
							var content = fs.readFileSync(structure_path + '/' + structure_file, 'utf8');

							if( content.indexOf('<elements></elements>') !== -1 && data.content.length )
								content =  '{% set data = data|default({\n\t'+data.content+'\n}) %}\n\n' + content;

							content = content
								.replace(/{{ name }}/g, camelCase(name))
								.replace(/#{\$name}/g, camelCase(name))
								.replace('<tag', '<'+tag)
								.replace('</tag>', '</'+tag+'>')
								.replace('<elements></elements>', data.elements)
								.replace('<components></components>', data.components)
								.replace('&__#{$elements}{ }', data.scss)
								.replace(/\n\t\n/, '\n\t');

							var file = {};
							file[filepath] = content;

							files.push(file);
						});

						if( config.acf && data.fields.length ) {

							var group = self.generateACFGroup('component', name);
							group.fields = data.fields;
							files.push( createACFFile(group) );
						}

						addFiles(files);

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
	};


	function addFiles(files){

		wml.files = wml.files.concat(files);
	}

	function createACFFile(item){

		var file = {};
		var filepath = '/acf-json/' + item.key + '.json';
		file[filepath] = JSON.stringify(item);

		return file;
	}


	function isObject(item){
		return isDefined(item) && typeof item === 'object' && item.constructor === Object;
	}

	function hasKey(item, key){
		if( isArray(item) )
			return item.indexOf(key) !== -1;
		else
			return isObject(item) && (key in item);
	}

	function isArray(item){
		return isDefined(item) && Array.isArray(item);
	}

	function isIterable(item){
		return isDefined(item) && typeof item === 'object';
	}

	function isDefined(item){
		return item !== null && typeof item !== 'undefined'
	}

	function isString(item){
		return isDefined(item) && typeof item === 'string';
	}

	function isComponent(item){
		return isDefined(item) && ((isObject(item) && Object.keys(item)[0].indexOf('$') === 0) || ( isString(item) && item.indexOf('$') === 0 ));
	}

	function plural(name){
		return name.length ? (name.substr(-1) === 'y' ? name.slice(0, -1)+'ies' : name+'s') : '';
	}


	wml.prototype.getData = function(element){

		return new Promise(function (resolve, reject) {

			var data = {
				scss: '',
				elements: '',
				content: '',
				components: '',
				fields: {}
			};

			if( isIterable(element) || isComponent(element) ) {

				if( isComponent(element) ) {

					self.generateComponent(element).then(function(component){

						var components = [];

						if( component.modifiers.loop )
							components.push("{% for i in 1.."+(component.modifiers.loop === true ? 4 : component.modifiers.loop)+" %}");

						components.push((component.modifiers.loop?'\t':'')+"{% include 'component/"+_snakeCase(component.name)+".twig' %}");

						if( component.modifiers.loop )
							components.push("{% endfor %}");

						data.components = components.join('\n\t');
						data.fields = self.generateACFComponent('component', component.modifiers.name);

						resolve(data);
					});
				}
				else{

					self.generateData(element).then(function(data){

						if( isObject(element) ) {

							var modifiers = self.getModifiers(Object.keys(element)[0]);
							var name =  modifiers.name;

							if( data.components.length ) {
								data.elements += data.components;
								data.components = '';
							}

							var tag = modifiers.tag ? modifiers.tag : (hasKey(config.tags, modifiers.type) ? config.tags[modifiers.type] : config.tags['default']);
							var html_tag = hasKey(tag, 'is') ? tag.is : ( isString(tag) ? tag : 'div');
							var elements = "";

							if( hasKey(config, 'components') && hasKey(config.components, name) )
								elements = '<'+name+'>'+data.elements.replace(/\n\t/g,'\n\t\t')+'\n\t</'+name+'>\n';
							else
								elements = '<'+html_tag+' element="'+name+'">'+data.elements.replace(/\n\t/g,'\n\t\t')+'\n\t</'+html_tag+'>\n';

							if( modifiers.loop )
								elements = '\n\t{% for i in 1..'+modifiers.loop+' %}\n\t\t'+elements+'\t{% endfor %}\n';
							else
								elements = '\n\n\t'+elements;

							data.elements = elements;

							var field = self.generateACFComponent(modifiers.loop ? 'repeater' : 'group');
							field.sub_fields = data.fields[0];

							data.fields = field;
						}

						resolve(data)
					});
				}

			}
			else {
				if( isString(element) && element !== 'layout' ) {
					var modifiers = self.getModifiers(element);
					var name =  modifiers.name;

					var tag = modifiers.type in config.tags ? config.tags[modifiers.type] : config.tags['default'];

					var html_tag = modifiers.tag ? modifiers.tag : ( hasKey(tag, 'is') ? tag.is : ( isString(tag) ? tag : 'div') );
					var content = hasKey(tag, 'data') ? tag.data : '';
					var filename = _snakeCase(name);

					if( content === false )
						data.content = '';
					else
						data.content = filename+' : '+( !isString(content) || content.indexOf('(') !== -1 || content.indexOf('{') !== -1 ? content :  '\''+content+'\'');

					data.scss = '&__'+filename+'{  }';


					if( hasKey(tag, 'html') )
						data.elements = tag.html.replace(/{{ data/g, '{{ data.'+filename).replace('<tag', '<'+html_tag).replace('</tag>', '</'+html_tag+'>').replace('{{ name }}', filename);
					else if( hasKey(tag, 'innerHtml') )
						data.elements = '<'+html_tag+' element="'+filename+'">'+tag.innerHtml.replace(/{{ data/g, '{{ data.'+filename)+'</'+html_tag+'>';
					else
						data.elements = '<'+html_tag+' element="'+filename+'">{{ data.'+filename+'|raw }}</'+html_tag+'>';

					if( content === false )
						data.elements = data.elements.replace('{{ data.'+filename+'|raw }}', '');

					data.fields = self.generateACFComponent(modifiers.type, name);
				}

				resolve(data);
			}
		});
	};


	wml.prototype.generateACFComponent = function(type, name){

		if( !config.acf || ( hasKey(config.acf, 'ignore') && hasKey(config.acf.ignore, type) ) )
			return [];

		var field = JSON.parse(fs.readFileSync( config.acf.path+'/field/' + (fs.existsSync(config.acf.path+'/field/'+type+'.json') ? type : 'default' ) + '.json', 'utf8'));

		if( type === 'repeater'){
			field.button_label = "Add "+name;
			name = plural(name);
		}

		field.key = getUniqid('field_');
		field.label = ucFirst(name).replace('_', ' ');
		field.name = name;

		return field;
	};


	wml.prototype.generateACFGroup = function(type, name){

		if( !config.acf || ( hasKey(config.acf, 'ignore') && hasKey(config.acf.ignore, type) ) )
			return [];

		var group = JSON.parse(fs.readFileSync( config.acf.path+'/' + (fs.existsSync(config.acf.path+'/'+type+'.json') ? type : 'default' ) + '.json', 'utf8'));

		group.key = getId('group_', name);
		group.title = ucFirst(name).replace('_', ' ');
		group.modified = Math.round(Date.now()/1000);

		if( type === 'page' )
			group.fields[0].key = getId('field_', 'layout'+name);

		return group;
	};


	wml.prototype.generateData = function(elements){

		if( isDefined(elements) && isIterable(elements) ) {
			if( isArray(elements) ) {
				return Promise.all(elements.map(function(element){
					return self.getData(element);
				})).then(function(data){
					return processData(data, true)
				});
			}
			else{
				return Promise.all(Object.keys(elements).map(function(key){
					return self.getData(elements[key]);
				})).then(function(data){
					return processData(data, false)
				});
			}
		}

		else {

			return Promise.resolve({
				scss: '',
				elements: '',
				content: '',
				components: '',
				fields: []
			});
		}
	};


	wml.prototype.writeFile = function(data){

		if( Array.isArray(data) ) {
			return self.writeFiles(data);
		}
		else {
			return new Promise(function (resolve, reject) {

				var filePath = Object.keys(data)[0];
				var content = data[filePath];

				filePath = config.outputPath + filePath;

				try {
					var dirname = path.dirname(filePath);
					mkdir.sync(dirname);

					var file_content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

					if( content.length > file_content.length ) {
						fs.writeFileSync(filePath, content);
						resolve(true);
					}
					else {
						resolve(false);
					}
				}
				catch (e) {
					reject(e);
				}
			});
		}
	};


	wml.prototype.writeFiles = function(structure){

		return Promise.all(structure.map(self.writeFile));
	};


	wml.prototype.loadFile = function(file){

		return new Promise(function (resolve, reject) {
			try {
				var object = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
				resolve(object);
			} catch (e) {
				reject(e);
			}
		});
	};

});


module.exports = function (config) {
	return new wml(config);
};