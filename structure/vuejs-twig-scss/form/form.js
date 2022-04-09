export default {
  data(){
    return{
      error:false,
      sending:false,
      send: false,
      form: false
    }
  },
  props: ['base'],
  methods:{
    handleSubmit(){

      if( this.$refs.form.reportValidity() && !this.sending){

        this.sending = true;

        this.$http.post(this.$refs.form.getAttribute('action'), this.form).then(response => {

          this.sending = false;
          this.send = true;

        }, response => {
          alert(response.body.message);
          this.sending = false;
        });
      }
    }
  },
  created(){
    this.form = this.base;
  }
}
