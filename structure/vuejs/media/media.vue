<template>
	<picture v-if="src && 'sizes' in src">
		<source media="(max-width: 768px)" v-for="(data, ext) in src.sizes[mobile]" :srcset="root+data.file" :type="data['mime-type']" v-if="mobile in src.sizes">
		<source v-for="(data, ext) in src.sizes[desktop]" :srcset="root+data.file" :type="data['mime-type']" v-if="desktop in src.sizes && src.extension != 'svg'">
		<img :src="root+src.sizes[desktop][src.extension].file" :alt="alt" v-if="desktop in src.sizes && src.extension in src.sizes[desktop]"/>
		<img :src="root+src.file" :alt="alt" v-else/>
	</picture>
</template>

<script>
	import Vue from 'vue';
	export default {
		name: 'media',
		props:{
			src:{
				default: false
			},
			alt:{
				default: false
			},
			desktop:{
				default:'large'
			},
			mobile:{
				default:'mobile'
			}
		},
		computed:{
			root(){
				return Vue.http.options.root
			}
		}
	}
</script>