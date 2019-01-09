import Vue from 'vue';

Vue.component('responsive_table', {
	template:'<div class="{{ name }}" :class="{ \'{{ name }}--mobile\': this.$root.isMobile }">' +
		' <div v-if="this.$root.isMobile">' +
		'   <select class="{{ name }}__filters" v-model="filtered">' +
		'    <option v-for="(year, index) in table">{{index}}</option>' +
		'   </select>' +
		'   <div class="{{ name }}__table">' +
		'     <div class="{{ name }}__labels">' +
		'      <div>Label 1</div>' +
		'      <div>{{label}}</div>' +
		'     </div>' +
		'    <div class="{{ name }}__item">' +
		'      <div v-for="item in table[filtered]"><span :class="{ \'{{ name }}__empty\' : item === \'\', \'{{ name }}__positive\': item > 0 }">{{item}}</span></div>' +
		'     </div>' +
		'   </div>' +
		'  </div>' +
		' <div v-else>' +
		'   <table class="{{ name }}__table">' +
		'    <thead>' +
		'     <tr class="{{ name }}__labels">' +
		'      <th>Label lignes</th>' +
		'      <th>Label 1</th>' +
		'      <th>{{label}}</th>' +
		'     </tr>' +
		'    </thead>' +
		'    <tbody>' +
		'     <tr v-for="(year, index) in table" class="{{ name }}__item">' +
		'      <td class="{{ name }}__year">{{index}}</td>' +
		'      <td v-for="item in year"><span :class="{ \'{{ name }}__empty\' : item === \'\', \'{{ name }}__positive\': item > 0 }">{{item}}</span></td>' +
		'     </tr>' +
		'    </tbody>' +
		'   </table>' +
		'  </div>' +
		'</div>',
	data (){
		return{
			filtered: 2018
		}
	},
	props: {
		table:{},
		label:{
			default: 'Label personnalisable'
		}
	}
});
