<input
	use:flatpickr={opts}
	{...attrs}
	type="text"
	readonly
	on:input
	on:search
	on:focus
	on:blur
	on:invalid
	on:keydown
	on:ready
	on:open
	on:close
	on:change
	on:update
	on:day
	on:month
	on:year
	on:destroy
	on:position
>

<script>
	import flatpickr from './action.js';

	let opts, attrs;
	$: {
		let	{ options, ...other } = $$props;
		attrs = other;
		opts = options;
	}
</script>
