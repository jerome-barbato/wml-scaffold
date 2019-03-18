import Vue from 'vue';

Vue.component('share', {
	template: '<div class="{{ name }}__link" :class="social" @click="share()" :data-icon="social"><slot></slot></div>',
	data (){
		return{
			url: ''
		}
	},
	props: {
		social: {},
		link:{
			default: window.location.href
		},
		text:{},
		title:{},
		subject:{},
		body:{}
	},
	methods: {
		share: function () {

			switch (this.social) {

				case 'facebook':
					this.url = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(this.link);
					this._openWindow(this.url, 'facebookwindow', 533, 355);
					break;

				case 'twitter':
					this.url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(this.text) + '&url=' + encodeURIComponent(this.link);
					this._openWindow(this.url, 'twitterwindow', 550, 254);
					break;

				case 'linkedin':
					this.url = 'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(this.link) + '&title=' + encodeURIComponent(this.title);
					this._openWindow(this.url, 'linkedinwindow', 560, 510);
					break;

				case 'mail':
					this.url = 'mailto:?';

					let is_first = true;

					if (this.subject) {

						this.url += (!is_first ? '&' : '') + 'subject=' + encodeURIComponent(this.subject);

						if (is_first) {
							is_first = false;
						}
					}

					if (this.body) {

						this.url += (!is_first ? '&' : '') + 'body=' + encodeURIComponent(this.body).replace(/%5Cn/g, '%0D%0A');

						if (is_first) {
							is_first = false;
						}
					}

					if (!this.body) {
						this.url += (!is_first ? '&' : '') + 'body=';

						if (is_first) {
							is_first = false;
						}
					}

					this.url += '%20' + encodeURIComponent(this.link);

					window.open(this.url,'_blank');
					break;
			}
		},

		_openWindow: function (url, name, width, height) {
			let screenLeft = 0;
			let screenTop = 0;

			if (!name) name = 'MyWindow';
			if (!width) width = 600;
			if (!height) height = 600;

			if (typeof window.screenLeft !== 'undefined') {
				screenLeft = window.screenLeft;
				screenTop = window.screenTop;

			} else if (typeof window.screenX !== 'undefined') {
				screenLeft = window.screenX;
				screenTop = window.screenY;
			}

			let features_dict = {
				toolbar: 'no',
				location: 'no',
				directories: 'no',
				left: screenLeft + (window.innerWidth - width) / 2,
				top: screenTop + (window.innerHeight - height) / 2,
				status: 'yes',
				menubar: 'no',
				scrollbars: 'yes',
				resizable: 'no',
				width: width,
				height: height
			};

			let features_arr = [];

			for (var k in features_dict) {
				features_arr.push(k + '=' + features_dict[k]);
			}

			let features_str = features_arr.join(',');

			let win = window.open(url, name, features_str);
			win.focus();

			return false;
		}
	}


});