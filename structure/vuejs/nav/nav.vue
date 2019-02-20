<nav class="{{ name }}">
	<ul>
		<li class="{{ name }}__item" v-for="item in data">
			<a :href="item.link">{{ item.title }}</a>
		</li>
	</ul>
</nav>
