<template>
	<wml-tag class="{{ name }}">
		<wml-elements></wml-elements>
		<wml-components></wml-components>
	</wml-tag>
</template>

<script>

	import wml_components;

	export default {
		name: '{{ name }}',
		components:{ },
		data(){
			return{
				datajs:''
			}
		}
	}
</script>

<style lang="scss">
	.#{$name}{
		.#{$elements}{ }
	}
</style>
