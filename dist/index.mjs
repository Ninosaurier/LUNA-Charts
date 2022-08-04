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
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function get_all_dirty_from_scope($$scope) {
    if ($$scope.ctx.length > 32) {
        const dirty = [];
        const length = $$scope.ctx.length / 32;
        for (let i = 0; i < length; i++) {
            dirty[i] = -1;
        }
        return dirty;
    }
    return -1;
}
function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_style(node, key, value, important) {
    if (value === null) {
        node.style.removeProperty(key);
    }
    else {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
}
// unfortunately this can't be a constant as that wouldn't be tree-shakeable
// so we cache the result instead
let crossorigin;
function is_crossorigin() {
    if (crossorigin === undefined) {
        crossorigin = false;
        try {
            if (typeof window !== 'undefined' && window.parent) {
                void window.parent.document;
            }
        }
        catch (error) {
            crossorigin = true;
        }
    }
    return crossorigin;
}
function add_resize_listener(node, fn) {
    const computed_style = getComputedStyle(node);
    if (computed_style.position === 'static') {
        node.style.position = 'relative';
    }
    const iframe = element('iframe');
    iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
        'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    const crossorigin = is_crossorigin();
    let unsubscribe;
    if (crossorigin) {
        iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
        unsubscribe = listen(window, 'message', (event) => {
            if (event.source === iframe.contentWindow)
                fn();
        });
    }
    else {
        iframe.src = 'about:blank';
        iframe.onload = () => {
            unsubscribe = listen(iframe.contentWindow, 'resize', fn);
        };
    }
    append(node, iframe);
    return () => {
        if (crossorigin) {
            unsubscribe();
        }
        else if (unsubscribe && iframe.contentWindow) {
            unsubscribe();
        }
        detach(iframe);
    };
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
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
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
    const saved_component = current_component;
    do {
        // first, call beforeUpdate functions
        // and update components
        while (flushidx < dirty_components.length) {
            const component = dirty_components[flushidx];
            flushidx++;
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        flushidx = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
    else if (callback) {
        callback();
    }
}

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
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
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false,
        root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
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
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = new Set();
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (const subscriber of subscribers) {
                    subscriber[1]();
                    subscriber_queue.push(subscriber, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.add(subscriber);
        if (subscribers.size === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            subscribers.delete(subscriber);
            if (subscribers.size === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

const defaultTheme = [
    {
        name: "default",
        color: {
            primary: "#1580bc",
            secondary: "#bd8016",
            tertiary: "#0ccd6c",
            quaternary: "#cd0c0c",
        },
        circles: {
            radius: "3px",
            "focus-color": "#FF0000",
            "focus-radius": "50px",
        },
        chart: {
            "background-color": "#659DBD",
        },
        grid: {
            color: "#ffffff",
        },
    },
];

/* src\theme\ThemeContext.svelte generated by Svelte v3.49.0 */

function create_fragment$3(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	return {
		c() {
			if (default_slot) default_slot.c();
		},
		m(target, anchor) {
			if (default_slot) {
				default_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[2],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
						null
					);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { theme = defaultTheme } = $$props;

	// set state of current theme's name
	let _current = defaultTheme[0].name;

	// utility to get current theme from name
	const getCurrentTheme = name => theme.find(h => h.name === name);

	const Theme = writable(getCurrentTheme(_current));

	// setContext("theme", {
	//   // providing Theme store through context makes store readonly
	//   theme: Theme,
	//   toggle: () => {
	//     // update internal state
	//     let _currentIndex = theme.findIndex(h => h.name === _current);
	//     _current =
	//       theme[_currentIndex === themes.length - 1 ? 0 : (_currentIndex += 1)]
	//         .name;
	//     // update Theme store
	//     Theme.update(t => ({ ...t, ...getCurrentTheme(_current) }));
	//     setRootColors(getCurrentTheme(_current));
	//   }
	// });
	onMount(() => {
		console.log('Set ' + theme[0].name + ' theme');
		_current = theme[0].name;

		// set CSS vars on mount
		setRootColors(getCurrentTheme(_current));
	});

	// sets CSS vars for easy use in components
	// ex: var(--theme-background)
	const setRootColors = theme => {
		for (let [attr, obj] of Object.entries(theme)) {
			//   console.log(attr + ', ' + obj);
			if (attr === 'name') {
				continue;
			} else {
				for (let [prop, value] of Object.entries(obj)) {
					let varString;

					if (attr === 'color') {
						varString = `--${prop}-${attr}`;
					} else {
						varString = `--${attr}-${prop}`;
					}

					// console.log(varString);
					document.documentElement.style.setProperty(varString, value);
				}
			}
		}

		document.documentElement.style.setProperty("--theme-name", theme.name);
	};

	$$self.$$set = $$props => {
		if ('theme' in $$props) $$invalidate(0, theme = $$props.theme);
		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [theme, Theme, $$scope, slots];
}

class ThemeContext extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { theme: 0, Theme: 1 });
	}

	get Theme() {
		return this.$$.ctx[1];
	}
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z$2 = ".wrapper.svelte-1mmlpvr.svelte-1mmlpvr{background-color:#f7f7f7;display:inline-block}.svg_wrap.svelte-1mmlpvr.svelte-1mmlpvr{display:inline-block}circle.svelte-1mmlpvr.svelte-1mmlpvr:focus{outline:var(--circles-focus-color);outline-style:solid;outline-width:2px;border-radius:var(--circles-focus-radius);text-anchor:middle}.background-chart.svelte-1mmlpvr.svelte-1mmlpvr{fill:none;width:100%;height:100%}.chart.svelte-1mmlpvr.svelte-1mmlpvr{transform:scale(1,-1);width:100%;height:100%;overflow:visible}.grid_surface.svelte-1mmlpvr.svelte-1mmlpvr{width:75%;height:80%}.grid.svelte-1mmlpvr.svelte-1mmlpvr{width:80%}.grid_path.svelte-1mmlpvr.svelte-1mmlpvr{stroke:darkgray}.x_label.svelte-1mmlpvr.svelte-1mmlpvr{transform:scale(5, -5)  !important;transform-origin:center center;transform-box:fill-box;font-size:11px}.y_label.svelte-1mmlpvr.svelte-1mmlpvr{transform:scale(5, -5)  !important;transform-origin:center center;transform-box:fill-box;text-anchor:middle;font-size:11px}.second_y_label.svelte-1mmlpvr.svelte-1mmlpvr{transform:scale(3, -5)  !important;transform-origin:center center;transform-box:fill-box;font-size:11px;text-anchor:middle}.captions.svelte-1mmlpvr.svelte-1mmlpvr{margin:10px 0 0 0;display:flex;flex-direction:row;gap:5px}.caption.svelte-1mmlpvr.svelte-1mmlpvr{flex-wrap:nowrap;margin:5px;padding:0 10px;background-color:#fff;box-shadow:0px 0px 1px 1px lightgray;display:flex;flex-direction:row;align-items:center;gap:5px}.inactive > .dot{background-color:gray !important}.inactive{color:gray;opacity:0.7}.grid_label.svelte-1mmlpvr>text.svelte-1mmlpvr{transform:scale(1, -1);font-size:9px}.show_line.svelte-1mmlpvr.svelte-1mmlpvr{visibility:visible}.hide_line{display:none !important}.info.svelte-1mmlpvr.svelte-1mmlpvr{font-size:9px !important;font-weight:lighter;letter-spacing:2px}.blur_info.svelte-1mmlpvr.svelte-1mmlpvr{display:none}.source.svelte-1mmlpvr.svelte-1mmlpvr{font-size:9px;text-align:right;padding-right:10px;padding-bottom:2px}polyline.svelte-1mmlpvr.svelte-1mmlpvr{visibility:visible}.dot.svelte-1mmlpvr.svelte-1mmlpvr{height:10px;width:10px;border-radius:50%;display:inline-block;pointer-events:none}";
styleInject(css_248z$2);

/* src\components\LineChart.svelte generated by Svelte v3.49.0 */

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[38] = list[i];
	child_ctx[40] = i;
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[41] = list[i];
	child_ctx[40] = i;
	return child_ctx;
}

function get_each_context_2$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[43] = list[i];
	child_ctx[45] = i;
	return child_ctx;
}

function get_each_context_3$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[46] = list[i];
	child_ctx[48] = i;
	return child_ctx;
}

function get_each_context_4$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[46] = list[i];
	child_ctx[48] = i;
	return child_ctx;
}

// (189:10) {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
function create_each_block_4$1(ctx) {
	let text_1;
	let t_value = gridGap$1 * /*i*/ ctx[48] + "";
	let t;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "text-anchor", "middle");
			attr(text_1, "alignment-baseline", "central");
			attr(text_1, "x", "5%");
			attr(text_1, "y", gridGap$1 * /*i*/ ctx[48] * -1);
			attr(text_1, "class", "svelte-1mmlpvr");
		},
		m(target, anchor) {
			insert(target, text_1, anchor);
			append(text_1, t);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(text_1);
		}
	};
}

// (193:10) {#if i%2 == 0}
function create_if_block_1(ctx) {
	let text_1;
	let t_value = gridGap$1 * /*i*/ ctx[48] + "";
	let t;
	let text_1_x_value;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "text-anchor", "middle");
			attr(text_1, "x", text_1_x_value = gridGap$1 * /*i*/ ctx[48] + /*svgWidth*/ ctx[11] * 0.1);
			attr(text_1, "y", "7%");
			attr(text_1, "class", "svelte-1mmlpvr");
		},
		m(target, anchor) {
			insert(target, text_1, anchor);
			append(text_1, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*svgWidth*/ 2048 && text_1_x_value !== (text_1_x_value = gridGap$1 * /*i*/ ctx[48] + /*svgWidth*/ ctx[11] * 0.1)) {
				attr(text_1, "x", text_1_x_value);
			}
		},
		d(detaching) {
			if (detaching) detach(text_1);
		}
	};
}

