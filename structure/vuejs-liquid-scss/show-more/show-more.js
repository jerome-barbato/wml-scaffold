import Vue from 'vue';

Vue.component('show-more', {
	template: '<div class="a-showmore" :class="open"><a @click="showmore()" class="a-showmore__link"  data-icon="arrow">{{ label }}</a><transition name="slide-down"><div v-if="visible" class="a-showmore__content"><slot></slot></div></transition></div>',
	data (){
		return{
			visible: false,
			label: '',
			open: ''
		}
	},
	props: {
		labelOpen: {},
		labelClose: {}
	},
	methods: {
		showmore(){
			this.visible = !this.visible

			if(!this.visible){
				this.label = this.labelOpen
				this.open = ''
			} else {
				this.label = this.labelClose
				this.open = 'a-showmore--open'
			}
		}
	},
	mounted(){
		this.label = this.labelOpen
	}


});