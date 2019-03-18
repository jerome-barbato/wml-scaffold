<template>

	<main class="page-{{ name }}">

		<div class="container">

			<components></components>
		</div>
	</main>

</template>

<style scoped lang="scss">

</style>

<script>

	import components;

	export default {
		data() {
			return {
			}
		},
		methods:{ },
		components:{ },
		computed : { },
		head: {
			title(){
				return {
					inner: 'Title'
				}
			},
		meta() {
			return [
				{ name: 'description', content: 'Description lorem ipsum' },
				{ property: 'og:image', content: '/static/img/placeholder.jpg' },
			]
		}
	}
</script>