// (192:10) {#each Array(Math.floor((svgWidth*0.8)/gridGap)) as _, i}
function create_each_block_3$1(ctx) {
	let if_block_anchor;
	let if_block = /*i*/ ctx[48] % 2 == 0 && create_if_block_1(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
			if (/*i*/ ctx[48] % 2 == 0) if_block.p(ctx, dirty);
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (221:16) {#if p == (lines.points.length-1)}
function create_if_block(ctx) {
	let text_1;
	let t_value = /*lines*/ ctx[41].name + "";
	let t;
	let text_1_stroke_value;
	let text_1_x_value;
	let text_1_y_value;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "font-size", "smaller");
			attr(text_1, "transform", "scale(1 -1)");

			attr(text_1, "stroke", text_1_stroke_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black');

			attr(text_1, "x", text_1_x_value = /*point*/ ctx[43].x + 20);
			attr(text_1, "y", text_1_y_value = /*point*/ ctx[43].y * -1);
		},
		m(target, anchor) {
			insert(target, text_1, anchor);
			append(text_1, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series*/ 256 && t_value !== (t_value = /*lines*/ ctx[41].name + "")) set_data(t, t_value);

			if (dirty[0] & /*colors*/ 8192 && text_1_stroke_value !== (text_1_stroke_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black')) {
				attr(text_1, "stroke", text_1_stroke_value);
			}

			if (dirty[0] & /*series*/ 256 && text_1_x_value !== (text_1_x_value = /*point*/ ctx[43].x + 20)) {
				attr(text_1, "x", text_1_x_value);
			}

			if (dirty[0] & /*series*/ 256 && text_1_y_value !== (text_1_y_value = /*point*/ ctx[43].y * -1)) {
				attr(text_1, "y", text_1_y_value);
			}
		},
		d(detaching) {
			if (detaching) detach(text_1);
		}
	};
}

// (205:14) {#each lines.points as point, p}
function create_each_block_2$1(ctx) {
	let circle;
	let circle_aria_label_value;
	let circle_stroke_value;
	let circle_fill_value;
	let circle_cx_value;
	let circle_cy_value;
	let text_1;
	let t0_value = /*point*/ ctx[43].x + "";
	let t0;
	let t1;
	let t2_value = /*point*/ ctx[43].y + "";
	let t2;
	let text_1_x_value;
	let text_1_y_value;
	let text_1_stroke_value;
	let if_block_anchor;
	let mounted;
	let dispose;
	let if_block = /*p*/ ctx[45] == /*lines*/ ctx[41].points.length - 1 && create_if_block(ctx);

	return {
		c() {
			circle = svg_element("circle");
			text_1 = svg_element("text");
			t0 = text(t0_value);
			t1 = text(",");
			t2 = text(t2_value);
			if (if_block) if_block.c();
			if_block_anchor = empty();
			attr(circle, "tabindex", "0");
			attr(circle, "class", "point svelte-1mmlpvr");
			attr(circle, "role", "graphics-symbol");
			attr(circle, "aria-label", circle_aria_label_value = "" + (/*point*/ ctx[43].ariaLabel + ". This is point " + (/*p*/ ctx[45] + 1) + " of " + /*lines*/ ctx[41].points.length));

			attr(circle, "stroke", circle_stroke_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black');

			attr(circle, "fill", circle_fill_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black');

			attr(circle, "cx", circle_cx_value = /*point*/ ctx[43].x);
			attr(circle, "cy", circle_cy_value = /*point*/ ctx[43].y);
			attr(circle, "r", "3");
			attr(text_1, "class", "info blur_info svelte-1mmlpvr");
			attr(text_1, "filter", "url(#info_box)");
			attr(text_1, "x", text_1_x_value = /*point*/ ctx[43].x + 20);
			attr(text_1, "y", text_1_y_value = /*point*/ ctx[43].y * -1);

			attr(text_1, "stroke", text_1_stroke_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black');
		},
		m(target, anchor) {
			insert(target, circle, anchor);
			insert(target, text_1, anchor);
			append(text_1, t0);
			append(text_1, t1);
			append(text_1, t2);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);

			if (!mounted) {
				dispose = [
					listen(circle, "focus", /*focus_handler*/ ctx[27]),
					listen(circle, "blur", /*blur_handler*/ ctx[28])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series*/ 256 && circle_aria_label_value !== (circle_aria_label_value = "" + (/*point*/ ctx[43].ariaLabel + ". This is point " + (/*p*/ ctx[45] + 1) + " of " + /*lines*/ ctx[41].points.length))) {
				attr(circle, "aria-label", circle_aria_label_value);
			}

			if (dirty[0] & /*colors*/ 8192 && circle_stroke_value !== (circle_stroke_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black')) {
				attr(circle, "stroke", circle_stroke_value);
			}

			if (dirty[0] & /*colors*/ 8192 && circle_fill_value !== (circle_fill_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black')) {
				attr(circle, "fill", circle_fill_value);
			}

			if (dirty[0] & /*series*/ 256 && circle_cx_value !== (circle_cx_value = /*point*/ ctx[43].x)) {
				attr(circle, "cx", circle_cx_value);
			}

			if (dirty[0] & /*series*/ 256 && circle_cy_value !== (circle_cy_value = /*point*/ ctx[43].y)) {
				attr(circle, "cy", circle_cy_value);
			}

			if (dirty[0] & /*series*/ 256 && t0_value !== (t0_value = /*point*/ ctx[43].x + "")) set_data(t0, t0_value);
			if (dirty[0] & /*series*/ 256 && t2_value !== (t2_value = /*point*/ ctx[43].y + "")) set_data(t2, t2_value);

			if (dirty[0] & /*series*/ 256 && text_1_x_value !== (text_1_x_value = /*point*/ ctx[43].x + 20)) {
				attr(text_1, "x", text_1_x_value);
			}

			if (dirty[0] & /*series*/ 256 && text_1_y_value !== (text_1_y_value = /*point*/ ctx[43].y * -1)) {
				attr(text_1, "y", text_1_y_value);
			}

			if (dirty[0] & /*colors*/ 8192 && text_1_stroke_value !== (text_1_stroke_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black')) {
				attr(text_1, "stroke", text_1_stroke_value);
			}

			if (/*p*/ ctx[45] == /*lines*/ ctx[41].points.length - 1) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) detach(circle);
			if (detaching) detach(text_1);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (202:10) {#each series as lines, l}
function create_each_block_1$1(ctx) {
	let g;
	let polyline;
	let polyline_points_value;
	let polyline_stroke_value;
	let g_id_value;
	let each_value_2 = /*lines*/ ctx[41].points;
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
	}

	return {
		c() {
			g = svg_element("g");
			polyline = svg_element("polyline");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(polyline, "points", polyline_points_value = /*getPoints*/ ctx[19](/*lines*/ ctx[41].points));
			attr(polyline, "fill", "none");

			attr(polyline, "stroke", polyline_stroke_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black');

			attr(polyline, "class", "svelte-1mmlpvr");
			attr(g, "id", g_id_value = "" + (/*idChart*/ ctx[15] + "_" + cleanIdName$1(/*lines*/ ctx[41].name)));
			attr(g, "class", "show_line svelte-1mmlpvr");
		},
		m(target, anchor) {
			insert(target, g, anchor);
			append(g, polyline);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(g, null);
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series*/ 256 && polyline_points_value !== (polyline_points_value = /*getPoints*/ ctx[19](/*lines*/ ctx[41].points))) {
				attr(polyline, "points", polyline_points_value);
			}

			if (dirty[0] & /*colors*/ 8192 && polyline_stroke_value !== (polyline_stroke_value = /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: 'black')) {
				attr(polyline, "stroke", polyline_stroke_value);
			}

			if (dirty[0] & /*colors, series, showInfoBox, showVerticalInterception, blurInfoBox, removeVerticalInterception*/ 28320000) {
				each_value_2 = /*lines*/ ctx[41].points;
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_2$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(g, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_2.length;
			}

			if (dirty[0] & /*idChart, series*/ 33024 && g_id_value !== (g_id_value = "" + (/*idChart*/ ctx[15] + "_" + cleanIdName$1(/*lines*/ ctx[41].name)))) {
				attr(g, "id", g_id_value);
			}
		},
		d(detaching) {
			if (detaching) detach(g);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (233:6) {#each series as line, l}
function create_each_block$2(ctx) {
	let button;
	let span;
	let t0;
	let t1_value = /*line*/ ctx[38].name + "";
	let t1;
	let t2;
	let button_id_value;
	let button_aria_label_value;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			span = element("span");
			t0 = space();
			t1 = text(t1_value);
			t2 = space();
			attr(span, "class", "dot svelte-1mmlpvr");

			set_style(span, "background-color", /*colors*/ ctx[13]
			? /*colors*/ ctx[13][/*l*/ ctx[40]]
			: '#ccc');

			attr(button, "tabindex", "0");
			attr(button, "id", button_id_value = "" + (/*idChart*/ ctx[15] + "_" + cleanIdName$1(/*line*/ ctx[38].name)));
			attr(button, "aria-label", button_aria_label_value = /*line*/ ctx[38].name);
			attr(button, "class", "caption svelte-1mmlpvr");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, span);
			append(button, t0);
			append(button, t1);
			append(button, t2);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[32]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*colors*/ 8192) {
				set_style(span, "background-color", /*colors*/ ctx[13]
				? /*colors*/ ctx[13][/*l*/ ctx[40]]
				: '#ccc');
			}

			if (dirty[0] & /*series*/ 256 && t1_value !== (t1_value = /*line*/ ctx[38].name + "")) set_data(t1, t1_value);

			if (dirty[0] & /*idChart, series*/ 33024 && button_id_value !== (button_id_value = "" + (/*idChart*/ ctx[15] + "_" + cleanIdName$1(/*line*/ ctx[38].name)))) {
				attr(button, "id", button_id_value);
			}

			if (dirty[0] & /*series*/ 256 && button_aria_label_value !== (button_aria_label_value = /*line*/ ctx[38].name)) {
				attr(button, "aria-label", button_aria_label_value);
			}
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

// (135:0) <ThemeContext bind:theme={theme}>
function create_default_slot$2(ctx) {
	let div5;
	let div0;
	let t0;
	let div1;
	let t1;
	let div1_aria_labelledby_value;
	let t2;
	let div2;
	let svg;
	let title_1;
	let t3;
	let title_1_id_value;
	let desc_1;
	let t4;
	let desc_1_id_value;
	let defs0;
	let pattern;
	let path;
	let pattern_id_value;
	let defs1;
	let filter;
	let feFlood;
	let feMerge;
	let feMergeNode0;
	let feMergeNode1;
	let g0;
	let rect0;
	let g1;
	let rect1;
	let rect1_fill_value;
	let g1_transform_value;
	let g7;
	let g2;
	let text0;
	let t5;
	let g2_transform_value;
	let g3;
	let text1;
	let t6;
	let g3_transform_value;
	let g4;
	let text2;
	let t7;
	let g4_transform_value;
	let g5;
	let text3;
	let t8;
	let g5_transform_value;
	let g6;
	let text4;
	let t9;
	let g6_transform_value;
	let g8;
	let line0;
	let line1;
	let line2;
	let g9;
	let each0_anchor;
	let g9_transform_value;
	let g10;
	let g10_transform_value;
	let g11;
	let g11_transform_value;
	let g12;
	let g12_transform_value;
	let div2_resize_listener;
	let t10;
	let div3;
	let t11;
	let div4;
	let a;
	let t12;
	let t13;
	let each_value_4 = Array(Math.floor(/*svgHeight*/ ctx[12] * 0.7 / gridGap$1));
	let each_blocks_3 = [];

	for (let i = 0; i < each_value_4.length; i += 1) {
		each_blocks_3[i] = create_each_block_4$1(get_each_context_4$1(ctx, each_value_4, i));
	}

	let each_value_3 = Array(Math.floor(/*svgWidth*/ ctx[11] * 0.8 / gridGap$1));
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks_2[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
	}

	let each_value_1 = /*series*/ ctx[8];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
	}

	let each_value = /*series*/ ctx[8];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	return {
		c() {
			div5 = element("div");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			t1 = text(/*desc*/ ctx[2]);
			t2 = space();
			div2 = element("div");
			svg = svg_element("svg");
			title_1 = svg_element("title");
			t3 = text(/*title*/ ctx[1]);
			desc_1 = svg_element("desc");
			t4 = text(/*desc*/ ctx[2]);
			defs0 = svg_element("defs");
			pattern = svg_element("pattern");
			path = svg_element("path");
			defs1 = svg_element("defs");
			filter = svg_element("filter");
			feFlood = svg_element("feFlood");
			feMerge = svg_element("feMerge");
			feMergeNode0 = svg_element("feMergeNode");
			feMergeNode1 = svg_element("feMergeNode");
			g0 = svg_element("g");
			rect0 = svg_element("rect");
			g1 = svg_element("g");
			rect1 = svg_element("rect");
			g7 = svg_element("g");
			g2 = svg_element("g");
			text0 = svg_element("text");
			t5 = text(/*xLabel*/ ctx[6]);
			g3 = svg_element("g");
			text1 = svg_element("text");
			t6 = text(/*yLabel*/ ctx[5]);
			g4 = svg_element("g");
			text2 = svg_element("text");
			t7 = text(/*secondYLabel*/ ctx[7]);
			g5 = svg_element("g");
			text3 = svg_element("text");
			t8 = text(/*yLabel*/ ctx[5]);
			g6 = svg_element("g");
			text4 = svg_element("text");
			t9 = text(/*secondYLabel*/ ctx[7]);
			g8 = svg_element("g");
			line0 = svg_element("line");
			line1 = svg_element("line");
			line2 = svg_element("line");
			g9 = svg_element("g");

			for (let i = 0; i < each_blocks_3.length; i += 1) {
				each_blocks_3[i].c();
			}

			each0_anchor = empty();

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].c();
			}

			g10 = svg_element("g");
			g11 = svg_element("g");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			g12 = svg_element("g");
			t10 = space();
			div3 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t11 = space();
			div4 = element("div");
			a = element("a");
			t12 = text("Source: ");
			t13 = text(/*source*/ ctx[9]);
			attr(div0, "class", "title");
			attr(div1, "tabindex", "0");
			attr(div1, "class", "description");
			attr(div1, "aria-labelledby", div1_aria_labelledby_value = "" + (/*idChart*/ ctx[15] + "_desc_chart"));
			attr(title_1, "id", title_1_id_value = "" + (/*idChart*/ ctx[15] + "_title_chart"));
			attr(desc_1, "id", desc_1_id_value = "" + (/*idChart*/ ctx[15] + "_desc_chart"));
			attr(path, "class", "grid_path svelte-1mmlpvr");
			attr(path, "d", "M 0 " + gridGap$1 + " L 0 0 " + gridGap$1 + " 0");
			attr(path, "fill", "none");
			attr(path, "stroke-width", "0.5");
			attr(pattern, "id", pattern_id_value = "" + (/*idChart*/ ctx[15] + "_grid_pattern"));
			attr(pattern, "width", gridGap$1);
			attr(pattern, "height", gridGap$1);
			attr(pattern, "patternUnits", "userSpaceOnUse");
			attr(feFlood, "flood-color", "white");
			attr(feFlood, "result", "bg");
			attr(feMergeNode0, "in", "bg");
			attr(feMergeNode1, "in", "SourceGraphic");
			attr(filter, "x", "0");
			attr(filter, "y", "0");
			attr(filter, "width", "1");
			attr(filter, "height", "1");
			attr(filter, "id", "info_box");
			attr(rect0, "width", "90%");
			attr(rect0, "class", "background-chart svelte-1mmlpvr");
			attr(g0, "role", "none");
			attr(g0, "aria-hidden", "true");
			attr(rect1, "class", "grid_surface svelte-1mmlpvr");
			set_style(rect1, "height", /*svgHeight*/ ctx[12] * 0.7);
			attr(rect1, "fill", rect1_fill_value = "url(#" + /*idChart*/ ctx[15] + "_grid_pattern)");
			attr(rect1, "transform", "scale(1, 1)");
			attr(g1, "class", "grid svelte-1mmlpvr");
			attr(g1, "transform", g1_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.1 + "," + /*svgHeight*/ ctx[12] * 0.1 + ") ");
			attr(g1, "aria-hidden", "true");
			attr(text0, "class", "x_label svelte-1mmlpvr");
			attr(g2, "transform", g2_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.9 + "," + /*svgHeight*/ ctx[12] * 0.1 + ") scale(0.2 , 0.2)");
			attr(text1, "class", "y_label svelte-1mmlpvr");
			attr(text1, "x", "50%");
			attr(text1, "y", "15%");
			attr(g3, "transform", g3_transform_value = "translate(0," + /*svgHeight*/ ctx[12] * 0.8 + ") scale(0.2 , 0.2)");
			attr(text2, "class", "second_y_label svelte-1mmlpvr");
			attr(text2, "x", "50%");
			attr(text2, "y", "15%");
			attr(g4, "transform", g4_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.7 + "," + /*svgHeight*/ ctx[12] * 0.8 + ") scale(0.3 , 0.2)");
			attr(text3, "class", "y_label svelte-1mmlpvr");
			attr(text3, "x", "50%");
			attr(text3, "y", "15%");
			attr(g5, "transform", g5_transform_value = "translate(0," + /*svgHeight*/ ctx[12] * 0.8 + ") scale(0.2 , 0.2)");
			attr(text4, "class", "second_y_label svelte-1mmlpvr");
			attr(text4, "x", "50%");
			attr(text4, "y", "15%");
			attr(g6, "transform", g6_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.7 + "," + /*svgHeight*/ ctx[12] * 0.8 + ") scale(0.3 , 0.2)");
			attr(g7, "class", "labels");
			attr(line0, "class", "");
			attr(line0, "x1", "10%");
			attr(line0, "x2", "10%");
			attr(line0, "y1", "10%");
			attr(line0, "y2", "80%");
			attr(line0, "stroke", "black");
			attr(line1, "class", "");
			attr(line1, "x1", "10%");
			attr(line1, "x2", "85%");
			attr(line1, "y1", "10%");
			attr(line1, "y2", "10%");
			attr(line1, "stroke", "black");
			attr(line2, "class", "");
			attr(line2, "x1", "85%");
			attr(line2, "x2", "85%");
			attr(line2, "y1", "10%");
			attr(line2, "y2", "80%");
			attr(line2, "stroke", "black");
			attr(g8, "class", "axis");
			attr(g8, "aria-hidden", "true");
			attr(g9, "class", "grid_label svelte-1mmlpvr");
			attr(g9, "transform", g9_transform_value = "translate(1, " + /*svgHeight*/ ctx[12] * 0.1 + ")");
			attr(g10, "id", "vertical_intercept");
			attr(g10, "transform", g10_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.1 + ",0)");
			attr(g11, "role", "graphics-object");
			attr(g11, "transform", g11_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.1 + "," + /*svgHeight*/ ctx[12] * 0.1 + ")");
			attr(g11, "class", "functions");
			attr(g12, "role", "graphics-object");
			attr(g12, "transform", g12_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.1 + "," + /*svgHeight*/ ctx[12] * 0.1 + ") scale(1, -1)");
			attr(g12, "id", "actually_focus");
			attr(svg, "class", "chart svelte-1mmlpvr");
			attr(svg, "role", "graphics-document");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "viewBox", "0 0 600 200");
			attr(svg, "width", /*width*/ ctx[3]);
			attr(svg, "height", /*height*/ ctx[4]);
			attr(div2, "class", "svg_wrap svelte-1mmlpvr");
			add_render_callback(() => /*div2_elementresize_handler*/ ctx[31].call(div2));
			attr(div3, "class", "captions svelte-1mmlpvr");
			set_style(div3, "padding", "0 " + /*svgWidth*/ ctx[11] * 0.1 + "px");
			attr(a, "tabindex", "0");
			attr(a, "href", /*source*/ ctx[9]);
			attr(div4, "class", "source svelte-1mmlpvr");
			attr(div5, "class", "wrapper svelte-1mmlpvr");
		},
		m(target, anchor) {
			insert(target, div5, anchor);
			append(div5, div0);
			/*div0_binding*/ ctx[25](div0);
			append(div5, t0);
			append(div5, div1);
			append(div1, t1);
			append(div5, t2);
			append(div5, div2);
			append(div2, svg);
			append(svg, title_1);
			append(title_1, t3);
			append(svg, desc_1);
			append(desc_1, t4);
			append(svg, defs0);
			append(defs0, pattern);
			append(pattern, path);
			append(svg, defs1);
			append(defs1, filter);
			append(filter, feFlood);
			append(filter, feMerge);
			append(feMerge, feMergeNode0);
			append(feMerge, feMergeNode1);
			append(svg, g0);
			append(g0, rect0);
			append(svg, g1);
			append(g1, rect1);
			append(svg, g7);
			append(g7, g2);
			append(g2, text0);
			append(text0, t5);
			append(g7, g3);
			append(g3, text1);
			append(text1, t6);
			append(g7, g4);
			append(g4, text2);
			append(text2, t7);
			append(g7, g5);
			append(g5, text3);
			append(text3, t8);
			append(g7, g6);
			append(g6, text4);
			append(text4, t9);
			append(svg, g8);
			append(g8, line0);
			append(g8, line1);
			append(g8, line2);
			append(svg, g9);

			for (let i = 0; i < each_blocks_3.length; i += 1) {
				each_blocks_3[i].m(g9, null);
			}

			append(g9, each0_anchor);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].m(g9, null);
			}

			append(svg, g10);
			/*g10_binding*/ ctx[26](g10);
			append(svg, g11);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(g11, null);
			}

			append(svg, g12);
			/*g12_binding*/ ctx[29](g12);
			/*svg_binding*/ ctx[30](svg);
			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[31].bind(div2));
			append(div5, t10);
			append(div5, div3);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div3, null);
			}

			append(div5, t11);
			append(div5, div4);
			append(div4, a);
			append(a, t12);
			append(a, t13);
			/*div5_binding*/ ctx[33](div5);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*desc*/ 4) set_data(t1, /*desc*/ ctx[2]);

			if (dirty[0] & /*idChart*/ 32768 && div1_aria_labelledby_value !== (div1_aria_labelledby_value = "" + (/*idChart*/ ctx[15] + "_desc_chart"))) {
				attr(div1, "aria-labelledby", div1_aria_labelledby_value);
			}

			if (dirty[0] & /*title*/ 2) set_data(t3, /*title*/ ctx[1]);

			if (dirty[0] & /*idChart*/ 32768 && title_1_id_value !== (title_1_id_value = "" + (/*idChart*/ ctx[15] + "_title_chart"))) {
				attr(title_1, "id", title_1_id_value);
			}

			if (dirty[0] & /*desc*/ 4) set_data(t4, /*desc*/ ctx[2]);

			if (dirty[0] & /*idChart*/ 32768 && desc_1_id_value !== (desc_1_id_value = "" + (/*idChart*/ ctx[15] + "_desc_chart"))) {
				attr(desc_1, "id", desc_1_id_value);
			}

			if (dirty[0] & /*idChart*/ 32768 && pattern_id_value !== (pattern_id_value = "" + (/*idChart*/ ctx[15] + "_grid_pattern"))) {
				attr(pattern, "id", pattern_id_value);
			}

			if (dirty[0] & /*svgHeight*/ 4096) {
				set_style(rect1, "height", /*svgHeight*/ ctx[12] * 0.7);
			}

			if (dirty[0] & /*idChart*/ 32768 && rect1_fill_value !== (rect1_fill_value = "url(#" + /*idChart*/ ctx[15] + "_grid_pattern)")) {
				attr(rect1, "fill", rect1_fill_value);
			}

			if (dirty[0] & /*svgWidth, svgHeight*/ 6144 && g1_transform_value !== (g1_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.1 + "," + /*svgHeight*/ ctx[12] * 0.1 + ") ")) {
				attr(g1, "transform", g1_transform_value);
			}

			if (dirty[0] & /*xLabel*/ 64) set_data(t5, /*xLabel*/ ctx[6]);

			if (dirty[0] & /*svgWidth, svgHeight*/ 6144 && g2_transform_value !== (g2_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.9 + "," + /*svgHeight*/ ctx[12] * 0.1 + ") scale(0.2 , 0.2)")) {
				attr(g2, "transform", g2_transform_value);
			}

			if (dirty[0] & /*yLabel*/ 32) set_data(t6, /*yLabel*/ ctx[5]);

			if (dirty[0] & /*svgHeight*/ 4096 && g3_transform_value !== (g3_transform_value = "translate(0," + /*svgHeight*/ ctx[12] * 0.8 + ") scale(0.2 , 0.2)")) {
				attr(g3, "transform", g3_transform_value);
			}

			if (dirty[0] & /*secondYLabel*/ 128) set_data(t7, /*secondYLabel*/ ctx[7]);

			if (dirty[0] & /*svgWidth, svgHeight*/ 6144 && g4_transform_value !== (g4_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.7 + "," + /*svgHeight*/ ctx[12] * 0.8 + ") scale(0.3 , 0.2)")) {
				attr(g4, "transform", g4_transform_value);
			}

			if (dirty[0] & /*yLabel*/ 32) set_data(t8, /*yLabel*/ ctx[5]);

			if (dirty[0] & /*svgHeight*/ 4096 && g5_transform_value !== (g5_transform_value = "translate(0," + /*svgHeight*/ ctx[12] * 0.8 + ") scale(0.2 , 0.2)")) {
				attr(g5, "transform", g5_transform_value);
			}

			if (dirty[0] & /*secondYLabel*/ 128) set_data(t9, /*secondYLabel*/ ctx[7]);

			if (dirty[0] & /*svgWidth, svgHeight*/ 6144 && g6_transform_value !== (g6_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.7 + "," + /*svgHeight*/ ctx[12] * 0.8 + ") scale(0.3 , 0.2)")) {
				attr(g6, "transform", g6_transform_value);
			}

			if (dirty[0] & /*svgHeight*/ 4096) {
				each_value_4 = Array(Math.floor(/*svgHeight*/ ctx[12] * 0.7 / gridGap$1));
				let i;

				for (i = 0; i < each_value_4.length; i += 1) {
					const child_ctx = get_each_context_4$1(ctx, each_value_4, i);

					if (each_blocks_3[i]) {
						each_blocks_3[i].p(child_ctx, dirty);
					} else {
						each_blocks_3[i] = create_each_block_4$1(child_ctx);
						each_blocks_3[i].c();
						each_blocks_3[i].m(g9, each0_anchor);
					}
				}

				for (; i < each_blocks_3.length; i += 1) {
					each_blocks_3[i].d(1);
				}

				each_blocks_3.length = each_value_4.length;
			}

			if (dirty[0] & /*svgWidth*/ 2048) {
				each_value_3 = Array(Math.floor(/*svgWidth*/ ctx[11] * 0.8 / gridGap$1));
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

					if (each_blocks_2[i]) {
						each_blocks_2[i].p(child_ctx, dirty);
					} else {
						each_blocks_2[i] = create_each_block_3$1(child_ctx);
						each_blocks_2[i].c();
						each_blocks_2[i].m(g9, null);
					}
				}

				for (; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].d(1);
				}

				each_blocks_2.length = each_value_3.length;
			}

			if (dirty[0] & /*svgHeight*/ 4096 && g9_transform_value !== (g9_transform_value = "translate(1, " + /*svgHeight*/ ctx[12] * 0.1 + ")")) {
				attr(g9, "transform", g9_transform_value);
			}

			if (dirty[0] & /*svgWidth*/ 2048 && g10_transform_value !== (g10_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.1 + ",0)")) {
				attr(g10, "transform", g10_transform_value);
			}

			if (dirty[0] & /*idChart, series, colors, showInfoBox, showVerticalInterception, blurInfoBox, removeVerticalInterception, getPoints*/ 28877056) {
				each_value_1 = /*series*/ ctx[8];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1$1(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(g11, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty[0] & /*svgWidth, svgHeight*/ 6144 && g11_transform_value !== (g11_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.1 + "," + /*svgHeight*/ ctx[12] * 0.1 + ")")) {
				attr(g11, "transform", g11_transform_value);
			}

			if (dirty[0] & /*svgWidth, svgHeight*/ 6144 && g12_transform_value !== (g12_transform_value = "translate(" + /*svgWidth*/ ctx[11] * 0.1 + "," + /*svgHeight*/ ctx[12] * 0.1 + ") scale(1, -1)")) {
				attr(g12, "transform", g12_transform_value);
			}

			if (dirty[0] & /*width*/ 8) {
				attr(svg, "width", /*width*/ ctx[3]);
			}

			if (dirty[0] & /*height*/ 16) {
				attr(svg, "height", /*height*/ ctx[4]);
			}

			if (dirty[0] & /*idChart, series, toogleCaption, colors*/ 4235520) {
				each_value = /*series*/ ctx[8];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div3, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty[0] & /*svgWidth*/ 2048) {
				set_style(div3, "padding", "0 " + /*svgWidth*/ ctx[11] * 0.1 + "px");
			}

			if (dirty[0] & /*source*/ 512) set_data(t13, /*source*/ ctx[9]);

			if (dirty[0] & /*source*/ 512) {
				attr(a, "href", /*source*/ ctx[9]);
			}
		},
		d(detaching) {
			if (detaching) detach(div5);
			/*div0_binding*/ ctx[25](null);
			destroy_each(each_blocks_3, detaching);
			destroy_each(each_blocks_2, detaching);
			/*g10_binding*/ ctx[26](null);
			destroy_each(each_blocks_1, detaching);
			/*g12_binding*/ ctx[29](null);
			/*svg_binding*/ ctx[30](null);
			div2_resize_listener();
			destroy_each(each_blocks, detaching);
			/*div5_binding*/ ctx[33](null);
		}
	};
}

function create_fragment$2(ctx) {
	let themecontext;
	let updating_theme;
	let current;

	function themecontext_theme_binding(value) {
		/*themecontext_theme_binding*/ ctx[34](value);
	}

	let themecontext_props = {
		$$slots: { default: [create_default_slot$2] },
		$$scope: { ctx }
	};

	if (/*theme*/ ctx[0] !== void 0) {
		themecontext_props.theme = /*theme*/ ctx[0];
	}

	themecontext = new ThemeContext({ props: themecontext_props });
	binding_callbacks.push(() => bind(themecontext, 'theme', themecontext_theme_binding));

	return {
		c() {
			create_component(themecontext.$$.fragment);
		},
		m(target, anchor) {
			mount_component(themecontext, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const themecontext_changes = {};

			if (dirty[0] & /*rootNode, source, svgWidth, series, idChart, colors, svgHeight, width, height, svgImage, showedInfoBox, verticalInterceptionGroup, secondYLabel, yLabel, xLabel, desc, title, headerChartParentTag*/ 524286 | dirty[1] & /*$$scope*/ 524288) {
				themecontext_changes.$$scope = { dirty, ctx };
			}

			if (!updating_theme && dirty[0] & /*theme*/ 1) {
				updating_theme = true;
				themecontext_changes.theme = /*theme*/ ctx[0];
				add_flush_callback(() => updating_theme = false);
			}

			themecontext.$set(themecontext_changes);
		},
		i(local) {
			if (current) return;
			transition_in(themecontext.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(themecontext.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(themecontext, detaching);
		}
	};
}

var gridGap$1 = 20;

function generateId$2() {
	return Date.now().toString(36) + Math.floor(Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)).toString(36);
}

function removeAllChildNodes(parent) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}

function cleanIdName$1(name) {
	return name.replace(/\s/g, "");
}

function instance$2($$self, $$props, $$invalidate) {
	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
			? value
			: new P(function (resolve) {
						resolve(value);
					});
		}

		return new (P || (P = Promise))(function (resolve, reject) {
				function fulfilled(value) {
					try {
						step(generator.next(value));
					} catch(e) {
						reject(e);
					}
				}

				function rejected(value) {
					try {
						step(generator["throw"](value));
					} catch(e) {
						reject(e);
					}
				}

				function step(result) {
					result.done
					? resolve(result.value)
					: adopt(result.value).then(fulfilled, rejected);
				}

				step((generator = generator.apply(thisArg, _arguments || [])).next());
			});
	};

	let { title = '' } = $$props;
	let { desc = "" } = $$props;
	let { theme = defaultTheme } = $$props;
	let { width = "600" } = $$props;
	let { height = "200" } = $$props;
	let { yLabel = 'Y-Axis' } = $$props;
	let { xLabel = 'X-Axis' } = $$props;
	let { secondYLabel = 'Second Y-Axis' } = $$props;
	let { series = null } = $$props;
	let { source = "" } = $$props;
	var svgImage = null;
	var svgWidth = 0;
	var svgHeight = 0;
	var colors;
	var showedInfoBox;
	var idChart;
	var verticalInterceptionGroup;
	var rootNode;
	var headerChartParentTag;

	var getPoints = points => {
		let polyPoints = '';

		points.forEach(function (point) {
			polyPoints += point.x + "," + point.y + " ";
		});

		return polyPoints;
	};

	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
		console.log('onMount() (LineChart)');
		$$invalidate(13, colors = Object.values(theme[0].color));
		$$invalidate(15, idChart = generateId$2());
		createHeaderTag(findParentHeader());
	}));

	function createHeaderTag(headerNumber) {
		var newHeader;

		if (headerNumber > 5) {
			console.warn('Headline cannot be created. HTML allows only h1 - h6. The chart would get h' + ++headerNumber);
		} else {
			console.log('Headernumber: ', headerNumber);

			if (headerNumber === null) {
				console.warn('Creating a h1 header! Is this intended?');
				newHeader = document.createElement('h' + (headerNumber + 1));
			} else {
				newHeader = document.createElement('h' + (headerNumber + 1));
			}

			newHeader.setAttribute('tabindex', '0');
			newHeader.setAttribute('aria-labelledby', idChart + '_title_chart');
			newHeader.innerHTML = title;
			headerChartParentTag.appendChild(newHeader);
		}
	}

	function findParentHeader() {
		var parent = rootNode.parentElement;
		var resultHeader = null;

		while (parent.tagName !== 'HTML' && resultHeader === null) {
			Array.from(parent.children).reverse().forEach(element => {
				if (element.tagName.toLowerCase().match('h1|h2|h3|h4|h5|h6') && resultHeader === null) {
					resultHeader = parseInt(element.tagName[1]);
				}
			});

			parent = parent.parentElement;
		}

		return resultHeader;
	}

	function showInfoBox(event) {
		var element = event.target.nextSibling.cloneNode(true);
		element.classList.add('show_info');
		element.classList.remove('blur_info');
		showedInfoBox.appendChild(element);
	}

	function blurInfoBox() {
		removeAllChildNodes(showedInfoBox);
	}

	function toogleCaption(event) {
		if (verticalInterceptionGroup.firstChild) {
			verticalInterceptionGroup.removeChild(verticalInterceptionGroup.firstChild);
		}

		var button = event.target;
		var targetId = button.id.replace(/\s/g, "");
		var line = document.getElementById(targetId);

		line.classList.contains('show_line')
		? line.classList.replace('show_line', 'hide_line')
		: line.classList.replace('hide_line', 'show_line');

		button.classList.contains('inactive')
		? button.classList.remove('inactive')
		: button.classList.add('inactive');
	}

	function showVerticalInterception(event) {
		var circle = event.target;
		var bbox = circle.getBBox();
		var interception = document.createElementNS('http://www.w3.org/2000/svg', 'line');

		// var interceptionText = document.createElementNS('http://www.w3.org/2000/svg','text');
		// interceptionText.innerHTML = (bbox.x + (bbox.width / 2)).toString();
		// interceptionText.setAttribute('x', (bbox.x + (bbox.width / 2)).toString());
		// interceptionText.setAttribute('y', (svgHeight*0.8*-1).toString());
		// interceptionText.setAttribute('filter', 'url(#info_box)');
		// interceptionText.setAttribute('transform', "scale(1,-1)");
		// verticalInterceptionGroup.appendChild(interceptionText);
		interception.setAttribute('x1', (bbox.x + bbox.width / 2).toString());

		interception.setAttribute('x2', (bbox.x + bbox.width / 2).toString());
		interception.setAttribute('y1', (svgHeight * 0.1).toString());
		interception.setAttribute('y2', (svgHeight * 0.8).toString());
		interception.setAttribute('stroke', 'black');
		verticalInterceptionGroup.appendChild(interception);
	}

	function removeVerticalInterception() {
		if (verticalInterceptionGroup.firstChild) {
			verticalInterceptionGroup.removeChild(verticalInterceptionGroup.lastChild);
		} // verticalInterceptionGroup.removeChild(verticalInterceptionGroup.firstChild); 
	}

	function div0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			headerChartParentTag = $$value;
			$$invalidate(18, headerChartParentTag);
		});
	}

	function g10_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			verticalInterceptionGroup = $$value;
			$$invalidate(16, verticalInterceptionGroup);
		});
	}

	const focus_handler = event => {
		showInfoBox(event);
		showVerticalInterception(event);
	};

	const blur_handler = () => {
		blurInfoBox();
		removeVerticalInterception();
	};

	function g12_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			showedInfoBox = $$value;
			$$invalidate(14, showedInfoBox);
		});
	}

	function svg_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			svgImage = $$value;
			$$invalidate(10, svgImage);
		});
	}

	function div2_elementresize_handler() {
		svgWidth = this.clientWidth;
		svgHeight = this.clientHeight;
		$$invalidate(11, svgWidth);
		$$invalidate(12, svgHeight);
	}

	const click_handler = event => toogleCaption(event);

	function div5_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			rootNode = $$value;
			$$invalidate(17, rootNode);
		});
	}

	function themecontext_theme_binding(value) {
		theme = value;
		$$invalidate(0, theme);
	}

	$$self.$$set = $$props => {
		if ('title' in $$props) $$invalidate(1, title = $$props.title);
		if ('desc' in $$props) $$invalidate(2, desc = $$props.desc);
		if ('theme' in $$props) $$invalidate(0, theme = $$props.theme);
		if ('width' in $$props) $$invalidate(3, width = $$props.width);
		if ('height' in $$props) $$invalidate(4, height = $$props.height);
		if ('yLabel' in $$props) $$invalidate(5, yLabel = $$props.yLabel);
		if ('xLabel' in $$props) $$invalidate(6, xLabel = $$props.xLabel);
		if ('secondYLabel' in $$props) $$invalidate(7, secondYLabel = $$props.secondYLabel);
		if ('series' in $$props) $$invalidate(8, series = $$props.series);
		if ('source' in $$props) $$invalidate(9, source = $$props.source);
	};

	return [
		theme,
		title,
		desc,
		width,
		height,
		yLabel,
		xLabel,
		secondYLabel,
		series,
		source,
		svgImage,
		svgWidth,
		svgHeight,
		colors,
		showedInfoBox,
		idChart,
		verticalInterceptionGroup,
		rootNode,
		headerChartParentTag,
		getPoints,
		showInfoBox,
		blurInfoBox,
		toogleCaption,
		showVerticalInterception,
		removeVerticalInterception,
		div0_binding,
		g10_binding,
		focus_handler,
		blur_handler,
		g12_binding,
		svg_binding,
		div2_elementresize_handler,
		click_handler,
		div5_binding,
		themecontext_theme_binding
	];
}

