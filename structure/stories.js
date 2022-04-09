import twig from './$name.html.twig';

export default {
    title: 'Components/$Folder/$Name',
    parameters: {
        componentSource: {
            code: `{% include 'components/$folder/$name/$name.html.twig' with { 
	props: {
		$code
	}
} %}`,
            language: 'twig'
        }
    },
    argTypes: {
    $argTypes
    }
};

export const Default = ({ $args }) => {

    //if( window.requireReload() )
      //  return '';

    return twig({
        props:{
    $props
        }
    });
}

Default.args = {
    $content
}
