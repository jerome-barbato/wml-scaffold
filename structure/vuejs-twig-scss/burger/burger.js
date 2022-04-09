export default {
	template: '<div class="a-burger">' +
                '<a class="a-burger__link" v-on:click="toggleVisibility"></a>' +
                '<span class="a-burger__icon"></span>' +
              '</div>',
	methods:{
		toggleVisibility: function(){
			document.body.classList.toggle('burger-is-open')
		}
	}
}