class LineChart extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$2,
			create_fragment$2,
			safe_not_equal,
			{
				title: 1,
				desc: 2,
				theme: 0,
				width: 3,
				height: 4,
				yLabel: 5,
				xLabel: 6,
				secondYLabel: 7,
				series: 8,
				source: 9
			},
			null,
			[-1, -1]
		);
	}
}

var css_248z$1 = ".x_grid_text_label.svelte-4gdqkx.svelte-4gdqkx{transform:scale(1, -1) rotate(-45deg);transform-origin:center center;font-size:9px}.wrapper.svelte-4gdqkx.svelte-4gdqkx{background-color:#f7f7f7;display:inline-block}.chart.svelte-4gdqkx.svelte-4gdqkx{transform:scale(1,-1);width:100%;height:100%;overflow:visible}.grid_surface.svelte-4gdqkx.svelte-4gdqkx{width:75%;height:80%}.grid.svelte-4gdqkx.svelte-4gdqkx{width:80%}.grid_path.svelte-4gdqkx.svelte-4gdqkx{stroke:darkgray}.x_label.svelte-4gdqkx.svelte-4gdqkx{transform:scale(5, -5)  !important;transform-origin:center center;transform-box:fill-box;font-size:11px}.y_label.svelte-4gdqkx.svelte-4gdqkx{transform:scale(5, -5)  !important;transform-origin:center center;transform-box:fill-box;text-anchor:middle;font-size:11px}.second_y_label.svelte-4gdqkx.svelte-4gdqkx{transform:scale(3, -5)  !important;transform-origin:center center;transform-box:fill-box;font-size:11px;text-anchor:middle}.captions.svelte-4gdqkx.svelte-4gdqkx{margin:10px 0 0 0;display:flex;flex-direction:row;gap:5px}.caption.svelte-4gdqkx.svelte-4gdqkx{flex-wrap:nowrap;margin:5px;padding:0 10px;background-color:#fff;box-shadow:0px 0px 1px 1px lightgray;display:flex;flex-direction:row;align-items:center;gap:5px}.inactive > .dot{background-color:gray !important}.inactive{color:gray;opacity:0.7}.y_grid_label.svelte-4gdqkx>text.svelte-4gdqkx{transform:scale(1, -1);font-size:9px}.hide_bar{display:none !important}.show_bar{display:block !important}.dot.svelte-4gdqkx.svelte-4gdqkx{height:10px;width:10px;border-radius:50%;display:inline-block;pointer-events:none}.source.svelte-4gdqkx.svelte-4gdqkx{font-size:9px;text-align:right;padding-right:10px;padding-bottom:2px}";
styleInject(css_248z$1);

