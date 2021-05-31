
const yaml       = require('js-yaml');
const fs         = require('fs');
const path       = require('path');
const mkdir      = require('mkdirp');
const _camelCase = require('lodash.camelcase');
const _snakeCase = require('lodash.snakecase');

const wml = (function (config) {

	let self = this;

	wml.files = [];
	wml.uid = {};

	config = Object.assign({
		output: './export',
		input: false, //./structure.wml
		acf: {
			path: 'structure/acf',
			ignore: ['close', 'previous', 'next', 'scroll_down', 'header', 'footer']
		},
		type: 'vuejs-twig-scss', //vuejs-twig-scss|vuejs|vuejs-liquid-scss
		design: 'atomic', //component|atomic|shopify
		atomic:['page','organism','molecule','atom'],
		shopify:['templates','sections','snippets'],
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

	if( config.type === "vuejs")
		config.design = "component";

	function deleteFolderRecursive(path) {
		if( fs.existsSync(path) ) {
			fs.readdirSync(path).forEach(function(file,index){
				let curPath = path + "/" + file;
				if(fs.lstatSync(curPath).isDirectory()) {
					deleteFolderRecursive(curPath);
				} else {
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
		}
	}

	function camelCase(string) {

		string = _camelCase(string);
		return string.charAt(0).toUpperCase() + string.slice(1);
	}


	wml.prototype.process = function(){

		return self.loadUniqID()
			.then(function(uid){
				wml.uid = uid;
				return self.loadTags();
			})
			.then(function(tags){
				config.tags = tags;
				return self.loadLanguage();
			})
			.then(function(language){
				config.language = language;
				return self.loadFile(config.input);
			})
			.then(self.generateFiles)
			.then(function(){
				return self.writeFiles(wml.files);
			})
			.then(self.writeUniqID)
	};


	wml.prototype.loadUniqID = function(){

		return new Promise(function (resolve, reject) {
			try {
				let filePath = '.uniqid';
				if( fs.existsSync(filePath) ) {
					let uid = yaml.load(fs.readFileSync(filePath, 'utf8'));
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
				let tags = yaml.load(fs.readFileSync('structure/'+config.type+'/tags.yml', 'utf8'));
				resolve(tags);

			} catch (e) {
				reject(e);
			}
		});
	};


	wml.prototype.loadLanguage = function(){

		return new Promise(function (resolve, reject) {
			try {
				let tags = yaml.load(fs.readFileSync('structure/'+config.type+'/language.yml', 'utf8'));
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
				return self.generatePage(key, structure[key], 'page');
		}));
	};


	wml.prototype.generateLayout = function(structure){

		return Promise.all(structure.map(function(layout){
			let name = Object.keys(layout)[0];
			return self.generatePage(name, layout[name], 'layout');
		}));
	};


	wml.prototype.generatePage = function(name, structure, type){

		return new Promise(function (resolve, reject) {
			try {

				name = _snakeCase(name);

				let files = [];

				let structure_path = 'structure/'+config.type+'/'+type;
				let structure_files = fs.readdirSync(structure_path);

				structure_files.forEach(function(structure_file){

					let content = fs.readFileSync(structure_path+'/'+structure_file, 'utf8');

					content = content
						.replace(/{{ name }}/g, name)
						.replace(/#{\$name}/g, name);

					if( type === 'page' ) {
						if( isArray(structure) && isObject(structure[0]) && 'layout' in structure[0]) {
							let layout_name = _snakeCase(structure[0].layout);
							content = content.replace(/{% extends layout %}\r\n/, '{% extends \'page/layout/'+layout_name+'.twig\' %}\n');
						}
						else {
							content = content.replace(/{% extends layout %}\r\n/, '');
						}
					}

					let components = [];
					let components_import = [];
					let components_list = [];

					if( isArray(structure) ) {
						structure.forEach(function(component){
							let key = ( isObject(component) ? Object.keys(component)[0] : component).split('|');

							if( key[0] !== 'layout') {

								let component_name = _snakeCase(key[0]);

								components_import.push('import '+_camelCase(component_name)+' from "@/component/'+_snakeCase(component_name)+'";');
								components_list.push(_camelCase(component_name));

								let folder = 'component';

								if( config.design !== 'component' )
									folder = config[config.design][1];

								let tag_name = _camelCase(component_name);
								let component = config.language.include.replace('<wml_component', '<'+tag_name).replace('</wml_component', '</'+tag_name).replace('wml_component', folder+"/"+component_name);

								components.push( component );
							}
						});
					}

					content = content.replace('<wml-components></wml-components>', components.join('\n\t'));
					content = content.replace('import wml_components;', components_import.join('\n\t'));
					content = content.replace('components:{ },', 'components:{'+components_list.join(',')+'},');

					let folder = 'page/';

					if( config.design !== 'component' )
						folder = config[config.design][0]+'/';

					let subfolder = structure_files.length > 1 ? name + '/' : '';

					if( type === 'layout'){

						if( config.type === 'vuejs' ){

							folder = '';
							name = 'app';
							subfolder = '';
						}
						else if( config.type.includes('liquid') ){

							folder = 'layout/';
							subfolder = '';
						}
						else{

							folder += 'layout/';
						}
					}

					let filepath = '/design_system/' + folder + subfolder + name + path.extname(structure_file);
					let file = {};
					file[filepath] = content;

					files.push(file);
				});

				addFiles(files);

				if( isArray(structure) ) {
					self.generateComponents(structure, 1, type).then(function(){
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

		let _data = {
			scss: [],
			elements: [],
			content: [],
			components: [],
			fields: [],
			components_list: [],
			components_import: [],
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
		_data.components_list = _data.components_list.join(',');
		_data.components_import = _data.components_import.join('\n\t');

		return _data;
	}


	function format(array, after, before, last) {

		let formatted = '';
		let i = 1;

		array.map(function(value){
			formatted += ( isDefined(before) ? before : '') + value + (isDefined(after) && i < array.length ? after : '');
			i++;
		});

		return formatted + (isDefined(last) ? last : '');
	}


	wml.prototype.generateComponents = function(components, depth, type){

		return Promise.all(components.map(function(component){
			return self.generateComponent(component, depth, type);
		}));
	};


	wml.prototype.getModifiers = function(key){

		let definition = key.split('|');
		let name = definition[0].replace('$', '');

		if( hasKey(config, 'rewrite') && hasKey(config.rewrite, name) )
			name = config.rewrite[name];

		let modifiers = {
			name: name,
			type: _snakeCase(name),
			extend: false,
			loop: false,
			tag: false,
			acf: true
		};

		if( hasKey(config, 'alias') &&  hasKey(config.alias, modifiers.type) )
			modifiers.type = config.alias[modifiers.type];

		definition.forEach(function(filter){

			filter = filter.replace(')','').split('(');

			if( hasKey(modifiers, filter[0]) && filter[0] !== 'name' )
				modifiers[filter[0]] = filter.length > 1 ? parse(filter[1]) : true;
		});

		if( modifiers.loop === true )
			modifiers.loop = 2;

		return modifiers;
	};


	function parse(str) {

		if (isString(str) && str==='false') {
			return false;
		}
		else if (isString(str) && str==='true') {
			return true;
		}

		let number = Number(str);

		if( !isNaN(str) )
			return number;

		return str;
	}


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

		let id = getUniqid( prefix );

		wml.uid[prefix+key] = id;

		return id;

	}


	function getUniqid( prefix ){

		if ( !isDefined(prefix) )
			prefix = "";

		let retId;
		let formatSeed = function (seed, reqWidth) {
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


	wml.prototype.generateComponent = function(component, depth, type){

		return new Promise(function (resolve, reject) {

			try {

				let key = isObject(component) ? Object.keys(component)[0] : component;
				let modifiers = self.getModifiers(key);
				let name = modifiers.name;
				let filename = _snakeCase(name);

				if( name !== 'layout') {

					let structure_path = modifiers.extend ? config.output + '/component/' + modifiers.extend : 'structure/' + config.type + '/' + modifiers.type;

					if( !fs.existsSync(structure_path) )
						structure_path = 'structure/' + config.type + '/default';

					let structure_files = fs.readdirSync(structure_path);

					let elements = isObject(component) ? component[key] : false;

					self.generateData(elements, depth+1, type).then(function(data) {

						let files = [];

						let tag = modifiers.tag ? modifiers.tag : ( hasKey(config.tags, modifiers.type ) ? config.tags[modifiers.type] : config.tags['default'] );
						tag = hasKey(tag, 'is') ? tag.is : (isString(tag) ? tag : 'div');

						structure_files.forEach(function(structure_file){

							let folder = 'component';
							if( config.design !== 'component' )
								folder = config[config.design][depth];

							let filepath = '/design_system/'+folder+'/' + (structure_files.length > 1 ? filename + '/' + filename : filename) + path.extname(structure_file);
							let content = fs.readFileSync(structure_path + '/' + structure_file, 'utf8');

							if( config.language.data && content.indexOf('<wml-elements></wml-elements>') !== -1 && data.content.length)
								content = '{% set data = data|default({\n\t'+data.content+'\n}) %}\n\n' + content;
							else if( path.extname(structure_file) === '.vue')
								content = content.replace("datajs:''", data.content);

							let name = camelCase(modifiers.name);

							if( config.type === "vuejs")
								name = _camelCase(modifiers.name);

							if( config.design !== 'component' )
								name = config[config.design][depth].substr(0, 1) + '-' + _snakeCase(modifiers.name);

							content = content
								.replace(/{{ name }}/g, name)
								.replace(/#{\$name}/g, name)
								.replace('<wml-tag', '<'+tag)
								.replace('</wml-tag>', '</'+tag+'>')
								.replace('<wml-elements></wml-elements>', data.elements)
								.replace('<wml-components></wml-components>', data.components)
								.replace('import wml_components;', data.components_import)
								.replace('components:{ },', 'components:{'+data.components_list+'},')
								.replace('&__#{$elements}{ }', data.scss)
								.replace('.#{$elements}{ }', data.scss)
								.replace(/\n\t\n/, '\n\t');

							let file = {};
							file[filepath] = content;

							files.push(file);
						});

						if( config.acf && data.fields.length && modifiers.acf && type !== 'layout' ) {

							let group = self.generateACFGroup('component', name);
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

		let file = {};
		let filepath = '/acf-json/' + item.key + '.json';
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


	wml.prototype.getData = function(element, depth, type){

		return new Promise(function (resolve, reject) {

			let data = {
				scss: '',
				elements: '',
				content: '',
				components: '',
				components_list: [],
				components_import: [],
				fields: {}
			};

			if( isIterable(element) || isComponent(element) ) {

				if( isComponent(element) ) {

					self.generateComponent(element, depth).then(function(component){

						let components = [];

						if( component.modifiers.loop ){

							if( config.type === 'vuejs-twig-scss')
								components.push("{% for i in 1.."+(component.modifiers.loop === true ? 4 : component.modifiers.loop)+" %}");
							else if( config.type === 'vuejs')
								components.push("<div v-for=\"index in "+(component.modifiers.loop === true ? 4 : component.modifiers.loop)+"\" :key=\"index\">");
						}

						let folder = 'component';
						if( config.design !== 'component' )
							folder = config[config.design][depth];

						let tag_name = _camelCase(component.name);
						let _component = (component.modifiers.loop?'\t':'')+config.language.include.replace('<wml_component', '<'+tag_name).replace('</wml_component', '</'+tag_name).replace('wml_component', folder+"/"+_snakeCase(component.name));

						components.push( _component );

						data.components_list.push(_camelCase(component.name));
						data.components_import.push('import '+_camelCase(component.name)+' from "@/component/'+_snakeCase(component.name)+'";');

						if( component.modifiers.loop ){

							if( config.type === 'vuejs-twig-scss')
								components.push("{% endfor %}");
							else if( config.type === 'vuejs')
								components.push("</div>");
						}

						data.components = components.join('\n\t');

						if( component.modifiers.acf && type !== 'layout' )
							data.fields = self.generateACFComponent('component', component.modifiers.name, component.modifiers.acf);

						resolve(data);
					});
				}
				else{

					self.generateData(element, depth).then(function(data){

						if( isObject(element) ) {

							let modifiers = self.getModifiers(Object.keys(element)[0]);
							let name =  modifiers.name;

							if( data.components.length ) {
								data.elements += data.components;
								data.components = '';
							}

							let tag = modifiers.tag ? modifiers.tag : (hasKey(config.tags, modifiers.type) ? config.tags[modifiers.type] : config.tags['default']);
							let html_tag = hasKey(tag, 'is') ? tag.is : ( isString(tag) ? tag : 'div');
							let elements = "";

							if( hasKey(config, 'components') && hasKey(config.components, name) )
								elements = '<'+name+'>'+data.elements.replace(/\n\t/g,'\n\t\t')+'\n\t</'+name+'>\n';
							else
								elements = '<'+html_tag+' '+(config.language.bem?'element':'class')+'="'+name+'">'+data.elements.replace(/\n\t/g,'\n\t\t')+'\n\t</'+html_tag+'>\n';

							if( modifiers.loop )
								elements = '\n\t{% for i in 1..'+modifiers.loop+' %}\n\t\t'+elements+'\t{% endfor %}\n';
							else
								elements = '\n\n\t'+elements;

							data.elements = elements;

							if( modifiers.acf && type !== 'layout' ){

								let field = self.generateACFComponent(modifiers.loop ? 'repeater' : 'group', name, modifiers.acf);
								field.sub_fields = data.fields[0];

								data.fields = field;
							}
						}

						resolve(data)
					});
				}

			}
			else {
				if( isString(element) && element !== 'layout' ) {
					let modifiers = self.getModifiers(element);
					let name =  modifiers.name;

					let tag = modifiers.type in config.tags ? config.tags[modifiers.type] : config.tags['default'];

					let html_tag = modifiers.tag ? modifiers.tag : ( hasKey(tag, 'is') ? tag.is : ( isString(tag) ? tag : 'div') );
					let content = hasKey(tag, 'data') ? tag.data : '';
					let filename = _snakeCase(name);

					if( content === false )
						data.content = '';
					else
						data.content = filename+' : '+( !isString(content) || content.indexOf('(') !== -1 || content.indexOf('|') !== -1 || content.indexOf('{') !== -1 ? content :  '\''+content+'\'');

					data.scss = (config.language.bem?'&__':'.')+filename+'{  }';


					if( hasKey(tag, 'html') ){

						data.elements = tag.html.replace('<wml-tag', '<'+html_tag).replace('</wml-tag>', '</'+html_tag+'>').replace('{{ name }}', filename);
						data.elements = data.elements.replace(/{{ data/g, '{{ '+(config.language.data?'data.':'')+filename);
						data.elements = data.elements.replace(/="data"/g, '="'+(config.language.data?'data.':'')+filename+'"');
					}
					else if( hasKey(tag, 'innerHtml') )
						data.elements = '<'+html_tag+' '+(config.language.bem?'element':'class')+'="'+filename+'">'+tag.innerHtml.replace(/{{ data/g, '{{ data.'+filename).replace(/="data"/g, '="'+filename+'"')+'</'+html_tag+'>';
					else
						data.elements = '<'+html_tag+' '+(config.language.bem?'element':'class')+'="'+filename+'">{{ '+(config.language.data?'data.':'')+filename+' }}</'+html_tag+'>';

					if( content === false )
						data.elements = data.elements.replace('{{ '+(config.language.data?'data.':'')+filename+' }}', '');

					if( modifiers.acf && type !== 'layout' )
						data.fields = self.generateACFComponent(modifiers.type, name, modifiers.acf);
				}

				resolve(data);
			}
		});
	};


	wml.prototype.generateACFComponent = function(type, name, params){

		if( !config.acf || ( hasKey(config.acf, 'ignore') && hasKey(config.acf.ignore, type) ) )
			return [];

		if( isString(params) )
			params = params.split(',');

		let field = JSON.parse(fs.readFileSync( config.acf.path+'/field/' + (fs.existsSync(config.acf.path+'/field/'+type+'.json') ? type : 'default' ) + '.json', 'utf8'));

		if( type === 'repeater'){
			field.button_label = "Add "+name;
			name = plural(name);
		}

		if( params.indexOf('required') )
			field.required = true;

		field.key = getUniqid('field_');
		field.label = ucFirst(name).replace('_', ' ');
		field.name = name;

		return field;
	};


	wml.prototype.generateACFGroup = function(type, name){

		if( !config.acf || ( hasKey(config.acf, 'ignore') && hasKey(config.acf.ignore, type) ) )
			return [];

		let group = JSON.parse(fs.readFileSync( config.acf.path+'/' + (fs.existsSync(config.acf.path+'/'+type+'.json') ? type : 'default' ) + '.json', 'utf8'));

		group.key = getId('group_', name);
		group.title = ucFirst(name).replace('_', ' ');
		group.modified = Math.round(Date.now()/1000);

		if( type === 'page' )
			group.fields[0].key = getId('field_', 'layout'+name);

		return group;
	};


	wml.prototype.generateData = function(elements, depth, type){

		if( isDefined(elements) && isIterable(elements) ) {
			if( isArray(elements) ) {
				return Promise.all(elements.map(function(element){
					return self.getData(element, depth, type);
				})).then(function(data){
					return processData(data, true)
				});
			}
			else{
				return Promise.all(Object.keys(elements).map(function(key){
					return self.getData(elements[key], depth, type);
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
				fields: [],
				components_list: [],
				components_import: []
			});
		}
	};


	wml.prototype.writeFile = function(data){

		if( Array.isArray(data) ) {
			return self.writeFiles(data);
		}
		else {
			return new Promise(function (resolve, reject) {

				let filePath = Object.keys(data)[0];
				let content = data[filePath];

				filePath = config.output + filePath;

				try {
					let dirname = path.dirname(filePath);
					mkdir.sync(dirname);

					let file_content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

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
				let object = yaml.load(fs.readFileSync(file, 'utf8'));
				resolve(object);
			} catch (e) {
				reject(e);
			}
		});
	};

	deleteFolderRecursive(config.output);

});

if (require.main === module) {

	let args = require('minimist')(process.argv.slice(2));

	new wml(args).process().then(function(result) {
		console.log('Export successful '+result);
	}).catch(function(error) {
		console.log(error);
	});
}
else{

	module.exports = function (config) {
		return new wml(config);
	};
}
