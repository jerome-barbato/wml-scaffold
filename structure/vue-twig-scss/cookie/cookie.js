import Vue from 'vue';

Vue.component('cookie', {
    template:
    '<transition name="slide-up"><div class="Cookie" v-if="visible"><slot></slot><a class="Cookie__close" @click="hide"></a></div></transition>',
    data(){
        return{
            visible: false
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
});