/* src\components\BarChart.svelte generated by Svelte v3.49.0 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[31] = list[i];
	child_ctx[33] = i;
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[34] = list[i];
	child_ctx[36] = i;
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[37] = list[i];
	child_ctx[39] = i;
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[34] = list[i];
	child_ctx[41] = i;
	return child_ctx;
}

function get_each_context_4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[42] = list[i];
	child_ctx[41] = i;
	return child_ctx;
}

// (154:14) {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
function create_each_block_4(ctx) {
	let text_1;
	let t_value = gridGap * /*i*/ ctx[41] + "";
	let t;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "text-anchor", "middle");
			attr(text_1, "alignment-baseline", "central");
			attr(text_1, "x", "5%");
			attr(text_1, "y", gridGap * /*i*/ ctx[41] * -1);
			attr(text_1, "class", "svelte-4gdqkx");
		},
		m(target, anchor) {
			insert(target, text_1, anchor);
			append(text_1, t);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(text_1);
		}
	};
}

// (159:16) {#each series.category as category, i}
function create_each_block_3(ctx) {
	let g;
	let text_1;
	let t_value = /*category*/ ctx[34] + "";
	let t;
	let g_transform_value;

	return {
		c() {
			g = svg_element("g");
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "text-anchor", "end");
			attr(text_1, "class", "x_grid_text_label svelte-4gdqkx");
			attr(g, "transform", g_transform_value = "translate(" + ((/*barGroupSize*/ ctx[16] + barGap * 2) * /*i*/ ctx[41] + barGap) + ", " + /*svgHeight*/ ctx[11] * 0.15 + ")");
		},
		m(target, anchor) {
			insert(target, g, anchor);
			append(g, text_1);
			append(text_1, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series*/ 128 && t_value !== (t_value = /*category*/ ctx[34] + "")) set_data(t, t_value);

			if (dirty[0] & /*svgHeight*/ 2048 && g_transform_value !== (g_transform_value = "translate(" + ((/*barGroupSize*/ ctx[16] + barGap * 2) * /*i*/ ctx[41] + barGap) + ", " + /*svgHeight*/ ctx[11] * 0.15 + ")")) {
				attr(g, "transform", g_transform_value);
			}
		},
		d(detaching) {
			if (detaching) detach(g);
		}
	};
}

