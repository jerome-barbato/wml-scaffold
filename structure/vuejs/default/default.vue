<template>
	<tag class="{{ name }}">
		<elements></elements>
		<components></components>
	</tag>
</template>

<script>

	import components;

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
