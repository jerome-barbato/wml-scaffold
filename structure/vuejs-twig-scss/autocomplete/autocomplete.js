import Vue from "vue";

Vue.component('autocomplete',{
  template: '<div class="a-autocomplete" :data-empty="empty" :class="{open:\'a-autocomplete--open\'}"> ' +
    '  <div class="a-autocomplete__container"> ' +
    '   <div class="a-autocomplete__tags" v-if="seletedOptions.length"> ' +
    '    <span @click=\'removeOption(option)\' v-for="option in seletedOptions">{{ option.label }}</span> ' +
    '   </div> ' +
    '   <input type="text" name="autocomplete" ref="autocomplete" class="a-autocomplete__field" @input="autoComplete" @focus="focused" v-focus @blur="hideOnClickOutside"/> ' +
    '  </div> ' +
    '  <input type="hidden" :name="name" :value="hiddenValue"/> ' +
    '  <transition name="slideDown"> ' +
    '   <ul class="a-autocomplete__options" v-if="open"> ' +
    '    <li class="a-select__option" @click="addOption(option)" v-for="option in options"> ' +
    '     {{ option.label }}' +
    '    </li> ' +
    '   </ul> ' +
    '  </transition> ' +
    ' </div>',
  data (){
    return{
      options: [],
      seletedOptions: [],
      open: false,
      sending: false,
      empty: 'true',
      hiddenValue: '',
      timeout: false
    }
  },
  props: {
		api:{default: ''},
		name:{},
		value:{default: []},
		isrequired: {default: false},
		label: {default: ''},
		ismultiple: {default: false},
		noresult:{default: 'Pas de résultat'}
  },
  watch:{
    seletedOptions(items){
      if(items.length){
        this.$refs.autocomplete.removeAttribute('required');
        this.hiddenValue =  this.seletedOptions.map(function(elem){return elem.value}).join('|||');
      }
      else
        this.hiddenValue = '';

      this.empty = items.length > 0 ? 'false' : 'true';
    }
  },
	methods:{
		showSelect(){
			this.open = true;
		},
    hideSelect(){
			this.open = false;
    },
    clearSelect(){
			this.open = false;
      this.$refs.autocomplete.value = "";
    },
		hideOnClickOutside(e) {
			if ( !this.$el.contains(e.target) )
        this.clearSelect();
    },
		addOption(option){
		  if( !this.seletedOptions.length || this.ismultiple )
        this.seletedOptions.push(option);

      this.$emit('input', this.seletedOptions);
      this.clearSelect();
		},
		removeOption(option){

      this.seletedOptions = this.seletedOptions.filter(function(el) { return el.value !== option.value });
      this.$emit('input', this.seletedOptions);
    },
    autoComplete() {

		  clearTimeout(this.timeout);

			let value = this.$refs.autocomplete.value;

			if( value.length < 2 || this.sending )
			  return;

			this.$http.post(this.api, {'value':value, 'rows':6}).then(response => {

        this.sending = false;
        this.options = [];

        if(response.data.length === 0){
          let noresult = {'label': this.noresult, 'value': 'false'};
          this.options.push(noresult);
          this.timeout = setTimeout(this.hideSelect, 5000);
        }
        else{
          this.options = response.data;
        }

        this.open = true;

      }, response => {

        this.sending = false;
      });
		},
		focused(){
			this.empty = 'false'
		}
	},
	mounted (){

    this.seletedOptions = this.value;

		if(this.isrequired)
      this.$refs.autocomplete.setAttribute('required','required');

		document.addEventListener('click', this.hideOnClickOutside);
  }
});