// (170:18) {#each series.series as bar, b}
function create_each_block_2(ctx) {
	let rect;
	let rect_class_value;
	let rect_fill_value;
	let rect_height_value;

	return {
		c() {
			rect = svg_element("rect");
			attr(rect, "class", rect_class_value = "" + (/*bar*/ ctx[37].name + "_bar show_bar" + " svelte-4gdqkx"));

			attr(rect, "fill", rect_fill_value = /*colors*/ ctx[12]
			? /*colors*/ ctx[12][/*b*/ ctx[39]]
			: '#ccc');

			attr(rect, "tabindex", "0");
			attr(rect, "x", /*c*/ ctx[36] * /*barGroupSize*/ ctx[16] + /*calculateBarSize*/ ctx[17]() * /*b*/ ctx[39]);
			attr(rect, "width", /*calculateBarSize*/ ctx[17]());
			attr(rect, "height", rect_height_value = /*bar*/ ctx[37].data[/*c*/ ctx[36]].value);
		},
		m(target, anchor) {
			insert(target, rect, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series*/ 128 && rect_class_value !== (rect_class_value = "" + (/*bar*/ ctx[37].name + "_bar show_bar" + " svelte-4gdqkx"))) {
				attr(rect, "class", rect_class_value);
			}

			if (dirty[0] & /*colors*/ 4096 && rect_fill_value !== (rect_fill_value = /*colors*/ ctx[12]
			? /*colors*/ ctx[12][/*b*/ ctx[39]]
			: '#ccc')) {
				attr(rect, "fill", rect_fill_value);
			}

			if (dirty[0] & /*series*/ 128 && rect_height_value !== (rect_height_value = /*bar*/ ctx[37].data[/*c*/ ctx[36]].value)) {
				attr(rect, "height", rect_height_value);
			}
		},
		d(detaching) {
			if (detaching) detach(rect);
		}
	};
}

