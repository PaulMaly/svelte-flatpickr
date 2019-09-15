import flatpickr from 'flatpickr';

function event(el, name) {
	return (...detail) => {
		const e = new CustomEvent(name, { detail });
		el.dispatchEvent(e);
	}
}

const events = [
	[ 'ready', 'onReady' ],
	[ 'open', 'onOpen' ],
	[ 'close', 'onClose' ],
	[ 'change', 'onChange' ],
	[ 'update', 'onValueUpdate' ],
	[ 'keydown', 'onKeyDown' ],
	[ 'day', 'onDayCreate' ],
	[ 'month', 'onMonthChange' ],
	[ 'year', 'onYearChange' ],
	[ 'destroy', 'onDestroy' ],
	[ 'position', 'onPreCalendarPosition' ]
];

export default function(node, options) {

	const fp = flatpickr(node, options);

	events.forEach(([ name, hook ]) => {
		fp.config[hook] && fp.config[hook].push(event(node, name));
	});

    return {
        update(newOptions) {
            Object.keys(newOptions).forEach(key => {
                if (options[key] !== newOptions[key]) {
                    fp.set(key, newOptions[key]);
                }
            });
            options = newOptions;
        },
        destroy() {
            fp.destroy();
        }
    };
}
