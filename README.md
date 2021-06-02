# WML Scaffolder

Generate pages/layouts/components from wml file

## WML file

wml is based on yml but designed to define structure of html pages

####example :

~~~yml
layout:
    - default:
      - $header:
        - $logo
        - $header nav|extend(nav)
      - $menu:
        - $switch
        - $search
        - close
        - $global:
          - $link
        - address
        - phone
      - $footer:
        - $contact
        - $social
        - $newsletter
        - $globalise
        - $link|loop(2)
  
  catalog:
    - layout: default
    - $nav
    - $heading:
      - $breadcrumb
      - title
      - text
    - $acquisition:
      - title
      - text
      - url
    - $footer
    ``
~~~

## Using command line

run export function

``npm run export -- --input=./structure.wml``

parameters are:
 - output, default `'./export'`
 - input , default `false`
 - type, default `vue-twig-scss`, options : `vuejs-twig-scss|vuejs|vuejs-liquid-scss`
 - design, default `component`, options : `component|atomic|shopify`

## As module

~~~js
const wml = require('metabolism/wml-scaffold');

wml(params).process()
	.then(function(result) {
    	console.log(result);
	done();
	})
	.catch(function(error) {
		console.log(error);
	});
~~~

complete list of parameters:

~~~json5
{
	output: './export',
	input: false,
	acf: {
		path: 'structure/acf',
		ignore: ['close', 'previous', 'next', 'scroll_down', 'header', 'footer']
	},
	type: 'vue-twig-scss',
	design: 'component',
	atomic:['page','organism','molecule','atom'],
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
}
~~~

## WML Syntax

### Specify tag

    component|tag(nav)
        
### Specify type

From type defined in the structure folder

    component|type(list)

### Extend previously declared component

    component|extend(nav)

### Generate foreach loop

    component|loop(3)

## License

MIT