// (168:14) {#each series.category as category, c}
function create_each_block_1(ctx) {
	let g;
	let each_value_2 = /*series*/ ctx[7].series;
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	return {
		c() {
			g = svg_element("g");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(g, "transform", "translate(" + barGap * 2 * /*c*/ ctx[36] + ",0)");
		},
		m(target, anchor) {
			insert(target, g, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(g, null);
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series, colors, barGroupSize, calculateBarSize*/ 200832) {
				each_value_2 = /*series*/ ctx[7].series;
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(g, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_2.length;
			}
		},
		d(detaching) {
			if (detaching) detach(g);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (180:10) {#each series.series as barSeries, l}
function create_each_block$1(ctx) {
	let button;
	let span;
	let t0;
	let t1_value = /*barSeries*/ ctx[31].name + "";
	let t1;
	let t2;
	let button_value_value;
	let button_id_value;
	let button_aria_label_value;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			span = element("span");
			t0 = space();
			t1 = text(t1_value);
			t2 = space();
			attr(span, "class", "dot svelte-4gdqkx");

			set_style(span, "background-color", /*colors*/ ctx[12]
			? /*colors*/ ctx[12][/*l*/ ctx[33]]
			: '#ccc');

			attr(button, "tabindex", "0");
			button.value = button_value_value = /*barSeries*/ ctx[31].name;
			attr(button, "id", button_id_value = "" + (/*idChart*/ ctx[13] + "_" + cleanIdName(/*barSeries*/ ctx[31].name)));
			attr(button, "aria-label", button_aria_label_value = /*barSeries*/ ctx[31].name);
			attr(button, "class", "caption svelte-4gdqkx");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, span);
			append(button, t0);
			append(button, t1);
			append(button, t2);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[22]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*colors*/ 4096) {
				set_style(span, "background-color", /*colors*/ ctx[12]
				? /*colors*/ ctx[12][/*l*/ ctx[33]]
				: '#ccc');
			}

			if (dirty[0] & /*series*/ 128 && t1_value !== (t1_value = /*barSeries*/ ctx[31].name + "")) set_data(t1, t1_value);

			if (dirty[0] & /*series*/ 128 && button_value_value !== (button_value_value = /*barSeries*/ ctx[31].name)) {
				button.value = button_value_value;
			}

			if (dirty[0] & /*idChart, series*/ 8320 && button_id_value !== (button_id_value = "" + (/*idChart*/ ctx[13] + "_" + cleanIdName(/*barSeries*/ ctx[31].name)))) {
				attr(button, "id", button_id_value);
			}

			if (dirty[0] & /*series*/ 128 && button_aria_label_value !== (button_aria_label_value = /*barSeries*/ ctx[31].name)) {
				attr(button, "aria-label", button_aria_label_value);
			}
		},
		d(detaching) {
			if (detaching) detach(button);
			mounted = false;
			dispose();
		}
	};
}

// (109:0) <ThemeContext>
function create_default_slot$1(ctx) {
	let div5;
	let div0;
	let t0;
	let div1;
	let t1;
	let div1_aria_labelledby_value;
	let t2;
	let div2;
	let svg;
	let title_1;
	let t3;
	let title_1_id_value;
	let desc_1;
	let t4;
	let desc_1_id_value;
	let defs;
	let pattern0;
	let path0;
	let pattern0_id_value;
	let pattern1;
	let path1;
	let g0;
	let rect0;
	let g1;
	let rect1;
	let rect1_fill_value;
	let g1_transform_value;
	let g2;
	let line0;
	let line1;
	let line2;
	let g6;
	let g3;
	let text0;
	let t5;
	let g3_transform_value;
	let g4;
	let text1;
	let t6;
	let g4_transform_value;
	let g5;
	let text2;
	let t7;
	let g5_transform_value;
	let g7;
	let g7_transform_value;
	let g8;
	let g8_transform_value;
	let g9;
	let g9_transform_value;
	let div2_resize_listener;
	let t8;
	let div3;
	let t9;
	let div4;
	let a;
	let t10;
	let t11;
	let each_value_4 = Array(Math.floor(/*svgHeight*/ ctx[11] * 0.7 / gridGap));
	let each_blocks_3 = [];

	for (let i = 0; i < each_value_4.length; i += 1) {
		each_blocks_3[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
	}

	let each_value_3 = /*series*/ ctx[7].category;
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	let each_value_1 = /*series*/ ctx[7].category;
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	let each_value = /*series*/ ctx[7].series;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c() {
			div5 = element("div");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			t1 = text(/*desc*/ ctx[1]);
			t2 = space();
			div2 = element("div");
			svg = svg_element("svg");
			title_1 = svg_element("title");
			t3 = text(/*title*/ ctx[0]);
			desc_1 = svg_element("desc");
			t4 = text(/*desc*/ ctx[1]);
			defs = svg_element("defs");
			pattern0 = svg_element("pattern");
			path0 = svg_element("path");
			pattern1 = svg_element("pattern");
			path1 = svg_element("path");
			g0 = svg_element("g");
			rect0 = svg_element("rect");
			g1 = svg_element("g");
			rect1 = svg_element("rect");
			g2 = svg_element("g");
			line0 = svg_element("line");
			line1 = svg_element("line");
			line2 = svg_element("line");
			g6 = svg_element("g");
			g3 = svg_element("g");
			text0 = svg_element("text");
			t5 = text(/*xLabel*/ ctx[5]);
			g4 = svg_element("g");
			text1 = svg_element("text");
			t6 = text(/*yLabel*/ ctx[4]);
			g5 = svg_element("g");
			text2 = svg_element("text");
			t7 = text(/*secondYLabel*/ ctx[6]);
			g7 = svg_element("g");

			for (let i = 0; i < each_blocks_3.length; i += 1) {
				each_blocks_3[i].c();
			}

			g8 = svg_element("g");

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].c();
			}

			g9 = svg_element("g");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t8 = space();
			div3 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t9 = space();
			div4 = element("div");
			a = element("a");
			t10 = text("Source: ");
			t11 = text(/*source*/ ctx[8]);
			attr(div0, "class", "title");
			attr(div1, "tabindex", "0");
			attr(div1, "class", "description");
			attr(div1, "aria-labelledby", div1_aria_labelledby_value = "" + (/*idChart*/ ctx[13] + "_desc_chart"));
			attr(title_1, "id", title_1_id_value = "" + (/*idChart*/ ctx[13] + "_title_chart"));
			attr(desc_1, "id", desc_1_id_value = "" + (/*idChart*/ ctx[13] + "_desc_chart"));
			attr(path0, "class", "grid_path svelte-4gdqkx");
			attr(path0, "d", "M 0 " + gridGap + " H 0 " + gridGap);
			attr(path0, "fill", "none");
			attr(path0, "stroke-width", "0.5");
			attr(pattern0, "id", pattern0_id_value = "" + (/*idChart*/ ctx[13] + "_grid_pattern"));
			attr(pattern0, "width", gridGap);
			attr(pattern0, "height", gridGap);
			attr(pattern0, "patternUnits", "userSpaceOnUse");
			attr(path1, "d", "M-1,1 l2,-2\r\n                         M0,4 l4,-4\r\n                         M3,5 l2,-2");
			set_style(path1, "stroke", "black");
			set_style(path1, "stroke-width", "1");
			attr(pattern1, "id", "diagonalHatch");
			attr(pattern1, "patternUnits", "userSpaceOnUse");
			attr(pattern1, "width", "4");
			attr(pattern1, "height", "4");
			attr(rect0, "width", "90%");
			attr(rect0, "class", "background-chart");
			attr(g0, "role", "none");
			attr(g0, "aria-hidden", "true");
			attr(rect1, "class", "grid_surface svelte-4gdqkx");
			set_style(rect1, "height", /*svgHeight*/ ctx[11] * 0.7);
			attr(rect1, "fill", rect1_fill_value = "url(#" + /*idChart*/ ctx[13] + "_grid_pattern)");
			attr(rect1, "transform", "scale(1, 1)");
			attr(g1, "class", "grid svelte-4gdqkx");
			attr(g1, "transform", g1_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.1 + "," + /*svgHeight*/ ctx[11] * 0.1 + ")");
			attr(line0, "class", "");
			attr(line0, "x1", "10%");
			attr(line0, "x2", "10%");
			attr(line0, "y1", "10%");
			attr(line0, "y2", "80%");
			attr(line0, "stroke", "black");
			attr(line1, "class", "");
			attr(line1, "x1", "10%");
			attr(line1, "x2", "85%");
			attr(line1, "y1", "10%");
			attr(line1, "y2", "10%");
			attr(line1, "stroke", "black");
			attr(line2, "class", "");
			attr(line2, "x1", "85%");
			attr(line2, "x2", "85%");
			attr(line2, "y1", "10%");
			attr(line2, "y2", "80%");
			attr(line2, "stroke", "black");
			attr(g2, "class", "axis");
			attr(g2, "aria-hidden", "true");
			attr(text0, "class", "x_label svelte-4gdqkx");
			attr(g3, "transform", g3_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.9 + "," + /*svgHeight*/ ctx[11] * 0.1 + ") scale(0.2 , 0.2)");
			attr(text1, "class", "y_label svelte-4gdqkx");
			attr(text1, "x", "50%");
			attr(text1, "y", "15%");
			attr(g4, "transform", g4_transform_value = "translate(0," + /*svgHeight*/ ctx[11] * 0.8 + ") scale(0.2 , 0.2)");
			attr(text2, "class", "second_y_label svelte-4gdqkx");
			attr(text2, "x", "50%");
			attr(text2, "y", "15%");
			attr(g5, "transform", g5_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.7 + "," + /*svgHeight*/ ctx[11] * 0.8 + ") scale(0.3 , 0.2)");
			attr(g6, "class", "labels");
			attr(g7, "class", "y_grid_label svelte-4gdqkx");
			attr(g7, "transform", g7_transform_value = "translate(1, " + /*svgHeight*/ ctx[11] * 0.1 + ")");
			attr(g8, "class", "x_grid_label");
			attr(g8, "transform", g8_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.1 + ", 0)");
			attr(g9, "role", "graphics-object");
			attr(g9, "transform", g9_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.1 + "," + /*svgHeight*/ ctx[11] * 0.1 + ")");
			attr(g9, "class", "functions");
			attr(svg, "class", "chart svelte-4gdqkx");
			attr(svg, "role", "graphics-document");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "width", /*width*/ ctx[2]);
			attr(svg, "height", /*height*/ ctx[3]);
			attr(div2, "class", "svg_wrap");
			add_render_callback(() => /*div2_elementresize_handler*/ ctx[21].call(div2));
			attr(div3, "class", "captions svelte-4gdqkx");
			set_style(div3, "padding", "0 " + /*svgWidth*/ ctx[10] * 0.1 + "px");
			attr(a, "tabindex", "0");
			attr(a, "href", /*source*/ ctx[8]);
			attr(div4, "class", "source svelte-4gdqkx");
			attr(div5, "class", "wrapper svelte-4gdqkx");
		},
		m(target, anchor) {
			insert(target, div5, anchor);
			append(div5, div0);
			/*div0_binding*/ ctx[19](div0);
			append(div5, t0);
			append(div5, div1);
			append(div1, t1);
			append(div5, t2);
			append(div5, div2);
			append(div2, svg);
			append(svg, title_1);
			append(title_1, t3);
			append(svg, desc_1);
			append(desc_1, t4);
			append(svg, defs);
			append(defs, pattern0);
			append(pattern0, path0);
			append(defs, pattern1);
			append(pattern1, path1);
			append(svg, g0);
			append(g0, rect0);
			append(svg, g1);
			append(g1, rect1);
			append(svg, g2);
			append(g2, line0);
			append(g2, line1);
			append(g2, line2);
			append(svg, g6);
			append(g6, g3);
			append(g3, text0);
			append(text0, t5);
			append(g6, g4);
			append(g4, text1);
			append(text1, t6);
			append(g6, g5);
			append(g5, text2);
			append(text2, t7);
			append(svg, g7);

			for (let i = 0; i < each_blocks_3.length; i += 1) {
				each_blocks_3[i].m(g7, null);
			}

			append(svg, g8);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].m(g8, null);
			}

			append(svg, g9);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(g9, null);
			}

			/*svg_binding*/ ctx[20](svg);
			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[21].bind(div2));
			append(div5, t8);
			append(div5, div3);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div3, null);
			}

			append(div5, t9);
			append(div5, div4);
			append(div4, a);
			append(a, t10);
			append(a, t11);
			/*div5_binding*/ ctx[23](div5);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*desc*/ 2) set_data(t1, /*desc*/ ctx[1]);

			if (dirty[0] & /*idChart*/ 8192 && div1_aria_labelledby_value !== (div1_aria_labelledby_value = "" + (/*idChart*/ ctx[13] + "_desc_chart"))) {
				attr(div1, "aria-labelledby", div1_aria_labelledby_value);
			}

			if (dirty[0] & /*title*/ 1) set_data(t3, /*title*/ ctx[0]);

			if (dirty[0] & /*idChart*/ 8192 && title_1_id_value !== (title_1_id_value = "" + (/*idChart*/ ctx[13] + "_title_chart"))) {
				attr(title_1, "id", title_1_id_value);
			}

			if (dirty[0] & /*desc*/ 2) set_data(t4, /*desc*/ ctx[1]);

			if (dirty[0] & /*idChart*/ 8192 && desc_1_id_value !== (desc_1_id_value = "" + (/*idChart*/ ctx[13] + "_desc_chart"))) {
				attr(desc_1, "id", desc_1_id_value);
			}

			if (dirty[0] & /*idChart*/ 8192 && pattern0_id_value !== (pattern0_id_value = "" + (/*idChart*/ ctx[13] + "_grid_pattern"))) {
				attr(pattern0, "id", pattern0_id_value);
			}

			if (dirty[0] & /*svgHeight*/ 2048) {
				set_style(rect1, "height", /*svgHeight*/ ctx[11] * 0.7);
			}

			if (dirty[0] & /*idChart*/ 8192 && rect1_fill_value !== (rect1_fill_value = "url(#" + /*idChart*/ ctx[13] + "_grid_pattern)")) {
				attr(rect1, "fill", rect1_fill_value);
			}

			if (dirty[0] & /*svgWidth, svgHeight*/ 3072 && g1_transform_value !== (g1_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.1 + "," + /*svgHeight*/ ctx[11] * 0.1 + ")")) {
				attr(g1, "transform", g1_transform_value);
			}

			if (dirty[0] & /*xLabel*/ 32) set_data(t5, /*xLabel*/ ctx[5]);

			if (dirty[0] & /*svgWidth, svgHeight*/ 3072 && g3_transform_value !== (g3_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.9 + "," + /*svgHeight*/ ctx[11] * 0.1 + ") scale(0.2 , 0.2)")) {
				attr(g3, "transform", g3_transform_value);
			}

			if (dirty[0] & /*yLabel*/ 16) set_data(t6, /*yLabel*/ ctx[4]);

			if (dirty[0] & /*svgHeight*/ 2048 && g4_transform_value !== (g4_transform_value = "translate(0," + /*svgHeight*/ ctx[11] * 0.8 + ") scale(0.2 , 0.2)")) {
				attr(g4, "transform", g4_transform_value);
			}

			if (dirty[0] & /*secondYLabel*/ 64) set_data(t7, /*secondYLabel*/ ctx[6]);

			if (dirty[0] & /*svgWidth, svgHeight*/ 3072 && g5_transform_value !== (g5_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.7 + "," + /*svgHeight*/ ctx[11] * 0.8 + ") scale(0.3 , 0.2)")) {
				attr(g5, "transform", g5_transform_value);
			}

			if (dirty[0] & /*svgHeight*/ 2048) {
				each_value_4 = Array(Math.floor(/*svgHeight*/ ctx[11] * 0.7 / gridGap));
				let i;

				for (i = 0; i < each_value_4.length; i += 1) {
					const child_ctx = get_each_context_4(ctx, each_value_4, i);

					if (each_blocks_3[i]) {
						each_blocks_3[i].p(child_ctx, dirty);
					} else {
						each_blocks_3[i] = create_each_block_4(child_ctx);
						each_blocks_3[i].c();
						each_blocks_3[i].m(g7, null);
					}
				}

				for (; i < each_blocks_3.length; i += 1) {
					each_blocks_3[i].d(1);
				}

				each_blocks_3.length = each_value_4.length;
			}

			if (dirty[0] & /*svgHeight*/ 2048 && g7_transform_value !== (g7_transform_value = "translate(1, " + /*svgHeight*/ ctx[11] * 0.1 + ")")) {
				attr(g7, "transform", g7_transform_value);
			}

			if (dirty[0] & /*barGroupSize, svgHeight, series*/ 67712) {
				each_value_3 = /*series*/ ctx[7].category;
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks_2[i]) {
						each_blocks_2[i].p(child_ctx, dirty);
					} else {
						each_blocks_2[i] = create_each_block_3(child_ctx);
						each_blocks_2[i].c();
						each_blocks_2[i].m(g8, null);
					}
				}

				for (; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].d(1);
				}

				each_blocks_2.length = each_value_3.length;
			}

			if (dirty[0] & /*svgWidth*/ 1024 && g8_transform_value !== (g8_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.1 + ", 0)")) {
				attr(g8, "transform", g8_transform_value);
			}

			if (dirty[0] & /*series, colors, barGroupSize, calculateBarSize*/ 200832) {
				each_value_1 = /*series*/ ctx[7].category;
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_1(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(g9, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_1.length;
			}

			if (dirty[0] & /*svgWidth, svgHeight*/ 3072 && g9_transform_value !== (g9_transform_value = "translate(" + /*svgWidth*/ ctx[10] * 0.1 + "," + /*svgHeight*/ ctx[11] * 0.1 + ")")) {
				attr(g9, "transform", g9_transform_value);
			}

			if (dirty[0] & /*width*/ 4) {
				attr(svg, "width", /*width*/ ctx[2]);
			}

			if (dirty[0] & /*height*/ 8) {
				attr(svg, "height", /*height*/ ctx[3]);
			}

			if (dirty[0] & /*series, idChart, colors*/ 12416) {
				each_value = /*series*/ ctx[7].series;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div3, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty[0] & /*svgWidth*/ 1024) {
				set_style(div3, "padding", "0 " + /*svgWidth*/ ctx[10] * 0.1 + "px");
			}

			if (dirty[0] & /*source*/ 256) set_data(t11, /*source*/ ctx[8]);

			if (dirty[0] & /*source*/ 256) {
				attr(a, "href", /*source*/ ctx[8]);
			}
		},
		d(detaching) {
			if (detaching) detach(div5);
			/*div0_binding*/ ctx[19](null);
			destroy_each(each_blocks_3, detaching);
			destroy_each(each_blocks_2, detaching);
			destroy_each(each_blocks_1, detaching);
			/*svg_binding*/ ctx[20](null);
			div2_resize_listener();
			destroy_each(each_blocks, detaching);
			/*div5_binding*/ ctx[23](null);
		}
	};
}

