import flatpickr$1 from 'flatpickr';

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
	[ 'day', 'onDayCreate' ],
	[ 'month', 'onMonthChange' ],
	[ 'year', 'onYearChange' ],
];

function flatpickr(node, options) {

	const fp = flatpickr$1(node, options);

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

function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function exclude_internal_props(props) {
    const result = {};
    for (const k in props)
        if (k[0] !== '$')
            result[k] = props[k];
    return result;
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function element(name) {
    return document.createElement(name);
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else
        node.setAttribute(attribute, value);
}
function set_attributes(node, attributes) {
    for (const key in attributes) {
        if (key === 'style') {
            node.style.cssText = attributes[key];
        }
        else if (key in node) {
            node[key] = attributes[key];
        }
        else {
            attr(node, key, attributes[key]);
        }
    }
}
function children(element) {
    return Array.from(element.childNodes);
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach(fn => fn(event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function flush() {
    const seen_callbacks = new Set();
    do {
        // first, call beforeUpdate functions
        // and update components
        while (dirty_components.length) {
            const component = dirty_components.shift();
            set_current_component(component);
            update(component.$$);
        }
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                callback();
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
}
function update($$) {
    if ($$.fragment) {
        $$.update($$.dirty);
        run_all($$.before_update);
        $$.fragment.p($$.dirty, $$.ctx);
        $$.dirty = null;
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    if (component.$$.fragment) {
        run_all(component.$$.on_destroy);
        component.$$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        component.$$.on_destroy = component.$$.fragment = null;
        component.$$.ctx = {};
    }
}
function make_dirty(component, key) {
    if (!component.$$.dirty) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty = blank_object();
    }
    component.$$.dirty[key] = true;
}
function init(component, options, instance, create_fragment, not_equal, prop_names) {
    const parent_component = current_component;
    set_current_component(component);
    const props = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props: prop_names,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty: null
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, props, (key, ret, value = ret) => {
            if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                if ($$.bound[key])
                    $$.bound[key](value);
                if (ready)
                    make_dirty(component, key);
            }
            return ret;
        })
        : props;
    $$.update();
    ready = true;
    run_all($$.before_update);
    $$.fragment = create_fragment($$.ctx);
    if (options.target) {
        if (options.hydrate) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.l(children(options.target));
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
let SvelteElement;
if (typeof HTMLElement !== 'undefined') {
    SvelteElement = class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
        }
        connectedCallback() {
            // @ts-ignore todo: improve typings
            for (const key in this.$$.slotted) {
                // @ts-ignore todo: improve typings
                this.appendChild(this.$$.slotted[key]);
            }
        }
        attributeChangedCallback(attr, _oldValue, newValue) {
            this[attr] = newValue;
        }
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            // TODO should this delegate to addEventListener?
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    };
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

/* src/Flatpickr.svelte generated by Svelte v3.12.1 */

function create_fragment(ctx) {
	var input, flatpickr_action, dispose;

	var input_levels = [
		ctx.attrs,
		{ type: "text" },
		{ readonly: true }
	];

	var input_data = {};
	for (var i = 0; i < input_levels.length; i += 1) {
		input_data = assign(input_data, input_levels[i]);
	}

	return {
		c() {
			input = element("input");
			set_attributes(input, input_data);

			dispose = [
				listen(input, "input", ctx.input_handler),
				listen(input, "search", ctx.search_handler),
				listen(input, "focus", ctx.focus_handler),
				listen(input, "blur", ctx.blur_handler),
				listen(input, "invalid", ctx.invalid_handler),
				listen(input, "ready", ctx.ready_handler),
				listen(input, "open", ctx.open_handler),
				listen(input, "close", ctx.close_handler),
				listen(input, "change", ctx.change_handler),
				listen(input, "update", ctx.update_handler),
				listen(input, "day", ctx.day_handler),
				listen(input, "month", ctx.month_handler),
				listen(input, "year", ctx.year_handler)
			];
		},

		m(target, anchor) {
			insert(target, input, anchor);
			flatpickr_action = flatpickr.call(null, input, ctx.opts) || {};
		},

		p(changed, ctx) {
			set_attributes(input, get_spread_update(input_levels, [
				(changed.attrs) && ctx.attrs,
				{ type: "text" },
				{ readonly: true }
			]));

			if (typeof flatpickr_action.update === 'function' && changed.opts) {
				flatpickr_action.update.call(null, ctx.opts);
			}
		},

		i: noop,
		o: noop,

		d(detaching) {
			if (detaching) {
				detach(input);
			}

			if (flatpickr_action && typeof flatpickr_action.destroy === 'function') flatpickr_action.destroy();
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let opts, attrs;

	function input_handler(event) {
		bubble($$self, event);
	}

	function search_handler(event) {
		bubble($$self, event);
	}

	function focus_handler(event) {
		bubble($$self, event);
	}

	function blur_handler(event) {
		bubble($$self, event);
	}

	function invalid_handler(event) {
		bubble($$self, event);
	}

	function ready_handler(event) {
		bubble($$self, event);
	}

	function open_handler(event) {
		bubble($$self, event);
	}

	function close_handler(event) {
		bubble($$self, event);
	}

	function change_handler(event) {
		bubble($$self, event);
	}

	function update_handler(event) {
		bubble($$self, event);
	}

	function day_handler(event) {
		bubble($$self, event);
	}

	function month_handler(event) {
		bubble($$self, event);
	}

	function year_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$new_props => {
		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
	};

	$$self.$$.update = ($$dirty = { $$props: 1 }) => {
		{
				let	{ options, ...other } = $$props;
				$$invalidate('attrs', attrs = other);
				$$invalidate('opts', opts = options);
			}
	};

	return {
		opts,
		attrs,
		input_handler,
		search_handler,
		focus_handler,
		blur_handler,
		invalid_handler,
		ready_handler,
		open_handler,
		close_handler,
		change_handler,
		update_handler,
		day_handler,
		month_handler,
		year_handler,
		$$props: $$props = exclude_internal_props($$props)
	};
}

class Flatpickr extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, []);
	}
}

export { Flatpickr, flatpickr };
