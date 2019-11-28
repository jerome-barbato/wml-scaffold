import Vue from "vue";

Vue.component('custom-select',{
  template: ' <div class="a-select" :data-empty="empty"> ' +
    '  <div class="a-select__selected" @click="toggleSelect" v-html="text"></div> ' +
    '  <transition name="slideDown"> ' +
    '   <ul class="a-select__options" v-show="open"> ' +
    '    <li @click="toggleOption(\'\')"></li> ' +
    '    <li class="a-select__option" :class="{\'a-select__option--selected\':(!ismultiple&&option.value==content)||(ismultiple&&content.indexOf(option.value)>-1)}" @click="toggleOption(option,$event)" v-for="option in options"> ' +
    '     {{ option.label }}' +
    '    </li> ' +
    '   </ul> ' +
    '  </transition> ' +
    '  <select :name="name" v-model="content" ref="select" @input="handleInput" v-focus> ' +
    '   <option value=""></option> ' +
    '   <option v-for="option in list" :value="option.value"> ' +
    '    {{ option.label }}' +
    '   </option> ' +
    '  </select> ' +
    ' </div>',
  data (){
    return{
      desktop: true,
      mobile: false,
      open: false,
      text: '',
      empty: 'true',
      pluralname: 'éléments',
      list: [],
      content: this.value
    }
  },
  props: {
    options:{default: []},
    name:{},
    value:{default: []},
    isrequired: {default: false},
    label: {default: ''},
    ismultiple: {default: false},
    plural:{}
  },
  watch:{
    content(){
      this.handleText();
      this.handleInput();
    }
  },
  methods:{
    toggleSelect(){
      this.open = !this.open;
    },
    handleInput (e) {
      this.$emit('input', this.content)
    },
    hideOnClickOutside(e) {
      if (!this.$el.contains(e.target) && this.open)
        this.toggleSelect();
    },
    toggleOption(option,event){

      if(this.ismultiple){

        let index = this.content.indexOf(option.value);

        if( index < 0 )
          this.content.push(option.value);
        else
          this.content.splice(index, 1);

      } else {

        this.content = option.value ? option.value : "";
        this.toggleSelect();
      }

      this.handleDataEmpty();
    },
    handleDataEmpty(){
      this.empty = this.content.length > 0 ? 'false' : 'true';
    },
    getLabelFromValue(value){
      for(let i in this.list){
        if( this.list[i].value === value ){

          return this.list[i].label;
          break;
        }
      }
      return "";
    },
    handleText(){
      this.text= '';
      if(this.content.length > 0){
        if(this.ismultiple){
          if( this.content.length > 1 )
            this.text = this.content.length + " " + this.pluralname;
          else
            this.text = this.getLabelFromValue(this.content[0]);
        } else {
          this.text = this.getLabelFromValue(this.content);
        }
      }
    }
  },
  mounted (){
    const select = this.$refs.select;

    this.list = this.options;

    if(this.isrequired)
      select.setAttribute('required','required');

    if(this.ismultiple)
      select.setAttribute('multiple','multiple');

    if(this.plural)
      this.pluralname = this.plural;

    select.addEventListener('focus', this.handleDataEmpty);
    select.addEventListener('change', this.handleDataEmpty);
    select.addEventListener('focusout', this.handleDataEmpty);
    select.addEventListener('keyup', this.handleDataEmpty);

    document.addEventListener('click', this.hideOnClickOutside);

    this.handleDataEmpty();
    this.handleText();
  },
  destroyed (){
    document.removeEventListener('click', this.hideOnClickOutside);
  }
});