function create_fragment$1(ctx) {
	let themecontext;
	let current;

	themecontext = new ThemeContext({
			props: {
				$$slots: { default: [create_default_slot$1] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(themecontext.$$.fragment);
		},
		m(target, anchor) {
			mount_component(themecontext, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const themecontext_changes = {};

			if (dirty[0] & /*rootNode, source, svgWidth, series, idChart, colors, svgHeight, width, height, svgImage, secondYLabel, yLabel, xLabel, desc, title, headerChartParentTag*/ 65535 | dirty[1] & /*$$scope*/ 8192) {
				themecontext_changes.$$scope = { dirty, ctx };
			}

			themecontext.$set(themecontext_changes);
		},
		i(local) {
			if (current) return;
			transition_in(themecontext.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(themecontext.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(themecontext, detaching);
		}
	};
}

var gridGap = 20;
var barGap = 6;

function cleanIdName(name) {
	return name.replace(/\s/g, "");
}

function generateId$1() {
	return Date.now().toString(36) + Math.floor(Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)).toString(36);
}

function toggleBars(event) {
	let button = event.target;
	let bars = document.getElementsByClassName(button.value + '_bar');

	if (button.classList.contains('inactive')) {
		button.classList.remove('inactive');

		for (let numberOfBar = 0; numberOfBar < bars.length; numberOfBar++) {
			bars[numberOfBar].classList.replace('hide_bar', 'show_bar');
		}
	} else {
		button.classList.add('inactive');

		for (let numberOfBar = 0; numberOfBar < bars.length; numberOfBar++) {
			bars[numberOfBar].classList.replace('show_bar', 'hide_bar');
		}
	}
}

function instance$1($$self, $$props, $$invalidate) {
	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
			? value
			: new P(function (resolve) {
						resolve(value);
					});
		}

		return new (P || (P = Promise))(function (resolve, reject) {
				function fulfilled(value) {
					try {
						step(generator.next(value));
					} catch(e) {
						reject(e);
					}
				}

				function rejected(value) {
					try {
						step(generator["throw"](value));
					} catch(e) {
						reject(e);
					}
				}

				function step(result) {
					result.done
					? resolve(result.value)
					: adopt(result.value).then(fulfilled, rejected);
				}

				step((generator = generator.apply(thisArg, _arguments || [])).next());
			});
	};

	let { title = '' } = $$props;
	let { desc = "" } = $$props;
	let { theme = defaultTheme } = $$props;
	let { width = "800" } = $$props;
	let { height = "300" } = $$props;
	let { yLabel = 'Y-Axis' } = $$props;
	let { xLabel = 'X-Axis' } = $$props;
	let { secondYLabel = 'Second Y-Axis' } = $$props;
	let { series = null } = $$props;
	let { source = "" } = $$props;
	var svgImage = null;
	var svgWidth = 0;
	var svgHeight = 0;
	var colors;
	var idChart;
	var rootNode;
	var headerChartParentTag;
	var barGroupSize = calculateBarGroupSize();

	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
		$$invalidate(13, idChart = generateId$1());
		createHeaderTag(findParentHeader());
		$$invalidate(12, colors = Object.values(theme[0].color));
		console.log('bar-colors: ', colors);
		var bar = series.series;
		console.log('series: ', bar[0].name);
	}));

	function createHeaderTag(headerNumber) {
		var newHeader;

		if (headerNumber > 5) {
			console.warn('Headline cannot be created. HTML allows only h1 - h6. The chart would get h' + ++headerNumber);
		} else {
			if (headerNumber === null) {
				console.warn('Creating a h1 header! Is this intended?');
				newHeader = document.createElement('h' + (headerNumber + 1));
			} else {
				newHeader = document.createElement('h' + (headerNumber + 1));
			}

			newHeader.setAttribute('tabindex', '0');
			newHeader.setAttribute('aria-labelledby', idChart + '_title_chart');
			newHeader.innerHTML = title;
			headerChartParentTag.appendChild(newHeader);
		}
	}

	function findParentHeader() {
		var parent = rootNode.parentElement;
		var resultHeader = null;

		while (parent.tagName !== 'HTML' && resultHeader === null) {
			Array.from(parent.children).reverse().forEach(element => {
				if (element.tagName.toLowerCase().match('h1|h2|h3|h4|h5|h6') && resultHeader === null) {
					resultHeader = parseInt(element.tagName[1]);
				}
			});

			parent = parent.parentElement;
		}

		return resultHeader;
	}

	function calculateBarGroupSize() {
		return parseInt(width) * 0.75 / series.category.length - barGap * 2;
	}

	function calculateBarSize() {
		return barGroupSize / series.series.length;
	}

	function div0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			headerChartParentTag = $$value;
			$$invalidate(15, headerChartParentTag);
		});
	}

	function svg_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			svgImage = $$value;
			$$invalidate(9, svgImage);
		});
	}

	function div2_elementresize_handler() {
		svgWidth = this.clientWidth;
		svgHeight = this.clientHeight;
		$$invalidate(10, svgWidth);
		$$invalidate(11, svgHeight);
	}

	const click_handler = event => toggleBars(event);

	function div5_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			rootNode = $$value;
			$$invalidate(14, rootNode);
		});
	}

	$$self.$$set = $$props => {
		if ('title' in $$props) $$invalidate(0, title = $$props.title);
		if ('desc' in $$props) $$invalidate(1, desc = $$props.desc);
		if ('theme' in $$props) $$invalidate(18, theme = $$props.theme);
		if ('width' in $$props) $$invalidate(2, width = $$props.width);
		if ('height' in $$props) $$invalidate(3, height = $$props.height);
		if ('yLabel' in $$props) $$invalidate(4, yLabel = $$props.yLabel);
		if ('xLabel' in $$props) $$invalidate(5, xLabel = $$props.xLabel);
		if ('secondYLabel' in $$props) $$invalidate(6, secondYLabel = $$props.secondYLabel);
		if ('series' in $$props) $$invalidate(7, series = $$props.series);
		if ('source' in $$props) $$invalidate(8, source = $$props.source);
	};

	return [
		title,
		desc,
		width,
		height,
		yLabel,
		xLabel,
		secondYLabel,
		series,
		source,
		svgImage,
		svgWidth,
		svgHeight,
		colors,
		idChart,
		rootNode,
		headerChartParentTag,
		barGroupSize,
		calculateBarSize,
		theme,
		div0_binding,
		svg_binding,
		div2_elementresize_handler,
		click_handler,
		div5_binding
	];
}

class BarChart extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$1,
			create_fragment$1,
			safe_not_equal,
			{
				title: 0,
				desc: 1,
				theme: 18,
				width: 2,
				height: 3,
				yLabel: 4,
				xLabel: 5,
				secondYLabel: 6,
				series: 7,
				source: 8
			},
			null,
			[-1, -1]
		);
	}
}

function getXCoordinateForPercent(decimalPointPercent) {
    //console.log("getXCoordinateForPercent: ", Math.cos(2 * Math.PI * percent));
    return Math.cos(2 * Math.PI * decimalPointPercent);
}

var css_248z = ".pie_chart_text.svelte-ns99wt{font-size:0.12px}.slice.svelte-ns99wt{outline:none}.show_slice_border{stroke:#646464;outline:none;stroke-width:0.05px;stroke-linecap:square;fill:none !important;border:none !important;color:none}";
styleInject(css_248z);

