# svelte-flatpickr

Flatpickr action and component for [Svelte 3](https://svelte.dev). [demo](https://svelte.dev/repl/0869686a58b54c76b26eec7ccd57e0f7?version=3.12.1)

## Usage

Install with npm or yarn:

```bash
npm install --save svelte-flatpickr
```

## Parameters

Any options of Flatpickr can be passed to action as options or Flatpickr component via `options` prop.

Import `Flatpickr` component to your Svelte app. `options` prop will be passed to `flatpickr` action. Any other props will be assigned to input element itself.

```html
<label>
	<Flatpickr name="modified" {options} on:open={open} />
</label>
 
<script>
  import { Flatpickr } from 'svelte-flatpickr';

  let options = {
    altInput: true,
    dateFormat: 'Z'
  };

  function open() {
    console.log('opened');
  }
</script>
```

OR import `flatpickr` action to get full control.

```html
<label>
	<input use:flatpickr={options} name="modified" on:open={open}>
</label>
 
<script>
  import { flatpickr } from 'svelte-flatpickr';

  let options = {
    altInput: true,
    dateFormat: 'Z'
  };

  function open() {
    console.log('opened');
  }
</script>
```

## Events

- `change` - event fired when the user selects a date, or changes the time on a selected date
- `update` - event fired when the input value is updated with a new date string
- `ready` - event fired once the calendar is in a ready state
- `open` - event fired when the calendar is opened
- `close` - event fired when the calendar is closed
- `month` - event fired when the month is changed, either by the user or programmatically
- `year` - event fired when the year is changed, either by the user or programmatically
- `day` - event to take full control of every date cell

## License

MIT &copy; [PaulMaly](https://github.com/PaulMaly)
