<template>
	<div class="c-form">

		<form @submit.prevent="submit()" class="form">
			<div class="c-form__container" :class="{'form--loading': loading, 'form--sent': sent}">
				<vue-form-generator tag="div" :schema="form" :model="model" :options="formOptions"></vue-form-generator>
				<button type="submit" class="submit"></button>
			</div>
			<transition name="fade">
				<div class="c-form__action" v-if="loading">
					<img src="/img/loading.gif" alt="please wait" />
				</div>
			</transition>

			<transition name="fade">
				<div class="c-form__action" v-if="sent">
					<img src="/img/sent.gif" alt="Message sent" />
					<p class="text">Message envoyé</p>

				</div>
			</transition>
		</form>

	</div>
</template>

<script>
	import Vue from 'vue';
	export default {
		name: 'form-component',
		data(){
			return{
				model: {},
				form: {
					fields: []
				},
				formOptions: {
					validateAfterLoad: true,
					validateAfterChanged: true
				},
				loading: false,
				sent: false
			}
		},
		props:['data'],
		methods:{
			submit(){

				if( this.loading )
					return;

				let self = this;
				this.loading = true;

				if(this.$refs.subject)
					this.model['subject'] = this.$refs.subject.content;

				Vue.http.post(Vue.http.options.root+'/api/mail', this.model).then(response => {
					self.loading = false;
					self.sent=true;
				}).catch(e => {
					self.loading = false;
					alert(e.body.message)
				});
			}
		},
		computed:{
			page(){
				return this.$store.getters.page(this.$route.path);
			}
		},
		mounted(){

			let baseForm = this.data.form;

			this.model['id'] = this.page.ID;

			this.form['fields'] = [];

			for(let i=0; i < baseForm.length; i++){
				this.form['fields'][i]={};
				this.form['fields'][i]['model'] = baseForm[i].id;
				this.form['fields'][i]['placeholder'] = baseForm[i].label;
				this.form['fields'][i]['required'] = baseForm[i].required;

				this.model[baseForm[i].id]='';

				switch(	baseForm[i].inputType){
					case 'submit':
						this.form['fields'].splice(i,1);
						break;
					case 'textarea':
						this.form['fields'][i]['type'] = 'textArea';
						break;
					case 'select':
						this.form['fields'][i]['values'] = baseForm[i].values;
						this.form['fields'][i]['default'] = baseForm[i].values[0].id;
						this.form['fields'][i]['selectOptions'] = { 'hideNoneSelectedText' : true };
						this.form['fields'][i]['type'] = 'select';
						break;
					case 'hidden':
						this.form['fields'][i]['type'] = 'hidden';
						break;
					default:
						this.form['fields'][i]['type'] = 'input';
						this.form['fields'][i]['inputType'] = baseForm[i].inputType;
						break;
				}
			}
		}
	}
</script>

<style lang="scss">
	@import '../environment';
	.c-form{
		width: 100%; margin: 0 $space;
		@media #{$from-large}{ margin: $space #{$space*2} }
		@media #{$to-phone}{ margin: 0 $space-m }

		.title{
			font-size: $fz-subtitle; max-width: $max-w; margin-left: auto; margin-right: auto;
			& + .form{ margin-top: 5rem }
		}

		.text + .form{ margin-top: 5rem }
		&__subject + *{ margin-top: $space }

		&__container{
			transition: allow(opacity);
			&.form--loading{ opacity: 0.4; pointer-events: none }
			&.form--sent{ opacity: 0; pointer-events: none }
		}

		.form{
			position:relative;
			@media #{$from-small}{
				width: 100%; margin: auto; max-width: $max-w;
			}

			input,textarea{ width: 100%; border: none; border-bottom: solid 1px rgba($c-main,0.2); font-family: "Cormorant", serif; font-weight: 500; padding: 0.7rem 0; font-size: $fz-link; background: transparent }
			.form-group + .form-group{ margin-top: 3rem }
			textarea{ height: 12rem }
			.submit{
				border: none; font-family: "Cormorant", serif; font-weight: 500; background: none; display: flex; align-items: center; justify-content: center;
				padding: 1rem 0 0; cursor: pointer; width: 100%; margin-top: 5rem; font-size: $fz-link;
				&__arrow{
					width: 10rem; height: 1px; background: $c-main; transition: allow(width); position: relative; margin-left: 1.5rem;
					transform-origin: right;
					&:after{
						content: ''; display: inline-block; border: solid $c-main; border-width: 0 1px 1px 0;
						padding: 3px; transform: rotate(-45deg); position: absolute; right: 0; top: -3px;
					}
				}

				&:hover{
					.submit__arrow{ width: 5rem }
				}
			}
		}
		&__action{
			position: overlay(); display: flex; align-items: center; justify-content: center; mix-blend-mode: darken; opacity: 0.8;
			flex-direction: column;
			img{
				width: 50px; height: 50px;
				& + *{ margin-top: #{$space/2}}
			}
		}
	}
</style>
