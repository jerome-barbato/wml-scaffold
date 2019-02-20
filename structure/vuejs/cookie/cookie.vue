<template>
	<transition name="slide-up">
		<div class="Cookie" v-if="visible">
			Lorem ipsum dolor sit amet
			<a :href="url">En savoir plus</a>
			<a class="Cookie__close" @click="hide"></a>
		</div>
	</transition>
</template>

<style lang="scss">
	.Cookie{
		position: fixed; left: 0; bottom: 0; width: 100%; text-align: center; background: #f5f5f5; padding: 2rem; z-index: 6; font-size: 11px; backface-visibility: hidden;
		a{ text-transform: uppercase; display: inline-block; margin-left: 1rem; font-size: 80%; font-weight: bold }
		&__close{
			position: absolute; right: 2rem; width: 2rem; height: 2rem; top: 50%; margin-top: -1rem; cursor: pointer;
			&:after, &:before{ position: absolute; left: 0; width: 100%; height: 2px; top: 50%; margin-top: -1px; content: ''; background: #333 }
			&:after{ transform: rotate(45deg)}
			&:before{ transform: rotate(-45deg)}
		}
	}
</style>

<script>

	export default {
		name: 'cookie',
		data(){
			return{
				visible: false,
				url: ''
			}
		},
		methods:{
			hide(){
				this.setCookie('cookie-notice', true);
				this.visible = false;
				let body_classList = document.body.classList;
				body_classList.remove('has-cookie-notice');
			},
			setCookie(cname, cvalue, exdays) {
				let d = new Date();
				d.setTime(d.getTime() + (exdays*24*60*60*1000));
				let expires = "expires="+ d.toUTCString();
				document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
			},
			getCookie(cname) {
				let name = cname + "=";
				let decodedCookie = decodeURIComponent(document.cookie);
				let ca = decodedCookie.split(';');
				for(let i = 0; i <ca.length; i++) {
					let c = ca[i];
					while (c.charAt(0) === ' ') {
						c = c.substring(1);
					}
					if (c.indexOf(name) === 0) {
						return c.substring(name.length, c.length);
					}
				}
				return "";
			}
		},
		mounted(){

			this.visible = !this.getCookie('cookie-notice').length;

			if( this.visible )
			{
				let body_classList = document.body.classList;
				body_classList.add('has-cookie-notice');
			}
		}
	}
</script>