/* src\components\PieChart.svelte generated by Svelte v3.49.0 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[31] = list[i];
	child_ctx[33] = i;
	return child_ctx;
}

// (133:20) {#each series as slice, index }
function create_each_block(ctx) {
	let path;
	let path_aria_label_value;
	let path_fill_value;
	let path_d_value;
	let text_1;
	let t_value = /*slice*/ ctx[31].name + "";
	let t;
	let text_1_id_value;
	let text_1_x_value;
	let text_1_y_value;
	let mounted;
	let dispose;

	return {
		c() {
			path = svg_element("path");
			text_1 = svg_element("text");
			t = text(t_value);
			attr(path, "class", "slice svelte-ns99wt");
			attr(path, "role", "graphics-symbol");
			attr(path, "aria-label", path_aria_label_value = "This slice of pie chart has " + /*slice*/ ctx[31].percent + "%. This is slice " + (/*index*/ ctx[33] + 1) + " of " + /*series*/ ctx[4].length);
			attr(path, "tabindex", "0");

			attr(path, "fill", path_fill_value = /*colors*/ ctx[8]
			? /*colors*/ ctx[8][/*index*/ ctx[33]]
			: '#000');

			attr(path, "d", path_d_value = 'M ' + getXCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]]) + " " + getYCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]]) + " A 1 1 0 " + calculateLargeArcFlag(/*slice*/ ctx[31].percent) + " 1 " + getXCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]] + /*slice*/ ctx[31].percent) + " " + getYCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]] + /*slice*/ ctx[31].percent) + "L 0 0 L" + getXCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]]) + " " + getYCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]]));
			attr(text_1, "id", text_1_id_value = "" + (/*idChart*/ ctx[9] + "_" + /*slice*/ ctx[31].name + "_slice"));
			attr(text_1, "class", "pie_chart_text svelte-ns99wt");

			attr(text_1, "text-anchor", /*cumulativePercents*/ ctx[13][/*index*/ ctx[33] + 1] >= 0.5 && /*cumulativePercents*/ ctx[13][/*index*/ ctx[33] + 1] <= 0.75
			? 'end'
			: 'start');

			attr(text_1, "x", text_1_x_value = getXCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33] + 1] - /*slice*/ ctx[31].percent / 2) * 1.1);
			attr(text_1, "y", text_1_y_value = getYCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33] + 1] - /*slice*/ ctx[31].percent / 2) * 1.1);
		},
		m(target, anchor) {
			insert(target, path, anchor);
			insert(target, text_1, anchor);
			append(text_1, t);

			if (!mounted) {
				dispose = [
					listen(path, "blur", /*blur_handler*/ ctx[19]),
					listen(path, "focus", /*focus_handler*/ ctx[20])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series*/ 16 && path_aria_label_value !== (path_aria_label_value = "This slice of pie chart has " + /*slice*/ ctx[31].percent + "%. This is slice " + (/*index*/ ctx[33] + 1) + " of " + /*series*/ ctx[4].length)) {
				attr(path, "aria-label", path_aria_label_value);
			}

			if (dirty[0] & /*colors*/ 256 && path_fill_value !== (path_fill_value = /*colors*/ ctx[8]
			? /*colors*/ ctx[8][/*index*/ ctx[33]]
			: '#000')) {
				attr(path, "fill", path_fill_value);
			}

			if (dirty[0] & /*series*/ 16 && path_d_value !== (path_d_value = 'M ' + getXCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]]) + " " + getYCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]]) + " A 1 1 0 " + calculateLargeArcFlag(/*slice*/ ctx[31].percent) + " 1 " + getXCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]] + /*slice*/ ctx[31].percent) + " " + getYCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]] + /*slice*/ ctx[31].percent) + "L 0 0 L" + getXCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]]) + " " + getYCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33]]))) {
				attr(path, "d", path_d_value);
			}

			if (dirty[0] & /*series*/ 16 && t_value !== (t_value = /*slice*/ ctx[31].name + "")) set_data(t, t_value);

			if (dirty[0] & /*idChart, series*/ 528 && text_1_id_value !== (text_1_id_value = "" + (/*idChart*/ ctx[9] + "_" + /*slice*/ ctx[31].name + "_slice"))) {
				attr(text_1, "id", text_1_id_value);
			}

			if (dirty[0] & /*series*/ 16 && text_1_x_value !== (text_1_x_value = getXCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33] + 1] - /*slice*/ ctx[31].percent / 2) * 1.1)) {
				attr(text_1, "x", text_1_x_value);
			}

			if (dirty[0] & /*series*/ 16 && text_1_y_value !== (text_1_y_value = getYCoordinateForPercent(/*cumulativePercents*/ ctx[13][/*index*/ ctx[33] + 1] - /*slice*/ ctx[31].percent / 2) * 1.1)) {
				attr(text_1, "y", text_1_y_value);
			}
		},
		d(detaching) {
			if (detaching) detach(path);
			if (detaching) detach(text_1);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (115:6) <ThemeContext>
function create_default_slot(ctx) {
	let div3;
	let div0;
	let t0;
	let div1;
	let t1;
	let div1_aria_labelledby_value;
	let t2;
	let div2;
	let svg;
	let title_1;
	let t3;
	let title_1_id_value;
	let desc_1;
	let t4;
	let desc_1_id_value;
	let g0;
	let g1;
	let div2_resize_listener;
	let each_value = /*series*/ ctx[4];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			div3 = element("div");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			t1 = text(/*desc*/ ctx[1]);
			t2 = space();
			div2 = element("div");
			svg = svg_element("svg");
			title_1 = svg_element("title");
			t3 = text(/*title*/ ctx[0]);
			desc_1 = svg_element("desc");
			t4 = text(/*desc*/ ctx[1]);
			g0 = svg_element("g");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			g1 = svg_element("g");
			attr(div0, "class", "title");
			attr(div1, "tabindex", "0");
			attr(div1, "class", "description");
			attr(div1, "aria-labelledby", div1_aria_labelledby_value = "" + (/*idChart*/ ctx[9] + "_desc_chart"));
			attr(title_1, "id", title_1_id_value = "" + (/*idChart*/ ctx[9] + "_title_chart"));
			attr(desc_1, "id", desc_1_id_value = "" + (/*idChart*/ ctx[9] + "_desc_chart"));
			attr(g0, "transform", "");
			attr(g1, "class", "display_front");
			attr(svg, "class", "chart");
			attr(svg, "role", "graphics-document");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "viewBox", "-1.25 -1.25 2.5 2.5");
			attr(svg, "width", /*width*/ ctx[2]);
			attr(svg, "height", /*height*/ ctx[3]);
			attr(div2, "class", "svg_wrap");
			add_render_callback(() => /*div2_elementresize_handler*/ ctx[23].call(div2));
			attr(div3, "class", "wrapper");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div0);
			/*div0_binding*/ ctx[18](div0);
			append(div3, t0);
			append(div3, div1);
			append(div1, t1);
			append(div3, t2);
			append(div3, div2);
			append(div2, svg);
			append(svg, title_1);
			append(title_1, t3);
			append(svg, desc_1);
			append(desc_1, t4);
			append(svg, g0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(g0, null);
			}

			append(svg, g1);
			/*g1_binding*/ ctx[21](g1);
			/*svg_binding*/ ctx[22](svg);
			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[23].bind(div2));
			/*div3_binding*/ ctx[24](div3);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*desc*/ 2) set_data(t1, /*desc*/ ctx[1]);

			if (dirty[0] & /*idChart*/ 512 && div1_aria_labelledby_value !== (div1_aria_labelledby_value = "" + (/*idChart*/ ctx[9] + "_desc_chart"))) {
				attr(div1, "aria-labelledby", div1_aria_labelledby_value);
			}

			if (dirty[0] & /*title*/ 1) set_data(t3, /*title*/ ctx[0]);

			if (dirty[0] & /*idChart*/ 512 && title_1_id_value !== (title_1_id_value = "" + (/*idChart*/ ctx[9] + "_title_chart"))) {
				attr(title_1, "id", title_1_id_value);
			}

			if (dirty[0] & /*desc*/ 2) set_data(t4, /*desc*/ ctx[1]);

			if (dirty[0] & /*idChart*/ 512 && desc_1_id_value !== (desc_1_id_value = "" + (/*idChart*/ ctx[9] + "_desc_chart"))) {
				attr(desc_1, "id", desc_1_id_value);
			}

			if (dirty[0] & /*idChart, series, cumulativePercents, colors, removeAllChildNodes, moveSliceForward*/ 58128) {
				each_value = /*series*/ ctx[4];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(g0, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty[0] & /*width*/ 4) {
				attr(svg, "width", /*width*/ ctx[2]);
			}

			if (dirty[0] & /*height*/ 8) {
				attr(svg, "height", /*height*/ ctx[3]);
			}
		},
		d(detaching) {
			if (detaching) detach(div3);
			/*div0_binding*/ ctx[18](null);
			destroy_each(each_blocks, detaching);
			/*g1_binding*/ ctx[21](null);
			/*svg_binding*/ ctx[22](null);
			div2_resize_listener();
			/*div3_binding*/ ctx[24](null);
		}
	};
}

function create_fragment(ctx) {
	let themecontext;
	let current;

	themecontext = new ThemeContext({
			props: {
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			create_component(themecontext.$$.fragment);
		},
		m(target, anchor) {
			mount_component(themecontext, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const themecontext_changes = {};

			if (dirty[0] & /*rootNode, svgWidth, svgHeight, width, height, svgImage, displayFront, series, idChart, colors, desc, title, headerChartParentTag*/ 8191 | dirty[1] & /*$$scope*/ 8) {
				themecontext_changes.$$scope = { dirty, ctx };
			}

			themecontext.$set(themecontext_changes);
		},
		i(local) {
			if (current) return;
			transition_in(themecontext.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(themecontext.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(themecontext, detaching);
		}
	};
}

function partialSum(series) {
	let partialSliceSums = Array(series.length).fill(0);

	for (let i = 0; i < series.length; i++) {
		if (i === 0) {
			partialSliceSums[i] = series[i].percent;
		} else {
			partialSliceSums[i] = partialSliceSums[i - 1] + series[i].percent;
		}
	}

	partialSliceSums.unshift(0);
	return partialSliceSums;
}

function generateId() {
	return Date.now().toString(36) + Math.floor(Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)).toString(36);
}

// function getXCoordinateForPercent(percent: number){
//   //console.log("getXCoordinateForPercent: ", Math.cos(2 * Math.PI * percent));
//   return  Math.cos(2 * Math.PI * percent);
// }
function getYCoordinateForPercent(percent) {
	//console.log("getYCoordinateForPercent: ", Math.sin(2 * Math.PI * percent));
	return Math.sin(2 * Math.PI * percent);
}

function calculateLargeArcFlag(percent) {
	//console.log("calculateLargeArcFlag: ", percent > .5 ? 1 : 0);
	return percent > .5 ? 1 : 0;
}

function instance($$self, $$props, $$invalidate) {
	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
			? value
			: new P(function (resolve) {
						resolve(value);
					});
		}

		return new (P || (P = Promise))(function (resolve, reject) {
				function fulfilled(value) {
					try {
						step(generator.next(value));
					} catch(e) {
						reject(e);
					}
				}

				function rejected(value) {
					try {
						step(generator["throw"](value));
					} catch(e) {
						reject(e);
					}
				}

				function step(result) {
					result.done
					? resolve(result.value)
					: adopt(result.value).then(fulfilled, rejected);
				}

				step((generator = generator.apply(thisArg, _arguments || [])).next());
			});
	};

	let { title = '' } = $$props;
	let { desc = "" } = $$props;
	let { theme = defaultTheme } = $$props;
	let { width = "800" } = $$props;
	let { height = "300" } = $$props;
	let { series = [] } = $$props;
	let { source = "" } = $$props;
	var svgImage = null;
	var svgWidth = 0;
	var svgHeight = 0;
	var colors;
	var idChart;
	var rootNode;
	var headerChartParentTag;
	let cumulativePercents = partialSum(series);
	let displayFront;

	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
		$$invalidate(8, colors = Object.values(theme[0].color));
		$$invalidate(9, idChart = generateId());
		console.log('cumulative: ', cumulativePercents);
		createHeaderTag(findParentHeader());
	}));

	function createHeaderTag(headerNumber) {
		var newHeader;

		if (headerNumber > 5) {
			console.warn('Headline cannot be created. HTML allows only h1 - h6. The chart would get h' + ++headerNumber);
		} else {
			console.log('Headernumber: ', headerNumber);

			if (headerNumber === null) {
				console.warn('Creating a h1 header! Is this intended?');
				newHeader = document.createElement('h' + (headerNumber + 1));
			} else {
				newHeader = document.createElement('h' + (headerNumber + 1));
			}

			newHeader.setAttribute('tabindex', '0');
			newHeader.setAttribute('aria-labelledby', idChart + '_title_chart');
			newHeader.innerHTML = title;
			headerChartParentTag.appendChild(newHeader);
		}
	}

	function findParentHeader() {
		var parent = rootNode.parentElement;
		var resultHeader = null;

		while (parent.tagName !== 'HTML' && resultHeader === null) {
			Array.from(parent.children).reverse().forEach(element => {
				if (element.tagName.toLowerCase().match('h1|h2|h3|h4|h5|h6') && resultHeader === null) {
					resultHeader = parseInt(element.tagName[1]);
				}
			});

			parent = parent.parentElement;
		}

		return resultHeader;
	}

	function moveSliceForward(event) {
		let slice = event.target;

		//console.log(slice.getAttribute('d'));
		let sliceBorder = document.createElementNS('http://www.w3.org/2000/svg', 'path');

		sliceBorder.setAttribute('d', slice.getAttribute('d').toString());
		sliceBorder.classList.add('show_slice_border');
		displayFront.appendChild(sliceBorder);
	}

	function removeAllChildNodes() {
		while (displayFront.firstChild) {
			displayFront.removeChild(displayFront.firstChild);
			console.log('remove');
		}
	}

	function div0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			headerChartParentTag = $$value;
			$$invalidate(11, headerChartParentTag);
		});
	}

	const blur_handler = () => removeAllChildNodes();
	const focus_handler = event => moveSliceForward(event);

	function g1_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			displayFront = $$value;
			$$invalidate(12, displayFront);
		});
	}

	function svg_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			svgImage = $$value;
			$$invalidate(5, svgImage);
		});
	}

	function div2_elementresize_handler() {
		svgWidth = this.clientWidth;
		svgHeight = this.clientHeight;
		$$invalidate(6, svgWidth);
		$$invalidate(7, svgHeight);
	}

	function div3_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			rootNode = $$value;
			$$invalidate(10, rootNode);
		});
	}

	$$self.$$set = $$props => {
		if ('title' in $$props) $$invalidate(0, title = $$props.title);
		if ('desc' in $$props) $$invalidate(1, desc = $$props.desc);
		if ('theme' in $$props) $$invalidate(16, theme = $$props.theme);
		if ('width' in $$props) $$invalidate(2, width = $$props.width);
		if ('height' in $$props) $$invalidate(3, height = $$props.height);
		if ('series' in $$props) $$invalidate(4, series = $$props.series);
		if ('source' in $$props) $$invalidate(17, source = $$props.source);
	};

	return [
		title,
		desc,
		width,
		height,
		series,
		svgImage,
		svgWidth,
		svgHeight,
		colors,
		idChart,
		rootNode,
		headerChartParentTag,
		displayFront,
		cumulativePercents,
		moveSliceForward,
		removeAllChildNodes,
		theme,
		source,
		div0_binding,
		blur_handler,
		focus_handler,
		g1_binding,
		svg_binding,
		div2_elementresize_handler,
		div3_binding
	];
}

class PieChart extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				title: 0,
				desc: 1,
				theme: 16,
				width: 2,
				height: 3,
				series: 4,
				source: 17
			},
			null,
			[-1, -1]
		);
	}
}

export { BarChart, LineChart, PieChart };
