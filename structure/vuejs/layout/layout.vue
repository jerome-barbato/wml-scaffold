<template>

	<div id="app" v-bind:class="{'has-popin':show_languages, 'online':online, 'offline':!online}">

		<components></components>

		<transition :name="transitionDirection">
			<router-view name="view"></router-view>
		</transition>

	</div>
</template>

<script>

	import components;

	export default {
		name: 'app',
		computed: {
			online: function(){ return this.$shared.online },
			error: function(){

				if( this.$shared.error && typeof this.$shared.error === 'string')
					this.$shared.error = {message: this.$shared.error };

				return this.$shared.error ?
					{
						title: (this.$shared.error && 'title' in this.$shared.error) ? this.$store.getters.translate(this.$shared.error.title) : false,
						message: (this.$shared.error && 'message' in this.$shared.error) ? this.$store.getters.translate(this.$shared.error.message) : 'An error occurred',
					}
					: false
			}
		},
		methods: { },
		components:{ },
		data(){
			return {
				transitionDirection:'slide-in'
			}
		},
		watch: {
			'$route' (to, from) {
				this.transitionDirection = to.meta.depth < from.meta.depth ? 'slide-out' : 'slide-in';
			}
		}
	}
</script>


<style lang="scss">

</style>
