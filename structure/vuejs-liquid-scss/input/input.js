import Vue from 'vue';

Vue.directive('upload', {
    inserted: function (el, nodeObj) {

        var $input = el.getElementsByTagName('input');
        var $label = el.getElementsByTagName('span');

        $input[0].addEventListener('change', function(){

            $label[0].innerHTML = this.files[0].name;
        });
    }
});

Vue.directive('empty', {
  inserted: function (el, nodeObj) {

    let empty = function(){
      if (el.value.length > 0)
        el.setAttribute('data-empty', 'false');
      else
        el.setAttribute('data-empty', 'true');
    };

    empty();

    el.addEventListener('focus', empty);
    el.addEventListener('change', empty);
    el.addEventListener('focusout', empty);
    el.addEventListener('keyup', empty);
	}
});


Vue.directive('number', {
  inserted: function (el, nodeObj) {

    function limit(e) {
      var allowedChars = '0123456789';
      function contains(stringValue, charValue) {
        return stringValue.indexOf(charValue) > -1;
      }
      var invalidKey = e.key.length === 1 && !contains(allowedChars, e.key)
        || e.key === '.' && contains(e.target.value, '.');
      invalidKey && e.preventdefault;
    }

    el.addEventListener('keypress', limit);
	}
});

Vue.directive('focus',{
	inserted: function (el, nodeObj) {
		let isElementInViewport = function(el) {
			const rect = el.getBoundingClientRect();
			return (
				rect.top >= 100 &&
				rect.left >= 0 &&
				rect.bottom <= (window.innerHeight || document. documentElement.clientHeight) &&
				rect.right <= (window.innerWidth || document. documentElement.clientWidth)
			);
		};

		el.addEventListener('focus', function(e){
			setTimeout(function(){
				if(!e.target.checkValidity() && !isElementInViewport(e.target)){
					const elementTop = e.target.getBoundingClientRect().top - document.body.getBoundingClientRect().top - 200;
					if(document.documentElement.classList.contains('explorer') || document.documentElement.classList.contains('edge')){
						window.scrollTo(0,elementTop);
					} else {
						window.scrollTo({
							top: elementTop,
							behavior: "smooth"
						});
					}
				}
			}, 100);
		});
	}
});
