'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var typebox = require('@sinclair/typebox');

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
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
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

var css_248z$3 = "text{font-family:'Fira Sans', 'Helvetica Neue', 'Helvetica', sans-serif !important}.no_series_label{transform:scale(1,-1);background-color:var(--wrapperStyles-backgroundColor)}";
styleInject(css_248z$3);

/* src\core\ThemeContext.svelte generated by Svelte v3.49.0 */

function create_fragment$4(ctx) {
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

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
				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
					update_slot_base(
						default_slot,
						default_slot_template,
						ctx,
						/*$$scope*/ ctx[1],
						!current
						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
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

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { theme } = $$props;

	onMount(() => {
		setRootColors(theme);
	});

	const setRootColors = theme => {
		for (let [attr, obj] of Object.entries(theme)) {
			if (attr === 'name') {
				continue;
			} else {
				if (attr === "focusColor") {
					document.documentElement.style.setProperty(`--${attr}`, `${obj}`);
					continue;
				}

				for (let [prop, value] of Object.entries(obj)) {
					let varString;

					if (attr !== 'colors') {
						varString = `--${attr}-${prop}`;
						document.documentElement.style.setProperty(varString, value);
					}
				}
			}
		}

		document.documentElement.style.setProperty("--theme-name", theme.name);
	};

	$$self.$$set = $$props => {
		if ('theme' in $$props) $$invalidate(0, theme = $$props.theme);
		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [theme, $$scope, slots];
}

class ThemeContext extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { theme: 0 });
	}
}

typebox.Type.Object({
    name: typebox.Type.String(),
    pattern: typebox.Type.String(),
});
// Added "no-shadow". It is not a bug or bad practice. There is a bug in eslint
// See: https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
/* eslint-disable no-shadow,  no-unused-vars */
var HATCH_PATTERNS;
(function (HATCH_PATTERNS) {
    HATCH_PATTERNS["CIRCLES"] = "circles";
    HATCH_PATTERNS["SQUARE"] = "square";
    HATCH_PATTERNS["H_LINE"] = "hLine";
    HATCH_PATTERNS["DIAGONAL"] = "diagonal";
})(HATCH_PATTERNS || (HATCH_PATTERNS = {}));
/* eslint-enable no-shadow,  no-unused-vars */

const CONTRAST_COLORS = [
    '#003b49',
    '#41b6e6',
    '#d3273e',
    '#ffc845',
    '#d6d2c4',
    '#00bfb2',
];
const Colors = typebox.Type.Array(typebox.Type.String());
const Grid = typebox.Type.Object({
    gridColor: typebox.Type.String(),
    gridSize: typebox.Type.String(),
});
const WrapperStyle = typebox.Type.Object({
    backgroundColor: typebox.Type.String(),
});
typebox.Type.Object({
    name: typebox.Type.String(),
    colors: Colors,
    circles: typebox.Type.Object({
        radius: typebox.Type.String(),
        focusColor: typebox.Type.String(),
        focusRadius: typebox.Type.String(),
    }),
    grid: Grid,
    wrapperStyles: WrapperStyle,
});
// PieTheme
typebox.Type.Object({
    name: typebox.Type.String(),
    colors: Colors,
    focusColor: typebox.Type.String(),
    wrapperStyles: WrapperStyle,
});
typebox.Type.Object({
    name: typebox.Type.String(),
    wrapperStyles: WrapperStyle,
    colors: Colors,
    focusColor: typebox.Type.String(),
    grid: Grid,
    hatches: typebox.Type.Array(typebox.Type.String()),
});

const defaultLineTheme = {
    name: 'defaultLineTheme',
    colors: CONTRAST_COLORS,
    circles: {
        radius: '3px',
        focusColor: '#000000',
        focusRadius: '50px',
    },
    wrapperStyles: {
        backgroundColor: '#F7F7F7',
    },
    grid: {
        gridColor: '',
        gridSize: '',
    },
};
const defaultPieTheme = {
    name: 'pieDefaultTheme',
    colors: CONTRAST_COLORS,
    focusColor: '#66ff99',
    wrapperStyles: { backgroundColor: '#F7F7F7' },
};
const defaultBarTheme = {
    name: 'barDefaultTheme',
    colors: CONTRAST_COLORS,
    focusColor: '#66ff99',
    wrapperStyles: {
        backgroundColor: '#F7F7F7',
    },
    grid: {
        gridColor: '',
        gridSize: '',
    },
    hatches: [HATCH_PATTERNS.CIRCLES, HATCH_PATTERNS.DIAGONAL, HATCH_PATTERNS.H_LINE],
};

function findParentHeaderOfElement(startNode) {
    let parent = startNode.parentElement;
    let resultHeader = 0;
    while (parent.tagName !== 'HTML' && resultHeader === 0) {
        const nodes = Array.from(parent.children);
        for (let index = nodes.length - 1; index >= 0; index -= 1) {
            if (nodes[index].tagName.toLowerCase().match('h1|h2|h3|h4|h5|h6') && resultHeader === -1) {
                resultHeader = parseInt(nodes[index].tagName[1], 10);
            }
        }
        parent = parent.parentElement;
    }
    return resultHeader;
}
function createHeaderTagForElement(parendNode, title) {
    const headerNumber = findParentHeaderOfElement(parendNode);
    let newHeader;
    if (headerNumber > 5) {
        // eslint-disable-next-line no-console
        console.warn(`Headline cannot be created. HTML allows only h1 - h6. The chart would get h${headerNumber + 1}`);
    }
    else {
        // console.log('Headernumber: ', headerNumber);
        if (headerNumber === 0) {
            // eslint-disable-next-line no-console
            console.warn('Creating a h1 header! Is this intended?');
            newHeader = document.createElement(`h${headerNumber + 1}`);
        }
        else {
            newHeader = document.createElement(`h${headerNumber + 1}`);
        }
        newHeader.setAttribute('tabindex', '0');
        newHeader.setAttribute('aria-label', title);
        newHeader.innerHTML = title;
        parendNode.appendChild(newHeader);
    }
}

// eslint-disable-next-line import/prefer-default-export
function generateId() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < 5; i += 1) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

typebox.Type.Object({
    x: typebox.Type.String(),
    y: typebox.Type.String(),
    secondY: typebox.Type.String(),
});
const defaultLabel = {
    x: 'X-Axis',
    y: 'Y-Axis',
    secondY: '',
};

var css_248z$2 = ".wrapper.svelte-120u2pf.svelte-120u2pf{background-color:var(--wrapperStyles-backgroundColor);display:inline-block}.svg_wrap.svelte-120u2pf.svelte-120u2pf{display:inline-block}circle.svelte-120u2pf.svelte-120u2pf:focus{outline:var(--circles-focusColor);outline-style:solid;outline-width:2px;border-radius:var(--circles-focusRadius);text-anchor:middle}.background-chart.svelte-120u2pf.svelte-120u2pf{fill:none;width:100%;height:100%}.chart.svelte-120u2pf.svelte-120u2pf{transform:scale(1,-1);width:100%;height:100%;overflow:visible}.grid_surface.svelte-120u2pf.svelte-120u2pf{width:75%;height:70%}.grid.svelte-120u2pf.svelte-120u2pf{width:80%}.grid_path.svelte-120u2pf.svelte-120u2pf{stroke:darkgray}.x_label.svelte-120u2pf.svelte-120u2pf{transform:scale(5, -5)  !important;transform-origin:center center;transform-box:fill-box;font-size:14px;background-color:var(--wrapperStyles-backgroundColor)}.y_label.svelte-120u2pf.svelte-120u2pf{transform:scale(5, -5)  !important;transform-origin:center center;transform-box:fill-box;text-anchor:middle;font-size:14px;background-color:var(--wrapperStyles-backgroundColor)}.second_y_label.svelte-120u2pf.svelte-120u2pf{transform:scale(3, -5)  !important;transform-origin:center center;transform-box:fill-box;font-size:14px;text-anchor:middle;background-color:var(--wrapperStyles-backgroundColor)}.captions.svelte-120u2pf.svelte-120u2pf{margin:10px 0 0 0;display:flex;flex-direction:row;gap:5px}.caption.svelte-120u2pf.svelte-120u2pf{flex-wrap:nowrap;margin:5px;padding:0 10px;background-color:#fff;box-shadow:0px 0px 1px 1px lightgray;display:flex;flex-direction:row;align-items:center;gap:5px}.inactive > .dot{background-color:gray !important}.inactive{color:gray;opacity:0.7}.grid_label.svelte-120u2pf>text.svelte-120u2pf{transform:scale(1, -1);font-size:11px;background-color:var(--wrapperStyles-backgroundColor)}.show_line.svelte-120u2pf.svelte-120u2pf{visibility:visible}.hide_line{display:none !important}.info.svelte-120u2pf.svelte-120u2pf{font-size:9px !important;font-weight:lighter;letter-spacing:2px}.blur_info.svelte-120u2pf.svelte-120u2pf{display:none}.source.svelte-120u2pf.svelte-120u2pf{font-size:9px;text-align:right;padding-right:10px;padding-bottom:2px}polyline.svelte-120u2pf.svelte-120u2pf{visibility:visible}.dot.svelte-120u2pf.svelte-120u2pf{height:10px;width:10px;border-radius:50%;display:inline-block;pointer-events:none}.chart_title.svelte-120u2pf.svelte-120u2pf{text-align:center}.chart_desc.svelte-120u2pf.svelte-120u2pf{text-align:center !important}";
styleInject(css_248z$2);

/* src\components\LineChart.svelte generated by Svelte v3.49.0 */

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[26] = list[i];
	child_ctx[28] = i;
	return child_ctx;
}

function get_each_context_1$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[29] = list[i];
	child_ctx[28] = i;
	return child_ctx;
}

function get_each_context_2$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[31] = list[i];
	child_ctx[33] = i;
	return child_ctx;
}

function get_each_context_3$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[34] = list[i];
	child_ctx[36] = i;
	return child_ctx;
}

function get_each_context_4$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[34] = list[i];
	child_ctx[36] = i;
	return child_ctx;
}

// (131:10) {#if !isSeriesEmpty(series)}
function create_if_block_5$1(ctx) {
	let rect;
	let rect_height_value;
	let rect_fill_value;

	return {
		c() {
			rect = svg_element("rect");
			attr(rect, "class", "grid_surface svelte-120u2pf");
			attr(rect, "height", rect_height_value = /*svgHeight*/ ctx[6] * 0.7);
			attr(rect, "fill", rect_fill_value = "url(#" + /*idChart*/ ctx[8] + "_grid_pattern)");
			attr(rect, "transform", "scale(1, 1)");
		},
		m(target, anchor) {
			insert(target, rect, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*svgHeight*/ 64 && rect_height_value !== (rect_height_value = /*svgHeight*/ ctx[6] * 0.7)) {
				attr(rect, "height", rect_height_value);
			}

			if (dirty[0] & /*idChart*/ 256 && rect_fill_value !== (rect_fill_value = "url(#" + /*idChart*/ ctx[8] + "_grid_pattern)")) {
				attr(rect, "fill", rect_fill_value);
			}
		},
		d(detaching) {
			if (detaching) detach(rect);
		}
	};
}

// (157:10) {#if !isSeriesEmpty(series)}
function create_if_block_3$2(ctx) {
	let each0_anchor;
	let each1_anchor;
	let each_value_4 = Array(Math.floor(/*svgHeight*/ ctx[6] * 0.7 / gridGap$1));
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_4.length; i += 1) {
		each_blocks_1[i] = create_each_block_4$1(get_each_context_4$1(ctx, each_value_4, i));
	}

	let each_value_3 = Array(Math.floor(/*svgWidth*/ ctx[5] * 0.8 / gridGap$1));
	let each_blocks = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			each0_anchor = empty();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(target, anchor);
			}

			insert(target, each0_anchor, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*svgHeight*/ 64) {
				each_value_4 = Array(Math.floor(/*svgHeight*/ ctx[6] * 0.7 / gridGap$1));
				let i;

				for (i = 0; i < each_value_4.length; i += 1) {
					const child_ctx = get_each_context_4$1(ctx, each_value_4, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_4$1(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(each0_anchor.parentNode, each0_anchor);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_4.length;
			}

			if (dirty[0] & /*svgWidth*/ 32) {
				each_value_3 = Array(Math.floor(/*svgWidth*/ ctx[5] * 0.8 / gridGap$1));
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_3$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_3.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks_1, detaching);
			if (detaching) detach(each0_anchor);
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each1_anchor);
		}
	};
}

// (158:12) {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
function create_each_block_4$1(ctx) {
	let text_1;
	let t_value = gridGap$1 * /*i*/ ctx[36] + "";
	let t;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "text-anchor", "middle");
			attr(text_1, "alignment-baseline", "central");
			attr(text_1, "x", "5%");
			attr(text_1, "y", gridGap$1 * /*i*/ ctx[36] * -1);
			attr(text_1, "class", "svelte-120u2pf");
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

// (162:14) {#if i%2 == 0}
function create_if_block_4$2(ctx) {
	let text_1;
	let t_value = gridGap$1 * /*i*/ ctx[36] + "";
	let t;
	let text_1_x_value;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "text-anchor", "middle");
			attr(text_1, "x", text_1_x_value = gridGap$1 * /*i*/ ctx[36] + /*svgWidth*/ ctx[5] * 0.1);
			attr(text_1, "y", "7%");
			attr(text_1, "class", "svelte-120u2pf");
		},
		m(target, anchor) {
			insert(target, text_1, anchor);
			append(text_1, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*svgWidth*/ 32 && text_1_x_value !== (text_1_x_value = gridGap$1 * /*i*/ ctx[36] + /*svgWidth*/ ctx[5] * 0.1)) {
				attr(text_1, "x", text_1_x_value);
			}
		},
		d(detaching) {
			if (detaching) detach(text_1);
		}
	};
}

// (161:12) {#each Array(Math.floor((svgWidth*0.8)/gridGap)) as _, i}
function create_each_block_3$1(ctx) {
	let if_block_anchor;
	let if_block = /*i*/ ctx[36] % 2 == 0 && create_if_block_4$2(ctx);

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
			if (/*i*/ ctx[36] % 2 == 0) if_block.p(ctx, dirty);
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (195:10) {:else}
function create_else_block$2(ctx) {
	let text_1;
	let t;

	return {
		c() {
			text_1 = svg_element("text");
			t = text("No series available\r\n            ");
			attr(text_1, "x", "25%");
			attr(text_1, "y", "-30%");
			attr(text_1, "tabindex", "0");
			attr(text_1, "role", "note");
			attr(text_1, "class", "no_series_label");
			attr(text_1, "aria-label", "No series available");
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

// (172:10) {#if series.length !== 0}
function create_if_block_2$2(ctx) {
	let each_1_anchor;
	let each_value_1 = /*series*/ ctx[4];
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*idChart, series, theme, showInfoBox, showVerticalInterception, blurInfoBox, removeVerticalInterception, getPoints*/ 112913) {
				each_value_1 = /*series*/ ctx[4];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (176:16) {#each lines.points as point, p}
function create_each_block_2$1(ctx) {
	let circle;
	let circle_aria_label_value;
	let circle_stroke_value;
	let circle_fill_value;
	let circle_cx_value;
	let circle_cy_value;
	let text_1;
	let t0_value = /*point*/ ctx[31].x + "";
	let t0;
	let t1;
	let t2_value = /*point*/ ctx[31].y + "";
	let t2;
	let text_1_x_value;
	let text_1_y_value;
	let text_1_stroke_value;
	let mounted;
	let dispose;

	return {
		c() {
			circle = svg_element("circle");
			text_1 = svg_element("text");
			t0 = text(t0_value);
			t1 = text(",");
			t2 = text(t2_value);
			attr(circle, "tabindex", "0");
			attr(circle, "class", "point svelte-120u2pf");
			attr(circle, "role", "graphics-symbol");
			attr(circle, "aria-label", circle_aria_label_value = "" + (/*point*/ ctx[31].ariaLabel + ". This is point " + (/*p*/ ctx[33] + 1) + " of " + /*lines*/ ctx[29].points.length + " from " + /*lines*/ ctx[29].name + "."));

			attr(circle, "stroke", circle_stroke_value = /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
			: 'black');

			attr(circle, "fill", circle_fill_value = /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
			: 'black');

			attr(circle, "cx", circle_cx_value = /*point*/ ctx[31].x);
			attr(circle, "cy", circle_cy_value = /*point*/ ctx[31].y);
			attr(circle, "r", "3");
			attr(text_1, "class", "info blur_info svelte-120u2pf");
			attr(text_1, "filter", "url(#info_box)");
			attr(text_1, "x", text_1_x_value = /*point*/ ctx[31].x + 20);
			attr(text_1, "y", text_1_y_value = /*point*/ ctx[31].y * -1);

			attr(text_1, "stroke", text_1_stroke_value = /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
			: 'black');
		},
		m(target, anchor) {
			insert(target, circle, anchor);
			insert(target, text_1, anchor);
			append(text_1, t0);
			append(text_1, t1);
			append(text_1, t2);

			if (!mounted) {
				dispose = [
					listen(circle, "focus", /*focus_handler*/ ctx[19]),
					listen(circle, "blur", /*blur_handler*/ ctx[20])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series*/ 16 && circle_aria_label_value !== (circle_aria_label_value = "" + (/*point*/ ctx[31].ariaLabel + ". This is point " + (/*p*/ ctx[33] + 1) + " of " + /*lines*/ ctx[29].points.length + " from " + /*lines*/ ctx[29].name + "."))) {
				attr(circle, "aria-label", circle_aria_label_value);
			}

			if (dirty[0] & /*theme*/ 1 && circle_stroke_value !== (circle_stroke_value = /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
			: 'black')) {
				attr(circle, "stroke", circle_stroke_value);
			}

			if (dirty[0] & /*theme*/ 1 && circle_fill_value !== (circle_fill_value = /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
			: 'black')) {
				attr(circle, "fill", circle_fill_value);
			}

			if (dirty[0] & /*series*/ 16 && circle_cx_value !== (circle_cx_value = /*point*/ ctx[31].x)) {
				attr(circle, "cx", circle_cx_value);
			}

			if (dirty[0] & /*series*/ 16 && circle_cy_value !== (circle_cy_value = /*point*/ ctx[31].y)) {
				attr(circle, "cy", circle_cy_value);
			}

			if (dirty[0] & /*series*/ 16 && t0_value !== (t0_value = /*point*/ ctx[31].x + "")) set_data(t0, t0_value);
			if (dirty[0] & /*series*/ 16 && t2_value !== (t2_value = /*point*/ ctx[31].y + "")) set_data(t2, t2_value);

			if (dirty[0] & /*series*/ 16 && text_1_x_value !== (text_1_x_value = /*point*/ ctx[31].x + 20)) {
				attr(text_1, "x", text_1_x_value);
			}

			if (dirty[0] & /*series*/ 16 && text_1_y_value !== (text_1_y_value = /*point*/ ctx[31].y * -1)) {
				attr(text_1, "y", text_1_y_value);
			}

			if (dirty[0] & /*theme*/ 1 && text_1_stroke_value !== (text_1_stroke_value = /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
			: 'black')) {
				attr(text_1, "stroke", text_1_stroke_value);
			}
		},
		d(detaching) {
			if (detaching) detach(circle);
			if (detaching) detach(text_1);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (173:12) {#each series as lines, l}
function create_each_block_1$2(ctx) {
	let g;
	let polyline;
	let polyline_points_value;
	let polyline_stroke_value;
	let g_id_value;
	let each_value_2 = /*lines*/ ctx[29].points;
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

			attr(polyline, "points", polyline_points_value = /*getPoints*/ ctx[11](/*lines*/ ctx[29].points));
			attr(polyline, "fill", "none");

			attr(polyline, "stroke", polyline_stroke_value = /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
			: 'black');

			attr(polyline, "class", "svelte-120u2pf");
			attr(g, "id", g_id_value = "" + (/*idChart*/ ctx[8] + "_" + cleanIdName$1(/*lines*/ ctx[29].name)));
			attr(g, "class", "show_line svelte-120u2pf");
		},
		m(target, anchor) {
			insert(target, g, anchor);
			append(g, polyline);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(g, null);
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series*/ 16 && polyline_points_value !== (polyline_points_value = /*getPoints*/ ctx[11](/*lines*/ ctx[29].points))) {
				attr(polyline, "points", polyline_points_value);
			}

			if (dirty[0] & /*theme*/ 1 && polyline_stroke_value !== (polyline_stroke_value = /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
			: 'black')) {
				attr(polyline, "stroke", polyline_stroke_value);
			}

			if (dirty[0] & /*series, theme, showInfoBox, showVerticalInterception, blurInfoBox, removeVerticalInterception*/ 110609) {
				each_value_2 = /*lines*/ ctx[29].points;
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

			if (dirty[0] & /*idChart, series*/ 272 && g_id_value !== (g_id_value = "" + (/*idChart*/ ctx[8] + "_" + cleanIdName$1(/*lines*/ ctx[29].name)))) {
				attr(g, "id", g_id_value);
			}
		},
		d(detaching) {
			if (detaching) detach(g);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (211:6) {#if series.length !== 0}
function create_if_block_1$2(ctx) {
	let each_1_anchor;
	let each_value = /*series*/ ctx[4];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*idChart, series, toogleCaption, theme*/ 16657) {
				each_value = /*series*/ ctx[4];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (212:8) {#each series as line, l}
function create_each_block$2(ctx) {
	let button;
	let span;
	let t0;
	let t1_value = /*line*/ ctx[26].name + "";
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
			attr(span, "class", "dot svelte-120u2pf");

			set_style(span, "background-color", /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
			: '#ccc');

			attr(button, "tabindex", "0");
			attr(button, "id", button_id_value = "" + (/*idChart*/ ctx[8] + "_" + (cleanIdName$1(/*line*/ ctx[26].name) + '-caption')));
			attr(button, "aria-label", button_aria_label_value = /*line*/ ctx[26].name);
			attr(button, "class", "caption svelte-120u2pf");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, span);
			append(button, t0);
			append(button, t1);
			append(button, t2);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[23]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*theme*/ 1) {
				set_style(span, "background-color", /*theme*/ ctx[0]
				? /*theme*/ ctx[0].colors[/*l*/ ctx[28]]
				: '#ccc');
			}

			if (dirty[0] & /*series*/ 16 && t1_value !== (t1_value = /*line*/ ctx[26].name + "")) set_data(t1, t1_value);

			if (dirty[0] & /*idChart, series*/ 272 && button_id_value !== (button_id_value = "" + (/*idChart*/ ctx[8] + "_" + (cleanIdName$1(/*line*/ ctx[26].name) + '-caption')))) {
				attr(button, "id", button_id_value);
			}

			if (dirty[0] & /*series*/ 16 && button_aria_label_value !== (button_aria_label_value = /*line*/ ctx[26].name)) {
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

// (220:4) {#if chartInfo.source !== ''}
function create_if_block$2(ctx) {
	let div;
	let a;
	let t0;
	let t1_value = /*chartInfo*/ ctx[2].source + "";
	let t1;
	let a_aria_label_value;
	let a_href_value;

	return {
		c() {
			div = element("div");
			a = element("a");
			t0 = text("Source: ");
			t1 = text(t1_value);
			attr(a, "tabindex", "0");
			attr(a, "aria-label", a_aria_label_value = "Read more about the source of the diagram and visit the website " + /*chartInfo*/ ctx[2].source);
			attr(a, "href", a_href_value = /*chartInfo*/ ctx[2].source);
			attr(div, "class", "source svelte-120u2pf");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, a);
			append(a, t0);
			append(a, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*chartInfo*/ 4 && t1_value !== (t1_value = /*chartInfo*/ ctx[2].source + "")) set_data(t1, t1_value);

			if (dirty[0] & /*chartInfo*/ 4 && a_aria_label_value !== (a_aria_label_value = "Read more about the source of the diagram and visit the website " + /*chartInfo*/ ctx[2].source)) {
				attr(a, "aria-label", a_aria_label_value);
			}

			if (dirty[0] & /*chartInfo*/ 4 && a_href_value !== (a_href_value = /*chartInfo*/ ctx[2].source)) {
				attr(a, "href", a_href_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (96:0) <ThemeContext bind:theme={theme}>
function create_default_slot$2(ctx) {
	let div4;
	let div0;
	let t0;
	let div1;
	let t1_value = /*chartInfo*/ ctx[2].desc + "";
	let t1;
	let div1_aria_label_value;
	let t2;
	let div2;
	let svg;
	let title;
	let t3_value = /*chartInfo*/ ctx[2].title + "";
	let t3;
	let title_id_value;
	let desc;
	let t4_value = /*chartInfo*/ ctx[2].desc + "";
	let t4;
	let desc_id_value;
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
	let rect;
	let g1;
	let show_if_1 = !isSeriesEmpty$1(/*series*/ ctx[4]);
	let g1_transform_value;
	let g5;
	let g2;
	let text0;
	let t5_value = /*labels*/ ctx[1].x + "";
	let t5;
	let g2_transform_value;
	let g3;
	let text1;
	let t6_value = /*labels*/ ctx[1].y + "";
	let t6;
	let g3_transform_value;
	let g4;
	let text2;
	let t7_value = /*labels*/ ctx[1].y + "";
	let t7;
	let g4_transform_value;
	let g6;
	let line0;
	let line1;
	let line2;
	let g7;
	let show_if = !isSeriesEmpty$1(/*series*/ ctx[4]);
	let g7_transform_value;
	let g8;
	let g8_transform_value;
	let g9;
	let g9_transform_value;
	let g10;
	let g10_transform_value;
	let svg_width_value;
	let svg_height_value;
	let div2_resize_listener;
	let t8;
	let div3;
	let t9;
	let if_block0 = show_if_1 && create_if_block_5$1(ctx);
	let if_block1 = show_if && create_if_block_3$2(ctx);

	function select_block_type(ctx, dirty) {
		if (/*series*/ ctx[4].length !== 0) return create_if_block_2$2;
		return create_else_block$2;
	}

	let current_block_type = select_block_type(ctx);
	let if_block2 = current_block_type(ctx);
	let if_block3 = /*series*/ ctx[4].length !== 0 && create_if_block_1$2(ctx);
	let if_block4 = /*chartInfo*/ ctx[2].source !== '' && create_if_block$2(ctx);

	return {
		c() {
			div4 = element("div");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			t1 = text(t1_value);
			t2 = space();
			div2 = element("div");
			svg = svg_element("svg");
			title = svg_element("title");
			t3 = text(t3_value);
			desc = svg_element("desc");
			t4 = text(t4_value);
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
			rect = svg_element("rect");
			g1 = svg_element("g");
			if (if_block0) if_block0.c();
			g5 = svg_element("g");
			g2 = svg_element("g");
			text0 = svg_element("text");
			t5 = text(t5_value);
			g3 = svg_element("g");
			text1 = svg_element("text");
			t6 = text(t6_value);
			g4 = svg_element("g");
			text2 = svg_element("text");
			t7 = text(t7_value);
			g6 = svg_element("g");
			line0 = svg_element("line");
			line1 = svg_element("line");
			line2 = svg_element("line");
			g7 = svg_element("g");
			if (if_block1) if_block1.c();
			g8 = svg_element("g");
			g9 = svg_element("g");
			if_block2.c();
			g10 = svg_element("g");
			t8 = space();
			div3 = element("div");
			if (if_block3) if_block3.c();
			t9 = space();
			if (if_block4) if_block4.c();
			attr(div0, "class", "chart_title svelte-120u2pf");
			attr(div1, "tabindex", "0");
			attr(div1, "role", "note");
			attr(div1, "class", "chart_desc svelte-120u2pf");
			attr(div1, "aria-label", div1_aria_label_value = /*chartInfo*/ ctx[2].desc);
			attr(title, "id", title_id_value = "" + (/*idChart*/ ctx[8] + "_title_chart"));
			attr(desc, "id", desc_id_value = "" + (/*idChart*/ ctx[8] + "_desc_chart"));
			attr(path, "class", "grid_path svelte-120u2pf");
			attr(path, "d", "M 0 " + gridGap$1 + " L 0 0 " + gridGap$1 + " 0");
			attr(path, "fill", "none");
			attr(path, "stroke-width", "0.5");
			attr(pattern, "id", pattern_id_value = "" + (/*idChart*/ ctx[8] + "_grid_pattern"));
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
			attr(rect, "width", "90%");
			attr(rect, "class", "background-chart svelte-120u2pf");
			attr(g0, "role", "none");
			attr(g0, "aria-hidden", "true");
			attr(g1, "class", "grid svelte-120u2pf");
			attr(g1, "transform", g1_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.1 + "," + /*svgHeight*/ ctx[6] * 0.1 + ") ");
			attr(g1, "aria-hidden", "true");
			attr(text0, "class", "x_label svelte-120u2pf");
			attr(g2, "transform", g2_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.9 + "," + /*svgHeight*/ ctx[6] * 0.1 + ") scale(0.2 , 0.2)");
			attr(text1, "class", "y_label svelte-120u2pf");
			attr(text1, "x", "50%");
			attr(text1, "y", "15%");
			attr(g3, "transform", g3_transform_value = "translate(0," + /*svgHeight*/ ctx[6] * 0.8 + ") scale(0.2 , 0.2)");
			attr(text2, "class", "second_y_label svelte-120u2pf");
			attr(text2, "x", "50%");
			attr(text2, "y", "15%");
			attr(g4, "transform", g4_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.7 + "," + /*svgHeight*/ ctx[6] * 0.8 + ") scale(0.3 , 0.2)");
			attr(g5, "class", "labels");
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
			attr(g6, "class", "axis");
			attr(g6, "aria-hidden", "true");
			attr(g7, "class", "grid_label svelte-120u2pf");
			attr(g7, "transform", g7_transform_value = "translate(1, " + /*svgHeight*/ ctx[6] * 0.1 + ")");
			attr(g8, "id", "vertical_intercept");
			attr(g8, "transform", g8_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.1 + ",0)");
			attr(g9, "role", "graphics-object");
			attr(g9, "transform", g9_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.1 + "," + /*svgHeight*/ ctx[6] * 0.1 + ")");
			attr(g9, "class", "functions");
			attr(g10, "role", "graphics-object");
			attr(g10, "transform", g10_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.1 + "," + /*svgHeight*/ ctx[6] * 0.1 + ") scale(1, -1)");
			attr(g10, "id", "actually_focus");
			attr(svg, "class", "chart svelte-120u2pf");
			attr(svg, "role", "graphics-document");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "viewBox", "0 0 600 200");
			attr(svg, "width", svg_width_value = /*dimension*/ ctx[3].width);
			attr(svg, "height", svg_height_value = /*dimension*/ ctx[3].height);
			attr(div2, "class", "svg_wrap svelte-120u2pf");
			add_render_callback(() => /*div2_elementresize_handler*/ ctx[22].call(div2));
			attr(div3, "class", "captions svelte-120u2pf");
			set_style(div3, "padding", "0 " + /*svgWidth*/ ctx[5] * 0.1 + "px");
			attr(div4, "class", "wrapper svelte-120u2pf");
		},
		m(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div0);
			/*div0_binding*/ ctx[17](div0);
			append(div4, t0);
			append(div4, div1);
			append(div1, t1);
			append(div4, t2);
			append(div4, div2);
			append(div2, svg);
			append(svg, title);
			append(title, t3);
			append(svg, desc);
			append(desc, t4);
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
			append(g0, rect);
			append(svg, g1);
			if (if_block0) if_block0.m(g1, null);
			append(svg, g5);
			append(g5, g2);
			append(g2, text0);
			append(text0, t5);
			append(g5, g3);
			append(g3, text1);
			append(text1, t6);
			append(g5, g4);
			append(g4, text2);
			append(text2, t7);
			append(svg, g6);
			append(g6, line0);
			append(g6, line1);
			append(g6, line2);
			append(svg, g7);
			if (if_block1) if_block1.m(g7, null);
			append(svg, g8);
			/*g8_binding*/ ctx[18](g8);
			append(svg, g9);
			if_block2.m(g9, null);
			append(svg, g10);
			/*g10_binding*/ ctx[21](g10);
			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[22].bind(div2));
			append(div4, t8);
			append(div4, div3);
			if (if_block3) if_block3.m(div3, null);
			append(div4, t9);
			if (if_block4) if_block4.m(div4, null);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*chartInfo*/ 4 && t1_value !== (t1_value = /*chartInfo*/ ctx[2].desc + "")) set_data(t1, t1_value);

			if (dirty[0] & /*chartInfo*/ 4 && div1_aria_label_value !== (div1_aria_label_value = /*chartInfo*/ ctx[2].desc)) {
				attr(div1, "aria-label", div1_aria_label_value);
			}

			if (dirty[0] & /*chartInfo*/ 4 && t3_value !== (t3_value = /*chartInfo*/ ctx[2].title + "")) set_data(t3, t3_value);

			if (dirty[0] & /*idChart*/ 256 && title_id_value !== (title_id_value = "" + (/*idChart*/ ctx[8] + "_title_chart"))) {
				attr(title, "id", title_id_value);
			}

			if (dirty[0] & /*chartInfo*/ 4 && t4_value !== (t4_value = /*chartInfo*/ ctx[2].desc + "")) set_data(t4, t4_value);

			if (dirty[0] & /*idChart*/ 256 && desc_id_value !== (desc_id_value = "" + (/*idChart*/ ctx[8] + "_desc_chart"))) {
				attr(desc, "id", desc_id_value);
			}

			if (dirty[0] & /*idChart*/ 256 && pattern_id_value !== (pattern_id_value = "" + (/*idChart*/ ctx[8] + "_grid_pattern"))) {
				attr(pattern, "id", pattern_id_value);
			}

			if (dirty[0] & /*series*/ 16) show_if_1 = !isSeriesEmpty$1(/*series*/ ctx[4]);

			if (show_if_1) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_5$1(ctx);
					if_block0.c();
					if_block0.m(g1, null);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty[0] & /*svgWidth, svgHeight*/ 96 && g1_transform_value !== (g1_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.1 + "," + /*svgHeight*/ ctx[6] * 0.1 + ") ")) {
				attr(g1, "transform", g1_transform_value);
			}

			if (dirty[0] & /*labels*/ 2 && t5_value !== (t5_value = /*labels*/ ctx[1].x + "")) set_data(t5, t5_value);

			if (dirty[0] & /*svgWidth, svgHeight*/ 96 && g2_transform_value !== (g2_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.9 + "," + /*svgHeight*/ ctx[6] * 0.1 + ") scale(0.2 , 0.2)")) {
				attr(g2, "transform", g2_transform_value);
			}

			if (dirty[0] & /*labels*/ 2 && t6_value !== (t6_value = /*labels*/ ctx[1].y + "")) set_data(t6, t6_value);

			if (dirty[0] & /*svgHeight*/ 64 && g3_transform_value !== (g3_transform_value = "translate(0," + /*svgHeight*/ ctx[6] * 0.8 + ") scale(0.2 , 0.2)")) {
				attr(g3, "transform", g3_transform_value);
			}

			if (dirty[0] & /*labels*/ 2 && t7_value !== (t7_value = /*labels*/ ctx[1].y + "")) set_data(t7, t7_value);

			if (dirty[0] & /*svgWidth, svgHeight*/ 96 && g4_transform_value !== (g4_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.7 + "," + /*svgHeight*/ ctx[6] * 0.8 + ") scale(0.3 , 0.2)")) {
				attr(g4, "transform", g4_transform_value);
			}

			if (dirty[0] & /*series*/ 16) show_if = !isSeriesEmpty$1(/*series*/ ctx[4]);

			if (show_if) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_3$2(ctx);
					if_block1.c();
					if_block1.m(g7, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty[0] & /*svgHeight*/ 64 && g7_transform_value !== (g7_transform_value = "translate(1, " + /*svgHeight*/ ctx[6] * 0.1 + ")")) {
				attr(g7, "transform", g7_transform_value);
			}

			if (dirty[0] & /*svgWidth*/ 32 && g8_transform_value !== (g8_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.1 + ",0)")) {
				attr(g8, "transform", g8_transform_value);
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
				if_block2.p(ctx, dirty);
			} else {
				if_block2.d(1);
				if_block2 = current_block_type(ctx);

				if (if_block2) {
					if_block2.c();
					if_block2.m(g9, null);
				}
			}

			if (dirty[0] & /*svgWidth, svgHeight*/ 96 && g9_transform_value !== (g9_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.1 + "," + /*svgHeight*/ ctx[6] * 0.1 + ")")) {
				attr(g9, "transform", g9_transform_value);
			}

			if (dirty[0] & /*svgWidth, svgHeight*/ 96 && g10_transform_value !== (g10_transform_value = "translate(" + /*svgWidth*/ ctx[5] * 0.1 + "," + /*svgHeight*/ ctx[6] * 0.1 + ") scale(1, -1)")) {
				attr(g10, "transform", g10_transform_value);
			}

			if (dirty[0] & /*dimension*/ 8 && svg_width_value !== (svg_width_value = /*dimension*/ ctx[3].width)) {
				attr(svg, "width", svg_width_value);
			}

			if (dirty[0] & /*dimension*/ 8 && svg_height_value !== (svg_height_value = /*dimension*/ ctx[3].height)) {
				attr(svg, "height", svg_height_value);
			}

			if (/*series*/ ctx[4].length !== 0) {
				if (if_block3) {
					if_block3.p(ctx, dirty);
				} else {
					if_block3 = create_if_block_1$2(ctx);
					if_block3.c();
					if_block3.m(div3, null);
				}
			} else if (if_block3) {
				if_block3.d(1);
				if_block3 = null;
			}

			if (dirty[0] & /*svgWidth*/ 32) {
				set_style(div3, "padding", "0 " + /*svgWidth*/ ctx[5] * 0.1 + "px");
			}

			if (/*chartInfo*/ ctx[2].source !== '') {
				if (if_block4) {
					if_block4.p(ctx, dirty);
				} else {
					if_block4 = create_if_block$2(ctx);
					if_block4.c();
					if_block4.m(div4, null);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}
		},
		d(detaching) {
			if (detaching) detach(div4);
			/*div0_binding*/ ctx[17](null);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			/*g8_binding*/ ctx[18](null);
			if_block2.d();
			/*g10_binding*/ ctx[21](null);
			div2_resize_listener();
			if (if_block3) if_block3.d();
			if (if_block4) if_block4.d();
		}
	};
}

function create_fragment$3(ctx) {
	let themecontext;
	let updating_theme;
	let current;

	function themecontext_theme_binding(value) {
		/*themecontext_theme_binding*/ ctx[24](value);
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

			if (dirty[0] & /*chartInfo, svgWidth, series, idChart, theme, svgHeight, dimension, showedInfoBox, verticalInterceptionGroup, labels, headerChartParentTag*/ 2047 | dirty[1] & /*$$scope*/ 128) {
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

let gridGap$1 = 20;

function removeAllChildNodes(parent) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}

function cleanIdName$1(name) {
	return name.replace(/\s/g, "");
}

function isSeriesEmpty$1(series) {
	if (series.length !== 0) {
		return false;
	}

	return true;
}

function instance$3($$self, $$props, $$invalidate) {
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

	let { labels = defaultLabel } = $$props;

	let { chartInfo = {
		title: "Line chart title",
		desc: "This description is accessible and your screenreader will detect it.",
		source: ""
	} } = $$props;

	let { theme = defaultLineTheme } = $$props;
	let { dimension = { width: "600", height: "200" } } = $$props;
	let { series = [] } = $$props;
	let svgWidth = 0;
	let svgHeight = 0;
	let showedInfoBox;
	let idChart;
	let verticalInterceptionGroup;
	let headerChartParentTag;

	var getPoints = points => {
		let polyPoints = '';

		points.forEach(function (point) {
			polyPoints += point.x + "," + point.y + " ";
		});

		return polyPoints;
	};

	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
		$$invalidate(8, idChart = generateId());
		createHeaderTagForElement(headerChartParentTag, chartInfo.title);
	}));

	function showInfoBox(event) {
		var _a;
		let element = event.target;

		element = (_a = element.nextSibling) === null || _a === void 0
		? void 0
		: _a.cloneNode(true);

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

		let button = event.target;
		let targetId = button.id.replace(/\s/g, "").replace('-caption', '');
		let line = document.getElementById(targetId);

		line.classList.contains('show_line')
		? line.classList.replace('show_line', 'hide_line')
		: line.classList.replace('hide_line', 'show_line');

		button.classList.contains('inactive')
		? button.classList.remove('inactive')
		: button.classList.add('inactive');
	}

	function showVerticalInterception(event) {
		let circle = event.target;
		let bbox = circle.getBBox();
		let interception = document.createElementNS('http://www.w3.org/2000/svg', 'line');
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
		}
	}

	function div0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			headerChartParentTag = $$value;
			$$invalidate(10, headerChartParentTag);
		});
	}

	function g8_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			verticalInterceptionGroup = $$value;
			$$invalidate(9, verticalInterceptionGroup);
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

	function g10_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			showedInfoBox = $$value;
			$$invalidate(7, showedInfoBox);
		});
	}

	function div2_elementresize_handler() {
		svgWidth = this.clientWidth;
		svgHeight = this.clientHeight;
		$$invalidate(5, svgWidth);
		$$invalidate(6, svgHeight);
	}

	const click_handler = event => toogleCaption(event);

	function themecontext_theme_binding(value) {
		theme = value;
		$$invalidate(0, theme);
	}

	$$self.$$set = $$props => {
		if ('labels' in $$props) $$invalidate(1, labels = $$props.labels);
		if ('chartInfo' in $$props) $$invalidate(2, chartInfo = $$props.chartInfo);
		if ('theme' in $$props) $$invalidate(0, theme = $$props.theme);
		if ('dimension' in $$props) $$invalidate(3, dimension = $$props.dimension);
		if ('series' in $$props) $$invalidate(4, series = $$props.series);
	};

	return [
		theme,
		labels,
		chartInfo,
		dimension,
		series,
		svgWidth,
		svgHeight,
		showedInfoBox,
		idChart,
		verticalInterceptionGroup,
		headerChartParentTag,
		getPoints,
		showInfoBox,
		blurInfoBox,
		toogleCaption,
		showVerticalInterception,
		removeVerticalInterception,
		div0_binding,
		g8_binding,
		focus_handler,
		blur_handler,
		g10_binding,
		div2_elementresize_handler,
		click_handler,
		themecontext_theme_binding
	];
}

class LineChart extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$3,
			create_fragment$3,
			safe_not_equal,
			{
				labels: 1,
				chartInfo: 2,
				theme: 0,
				dimension: 3,
				series: 4
			},
			null,
			[-1, -1]
		);
	}
}

/* src\hatches\Hatch.svelte generated by Svelte v3.49.0 */

function create_fragment$2(ctx) {
	let pattern_1;
	let path;
	let path_d_value;
	let path_stroke_value;
	let path_stroke_width_value;

	return {
		c() {
			pattern_1 = svg_element("pattern");
			path = svg_element("path");
			attr(path, "d", path_d_value = /*getPatternByName*/ ctx[3](/*pattern*/ ctx[1]));
			attr(path, "class", /*pattern*/ ctx[1]);
			attr(path, "fill", "none");
			attr(path, "stroke", path_stroke_value = /*color*/ ctx[2] !== '' ? /*color*/ ctx[2] : 'black');
			attr(path, "stroke-width", path_stroke_width_value = /*pattern*/ ctx[1] === 'hLine' ? 12 : 2);
			attr(pattern_1, "id", /*idPattern*/ ctx[0]);
			attr(pattern_1, "patternUnits", "userSpaceOnUse");
			attr(pattern_1, "width", "8");
			attr(pattern_1, "height", "10");
		},
		m(target, anchor) {
			insert(target, pattern_1, anchor);
			append(pattern_1, path);
		},
		p(ctx, [dirty]) {
			if (dirty & /*pattern*/ 2 && path_d_value !== (path_d_value = /*getPatternByName*/ ctx[3](/*pattern*/ ctx[1]))) {
				attr(path, "d", path_d_value);
			}

			if (dirty & /*pattern*/ 2) {
				attr(path, "class", /*pattern*/ ctx[1]);
			}

			if (dirty & /*color*/ 4 && path_stroke_value !== (path_stroke_value = /*color*/ ctx[2] !== '' ? /*color*/ ctx[2] : 'black')) {
				attr(path, "stroke", path_stroke_value);
			}

			if (dirty & /*pattern*/ 2 && path_stroke_width_value !== (path_stroke_width_value = /*pattern*/ ctx[1] === 'hLine' ? 12 : 2)) {
				attr(path, "stroke-width", path_stroke_width_value);
			}

			if (dirty & /*idPattern*/ 1) {
				attr(pattern_1, "id", /*idPattern*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(pattern_1);
		}
	};
}

const square = "M 5 0 L 5 5 L 0 5 L 0 0 Z";
const circles = "M 6 6 m -5 0 a 1 1 90 1 0 5 0 a 1 1 90 1 0 -5 0";
const hLine = "M0,0 L8,0";
const diagonal = "M0,0 l8,10";

function instance$2($$self, $$props, $$invalidate) {
	let { idPattern = '' } = $$props;
	let { pattern = '' } = $$props;
	let { color = '' } = $$props;

	const HATCHES = [
		{ name: 'circles', pattern: circles },
		{ name: 'square', pattern: square },
		{ name: 'hLine', pattern: hLine },
		{ name: 'diagonal', pattern: diagonal }
	];

	function getPatternByName(name) {
		var _a;

		return (_a = HATCHES.find(element => name === element.name)) === null || _a === void 0
		? void 0
		: _a.pattern;
	}

	$$self.$$set = $$props => {
		if ('idPattern' in $$props) $$invalidate(0, idPattern = $$props.idPattern);
		if ('pattern' in $$props) $$invalidate(1, pattern = $$props.pattern);
		if ('color' in $$props) $$invalidate(2, color = $$props.color);
	};

	return [idPattern, pattern, color, getPatternByName];
}

class Hatch extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { idPattern: 0, pattern: 1, color: 2 });
	}
}

var css_248z$1 = ".no_series_label.svelte-16nl2z8.svelte-16nl2z8{transform:scale(1,-1);background-color:var(--wrapperStyles-backgroundColor)}.x_grid_text_label.svelte-16nl2z8.svelte-16nl2z8{transform:scale(1, -1);font-size:9px}.wrapper.svelte-16nl2z8.svelte-16nl2z8{background-color:var(--wrapperStyles-backgroundColor);display:inline-block}.chart.svelte-16nl2z8.svelte-16nl2z8{transform:scale(1,-1);width:100%;height:100%;overflow:visible}.grid_surface.svelte-16nl2z8.svelte-16nl2z8{width:75%}.grid.svelte-16nl2z8.svelte-16nl2z8{width:80%}.grid_path.svelte-16nl2z8.svelte-16nl2z8{stroke:darkgray}.x_label.svelte-16nl2z8.svelte-16nl2z8{transform:scale(5, -5)  !important;transform-origin:center center;transform-box:fill-box;font-size:14px;background-color:var(--wrapperStyles-backgroundColor)}.y_label.svelte-16nl2z8.svelte-16nl2z8{transform:scale(5, -5)  !important;transform-origin:center center;transform-box:fill-box;text-anchor:middle;font-size:14px;background-color:var(--wrapperStyles-backgroundColor)}.second_y_label.svelte-16nl2z8.svelte-16nl2z8{transform:scale(3, -5)  !important;transform-origin:center center;transform-box:fill-box;font-size:14px;text-anchor:middle;background-color:var(--wrapperStyles-backgroundColor)}.captions.svelte-16nl2z8.svelte-16nl2z8{margin:10px 0 0 0;display:flex;flex-direction:row;gap:5px}.caption.svelte-16nl2z8.svelte-16nl2z8{flex-wrap:nowrap;margin:5px;padding:0 10px;background-color:#fff;box-shadow:0px 0px 1px 1px lightgray;display:flex;flex-direction:row;align-items:center;gap:5px}.inactive > .dot{background-color:gray !important}.inactive{color:gray;opacity:0.7}.y_grid_label.svelte-16nl2z8>text.svelte-16nl2z8{transform:scale(1, -1);font-size:12px;background-color:var(--wrapperStyles-backgroundColor)}.second_y_grid_label.svelte-16nl2z8>text.svelte-16nl2z8{transform:scale(1, -1);font-size:12px;background-color:var(--wrapperStyles-backgroundColor)}.x_grid_text_label.svelte-16nl2z8.svelte-16nl2z8{font-size:11px;letter-spacing:0.2em;background-color:var(--wrapperStyles-backgroundColor)}.hide_bar{display:none !important}.show_bar{display:block !important;stroke-width:2px !important}.show_bar:focus{stroke:var(--focusColor) !important}.dot.svelte-16nl2z8.svelte-16nl2z8{height:10px;width:10px;border-radius:50%;display:inline-block;pointer-events:none}.source.svelte-16nl2z8.svelte-16nl2z8{font-size:9px;text-align:right;padding-right:10px;padding-bottom:2px}.chart_title.svelte-16nl2z8.svelte-16nl2z8{text-align:center}.chart_desc.svelte-16nl2z8.svelte-16nl2z8{text-align:center !important}";
styleInject(css_248z$1);

/* src\components\BarChart.svelte generated by Svelte v3.49.0 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[18] = list[i];
	child_ctx[20] = i;
	return child_ctx;
}

function get_each_context_1$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[21] = list[i];
	child_ctx[23] = i;
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[24] = list[i];
	child_ctx[26] = i;
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[27] = list[i];
	child_ctx[29] = i;
	return child_ctx;
}

function get_each_context_4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[27] = list[i];
	child_ctx[29] = i;
	return child_ctx;
}

function get_each_context_5(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[31] = list[i];
	child_ctx[33] = i;
	return child_ctx;
}

// (101:14) {#if !isSeriesEmpty(series) && hatchPatterns}
function create_if_block_6(ctx) {
	let each_1_anchor;
	let current;
	let each_value_5 = /*theme*/ ctx[0].hatches;
	let each_blocks = [];

	for (let i = 0; i < each_value_5.length; i += 1) {
		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*theme, series, idChart*/ 273) {
				each_value_5 = /*theme*/ ctx[0].hatches;
				let i;

				for (i = 0; i < each_value_5.length; i += 1) {
					const child_ctx = get_each_context_5(ctx, each_value_5, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block_5(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();

				for (i = each_value_5.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_5.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (102:16) {#each theme.hatches as hatch, hatchIndex}
function create_each_block_5(ctx) {
	let hatch;
	let current;

	hatch = new Hatch({
			props: {
				pattern: /*hatch*/ ctx[31],
				color: /*theme*/ ctx[0].colors[/*hatchIndex*/ ctx[33]],
				idPattern: /*series*/ ctx[4].series[/*hatchIndex*/ ctx[33]] === undefined
				? ''
				: /*idChart*/ ctx[8] + '_pattern_' + /*series*/ ctx[4].series[/*hatchIndex*/ ctx[33]].name
			}
		});

	return {
		c() {
			create_component(hatch.$$.fragment);
		},
		m(target, anchor) {
			mount_component(hatch, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const hatch_changes = {};
			if (dirty[0] & /*theme*/ 1) hatch_changes.pattern = /*hatch*/ ctx[31];
			if (dirty[0] & /*theme*/ 1) hatch_changes.color = /*theme*/ ctx[0].colors[/*hatchIndex*/ ctx[33]];

			if (dirty[0] & /*series, idChart*/ 272) hatch_changes.idPattern = /*series*/ ctx[4].series[/*hatchIndex*/ ctx[33]] === undefined
			? ''
			: /*idChart*/ ctx[8] + '_pattern_' + /*series*/ ctx[4].series[/*hatchIndex*/ ctx[33]].name;

			hatch.$set(hatch_changes);
		},
		i(local) {
			if (current) return;
			transition_in(hatch.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(hatch.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(hatch, detaching);
		}
	};
}

// (117:12) {#if !isSeriesEmpty(series)}
function create_if_block_5(ctx) {
	let g;
	let rect;
	let rect_height_value;
	let rect_fill_value;
	let g_transform_value;

	return {
		c() {
			g = svg_element("g");
			rect = svg_element("rect");
			attr(rect, "class", "grid_surface svelte-16nl2z8");
			attr(rect, "height", rect_height_value = /*svgHeight*/ ctx[7] * 0.7);
			attr(rect, "fill", rect_fill_value = "url(#" + /*idChart*/ ctx[8] + "_grid_pattern)");
			attr(rect, "transform", "scale(1, 1)");
			attr(g, "class", "grid svelte-16nl2z8");
			attr(g, "transform", g_transform_value = "translate(" + /*svgWidth*/ ctx[6] * 0.1 + "," + /*svgHeight*/ ctx[7] * 0.1 + ")");
		},
		m(target, anchor) {
			insert(target, g, anchor);
			append(g, rect);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*svgHeight*/ 128 && rect_height_value !== (rect_height_value = /*svgHeight*/ ctx[7] * 0.7)) {
				attr(rect, "height", rect_height_value);
			}

			if (dirty[0] & /*idChart*/ 256 && rect_fill_value !== (rect_fill_value = "url(#" + /*idChart*/ ctx[8] + "_grid_pattern)")) {
				attr(rect, "fill", rect_fill_value);
			}

			if (dirty[0] & /*svgWidth, svgHeight*/ 192 && g_transform_value !== (g_transform_value = "translate(" + /*svgWidth*/ ctx[6] * 0.1 + "," + /*svgHeight*/ ctx[7] * 0.1 + ")")) {
				attr(g, "transform", g_transform_value);
			}
		},
		d(detaching) {
			if (detaching) detach(g);
		}
	};
}

// (139:14) {#if !isSeriesEmpty(series)}
function create_if_block_4$1(ctx) {
	let each_1_anchor;
	let each_value_4 = Array(Math.floor(/*svgHeight*/ ctx[7] * 0.7 / gridGap));
	let each_blocks = [];

	for (let i = 0; i < each_value_4.length; i += 1) {
		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*svgHeight*/ 128) {
				each_value_4 = Array(Math.floor(/*svgHeight*/ ctx[7] * 0.7 / gridGap));
				let i;

				for (i = 0; i < each_value_4.length; i += 1) {
					const child_ctx = get_each_context_4(ctx, each_value_4, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_4(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_4.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (140:16) {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
function create_each_block_4(ctx) {
	let text_1;
	let t_value = gridGap * /*i*/ ctx[29] + "";
	let t;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "text-anchor", "end");
			attr(text_1, "alignment-baseline", "central");
			attr(text_1, "x", "5%");
			attr(text_1, "y", gridGap * /*i*/ ctx[29] * -1);
			attr(text_1, "class", "svelte-16nl2z8");
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

// (153:16) {#if i !== 0 && labels.secondY !== ''}
function create_if_block_3$1(ctx) {
	let text_1;
	let t_value = 10 * /*i*/ ctx[29] + "";
	let t;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "text-anchor", "end");
			attr(text_1, "alignment-baseline", "central");
			attr(text_1, "x", "90%");
			attr(text_1, "y", gridGap * /*i*/ ctx[29] * -1);
			attr(text_1, "class", "svelte-16nl2z8");
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

// (152:14) {#each Array(Math.floor((svgHeight*0.7)/gridGap)) as _, i}
function create_each_block_3(ctx) {
	let if_block_anchor;
	let if_block = /*i*/ ctx[29] !== 0 && /*labels*/ ctx[1].secondY !== '' && create_if_block_3$1(ctx);

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
			if (/*i*/ ctx[29] !== 0 && /*labels*/ ctx[1].secondY !== '') {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_3$1(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (191:14) {:else}
function create_else_block$1(ctx) {
	let text_1;
	let t;

	return {
		c() {
			text_1 = svg_element("text");
			t = text("No series available");
			attr(text_1, "x", "30%");
			attr(text_1, "y", "-30%");
			attr(text_1, "role", "note");
			attr(text_1, "tabindex", "0");
			attr(text_1, "class", "no_series_label svelte-16nl2z8");
			attr(text_1, "aria-label", "No series available");
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

// (165:14) {#if !isSeriesEmpty(series)}
function create_if_block_2$1(ctx) {
	let each_1_anchor;
	let each_value_1 = /*series*/ ctx[4].category;
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*barGroupSize, calculateBarSize, svgHeight, series, theme, hatchPatterns, idChart*/ 3505) {
				each_value_1 = /*series*/ ctx[4].category;
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (168:20) {#each series.series as bar, barIndex}
function create_each_block_2(ctx) {
	let rect;
	let rect_stroke_value;
	let rect_class_value;
	let rect_fill_value;
	let rect_aria_label_value;
	let rect_height_value;

	return {
		c() {
			rect = svg_element("rect");
			attr(rect, "stroke", rect_stroke_value = /*theme*/ ctx[0].colors[/*barIndex*/ ctx[26]]);
			set_style(rect, "stroke-width", "4");
			attr(rect, "role", "graphics-object");
			attr(rect, "class", rect_class_value = "" + (/*bar*/ ctx[24].name + "_bar show_bar" + " svelte-16nl2z8"));

			attr(rect, "fill", rect_fill_value = /*hatchPatterns*/ ctx[5]
			? 'url(#' + /*idChart*/ ctx[8] + '_pattern_' + /*bar*/ ctx[24].name + ')'
			: /*theme*/ ctx[0].colors[/*barIndex*/ ctx[26]]);

			attr(rect, "tabindex", "0");
			attr(rect, "aria-label", rect_aria_label_value = /*bar*/ ctx[24].barValues[/*c*/ ctx[23]].ariaLabel + ' ' + /*bar*/ ctx[24].barValues[/*c*/ ctx[23]].value);
			attr(rect, "x", /*c*/ ctx[23] * /*barGroupSize*/ ctx[10] + /*calculateBarSize*/ ctx[11]() * /*barIndex*/ ctx[26]);
			attr(rect, "width", /*calculateBarSize*/ ctx[11]());
			attr(rect, "height", rect_height_value = /*bar*/ ctx[24].barValues[/*c*/ ctx[23]].value);
		},
		m(target, anchor) {
			insert(target, rect, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*theme*/ 1 && rect_stroke_value !== (rect_stroke_value = /*theme*/ ctx[0].colors[/*barIndex*/ ctx[26]])) {
				attr(rect, "stroke", rect_stroke_value);
			}

			if (dirty[0] & /*series*/ 16 && rect_class_value !== (rect_class_value = "" + (/*bar*/ ctx[24].name + "_bar show_bar" + " svelte-16nl2z8"))) {
				attr(rect, "class", rect_class_value);
			}

			if (dirty[0] & /*hatchPatterns, idChart, series, theme*/ 305 && rect_fill_value !== (rect_fill_value = /*hatchPatterns*/ ctx[5]
			? 'url(#' + /*idChart*/ ctx[8] + '_pattern_' + /*bar*/ ctx[24].name + ')'
			: /*theme*/ ctx[0].colors[/*barIndex*/ ctx[26]])) {
				attr(rect, "fill", rect_fill_value);
			}

			if (dirty[0] & /*series*/ 16 && rect_aria_label_value !== (rect_aria_label_value = /*bar*/ ctx[24].barValues[/*c*/ ctx[23]].ariaLabel + ' ' + /*bar*/ ctx[24].barValues[/*c*/ ctx[23]].value)) {
				attr(rect, "aria-label", rect_aria_label_value);
			}

			if (dirty[0] & /*series*/ 16 && rect_height_value !== (rect_height_value = /*bar*/ ctx[24].barValues[/*c*/ ctx[23]].value)) {
				attr(rect, "height", rect_height_value);
			}
		},
		d(detaching) {
			if (detaching) detach(rect);
		}
	};
}

// (166:16) {#each series.category as category, c}
function create_each_block_1$1(ctx) {
	let g1;
	let g0;
	let text_1;
	let t_value = /*category*/ ctx[21] + "";
	let t;
	let g0_transform_value;
	let each_value_2 = /*series*/ ctx[4].series;
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	return {
		c() {
			g1 = svg_element("g");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			g0 = svg_element("g");
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "text-anchor", "start");
			attr(text_1, "class", "x_grid_text_label svelte-16nl2z8");
			attr(g0, "transform", g0_transform_value = "translate(" + (/*c*/ ctx[23] * /*barGroupSize*/ ctx[10] + /*calculateBarSize*/ ctx[11]() - /*barGroupSize*/ ctx[10] * 0.1) + "," + /*svgHeight*/ ctx[7] * 0.05 * -1 + ")");
			attr(g1, "transform", "translate(" + barGap * 2 * /*c*/ ctx[23] + ",0)");
		},
		m(target, anchor) {
			insert(target, g1, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(g1, null);
			}

			append(g1, g0);
			append(g0, text_1);
			append(text_1, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*theme, series, hatchPatterns, idChart, barGroupSize, calculateBarSize*/ 3377) {
				each_value_2 = /*series*/ ctx[4].series;
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(g1, g0);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_2.length;
			}

			if (dirty[0] & /*series*/ 16 && t_value !== (t_value = /*category*/ ctx[21] + "")) set_data(t, t_value);

			if (dirty[0] & /*svgHeight*/ 128 && g0_transform_value !== (g0_transform_value = "translate(" + (/*c*/ ctx[23] * /*barGroupSize*/ ctx[10] + /*calculateBarSize*/ ctx[11]() - /*barGroupSize*/ ctx[10] * 0.1) + "," + /*svgHeight*/ ctx[7] * 0.05 * -1 + ")")) {
				attr(g0, "transform", g0_transform_value);
			}
		},
		d(detaching) {
			if (detaching) detach(g1);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (206:10) {#if !isSeriesEmpty(series)}
function create_if_block_1$1(ctx) {
	let each_1_anchor;
	let each_value = /*series*/ ctx[4].series;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*series, idChart, theme*/ 273) {
				each_value = /*series*/ ctx[4].series;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (207:12) {#each series.series as barSeries, l}
function create_each_block$1(ctx) {
	let button;
	let span;
	let t0;
	let t1_value = /*barSeries*/ ctx[18].name + "";
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
			attr(span, "class", "dot svelte-16nl2z8");

			set_style(span, "background-color", /*theme*/ ctx[0]
			? /*theme*/ ctx[0].colors[/*l*/ ctx[20]]
			: '#ccc');

			attr(button, "tabindex", "0");
			button.value = button_value_value = /*barSeries*/ ctx[18].name;
			attr(button, "id", button_id_value = "" + (/*idChart*/ ctx[8] + "_" + cleanIdName(/*barSeries*/ ctx[18].name)));
			attr(button, "aria-label", button_aria_label_value = /*barSeries*/ ctx[18].name);
			attr(button, "class", "caption svelte-16nl2z8");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, span);
			append(button, t0);
			append(button, t1);
			append(button, t2);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[14]);
				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*theme*/ 1) {
				set_style(span, "background-color", /*theme*/ ctx[0]
				? /*theme*/ ctx[0].colors[/*l*/ ctx[20]]
				: '#ccc');
			}

			if (dirty[0] & /*series*/ 16 && t1_value !== (t1_value = /*barSeries*/ ctx[18].name + "")) set_data(t1, t1_value);

			if (dirty[0] & /*series*/ 16 && button_value_value !== (button_value_value = /*barSeries*/ ctx[18].name)) {
				button.value = button_value_value;
			}

			if (dirty[0] & /*idChart, series*/ 272 && button_id_value !== (button_id_value = "" + (/*idChart*/ ctx[8] + "_" + cleanIdName(/*barSeries*/ ctx[18].name)))) {
				attr(button, "id", button_id_value);
			}

			if (dirty[0] & /*series*/ 16 && button_aria_label_value !== (button_aria_label_value = /*barSeries*/ ctx[18].name)) {
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

// (223:8) {#if chartInfo.source !== ''}
function create_if_block$1(ctx) {
	let div;
	let a;
	let t0;
	let t1_value = /*chartInfo*/ ctx[2].source + "";
	let t1;
	let a_aria_label_value;
	let a_href_value;

	return {
		c() {
			div = element("div");
			a = element("a");
			t0 = text("Source: ");
			t1 = text(t1_value);
			attr(a, "tabindex", "0");
			attr(a, "aria-label", a_aria_label_value = "Read more about the source of the diagram and visit the website " + /*chartInfo*/ ctx[2].source);
			attr(a, "href", a_href_value = /*chartInfo*/ ctx[2].source);
			attr(div, "class", "source svelte-16nl2z8");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, a);
			append(a, t0);
			append(a, t1);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*chartInfo*/ 4 && t1_value !== (t1_value = /*chartInfo*/ ctx[2].source + "")) set_data(t1, t1_value);

			if (dirty[0] & /*chartInfo*/ 4 && a_aria_label_value !== (a_aria_label_value = "Read more about the source of the diagram and visit the website " + /*chartInfo*/ ctx[2].source)) {
				attr(a, "aria-label", a_aria_label_value);
			}

			if (dirty[0] & /*chartInfo*/ 4 && a_href_value !== (a_href_value = /*chartInfo*/ ctx[2].source)) {
				attr(a, "href", a_href_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (79:0) <ThemeContext bind:theme={theme}>
function create_default_slot$1(ctx) {
	let div4;
	let div0;
	let t0;
	let div1;
	let t1_value = /*chartInfo*/ ctx[2].desc + "";
	let t1;
	let div1_aria_label_value;
	let t2;
	let div2;
	let svg;
	let title;
	let t3_value = /*chartInfo*/ ctx[2].title + "";
	let t3;
	let title_id_value;
	let desc;
	let t4_value = /*chartInfo*/ ctx[2].desc + "";
	let t4;
	let desc_id_value;
	let defs0;
	let pattern;
	let path;
	let pattern_id_value;
	let defs1;
	let show_if_4 = !isSeriesEmpty(/*series*/ ctx[4]) && /*hatchPatterns*/ ctx[5];
	let g0;
	let rect;
	let show_if_3 = !isSeriesEmpty(/*series*/ ctx[4]);
	let g1;
	let line0;
	let line1;
	let line2;
	let g5;
	let g2;
	let text0;
	let t5_value = /*labels*/ ctx[1].x + "";
	let t5;
	let g2_transform_value;
	let g3;
	let text1;
	let t6_value = /*labels*/ ctx[1].y + "";
	let t6;
	let g3_transform_value;
	let g4;
	let text2;
	let t7_value = /*labels*/ ctx[1].secondY + "";
	let t7;
	let g4_transform_value;
	let g6;
	let show_if_2 = !isSeriesEmpty(/*series*/ ctx[4]);
	let g6_transform_value;
	let g7;
	let g7_transform_value;
	let g8;
	let show_if_1;
	let g8_transform_value;
	let svg_width_value;
	let svg_height_value;
	let div2_resize_listener;
	let t8;
	let div3;
	let show_if = !isSeriesEmpty(/*series*/ ctx[4]);
	let t9;
	let current;
	let if_block0 = show_if_4 && create_if_block_6(ctx);
	let if_block1 = show_if_3 && create_if_block_5(ctx);
	let if_block2 = show_if_2 && create_if_block_4$1(ctx);
	let each_value_3 = Array(Math.floor(/*svgHeight*/ ctx[7] * 0.7 / gridGap));
	let each_blocks = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	function select_block_type(ctx, dirty) {
		if (dirty[0] & /*series*/ 16) show_if_1 = null;
		if (show_if_1 == null) show_if_1 = !!!isSeriesEmpty(/*series*/ ctx[4]);
		if (show_if_1) return create_if_block_2$1;
		return create_else_block$1;
	}

	let current_block_type = select_block_type(ctx, [-1, -1]);
	let if_block3 = current_block_type(ctx);
	let if_block4 = show_if && create_if_block_1$1(ctx);
	let if_block5 = /*chartInfo*/ ctx[2].source !== '' && create_if_block$1(ctx);

	return {
		c() {
			div4 = element("div");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			t1 = text(t1_value);
			t2 = space();
			div2 = element("div");
			svg = svg_element("svg");
			title = svg_element("title");
			t3 = text(t3_value);
			desc = svg_element("desc");
			t4 = text(t4_value);
			defs0 = svg_element("defs");
			pattern = svg_element("pattern");
			path = svg_element("path");
			defs1 = svg_element("defs");
			if (if_block0) if_block0.c();
			g0 = svg_element("g");
			rect = svg_element("rect");
			if (if_block1) if_block1.c();
			g1 = svg_element("g");
			line0 = svg_element("line");
			line1 = svg_element("line");
			line2 = svg_element("line");
			g5 = svg_element("g");
			g2 = svg_element("g");
			text0 = svg_element("text");
			t5 = text(t5_value);
			g3 = svg_element("g");
			text1 = svg_element("text");
			t6 = text(t6_value);
			g4 = svg_element("g");
			text2 = svg_element("text");
			t7 = text(t7_value);
			g6 = svg_element("g");
			if (if_block2) if_block2.c();
			g7 = svg_element("g");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			g8 = svg_element("g");
			if_block3.c();
			t8 = space();
			div3 = element("div");
			if (if_block4) if_block4.c();
			t9 = space();
			if (if_block5) if_block5.c();
			attr(div0, "class", "chart_title svelte-16nl2z8");
			attr(div1, "tabindex", "0");
			attr(div1, "class", "chart_desc svelte-16nl2z8");
			attr(div1, "role", "note");
			attr(div1, "aria-label", div1_aria_label_value = /*chartInfo*/ ctx[2].desc);
			attr(title, "id", title_id_value = "" + (/*idChart*/ ctx[8] + "_title_chart"));
			attr(desc, "id", desc_id_value = "" + (/*idChart*/ ctx[8] + "_desc_chart"));
			attr(path, "class", "grid_path svelte-16nl2z8");
			attr(path, "d", "M 0 " + gridGap + " H 0 " + gridGap);
			attr(path, "fill", "none");
			attr(path, "stroke-width", "0.5");
			attr(pattern, "id", pattern_id_value = "" + (/*idChart*/ ctx[8] + "_grid_pattern"));
			attr(pattern, "width", gridGap);
			attr(pattern, "height", gridGap);
			attr(pattern, "patternUnits", "userSpaceOnUse");
			attr(rect, "width", "90%");
			attr(rect, "class", "background-chart");
			attr(g0, "role", "none");
			attr(g0, "aria-hidden", "true");
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
			attr(g1, "class", "axis");
			attr(g1, "aria-hidden", "true");
			attr(text0, "class", "x_label svelte-16nl2z8");
			attr(g2, "transform", g2_transform_value = "translate(" + /*svgWidth*/ ctx[6] * 0.9 + "," + /*svgHeight*/ ctx[7] * 0.1 + ") scale(0.2 , 0.2)");
			attr(text1, "class", "y_label svelte-16nl2z8");
			attr(text1, "x", "50%");
			attr(text1, "y", "15%");
			attr(g3, "transform", g3_transform_value = "translate(0," + /*svgHeight*/ ctx[7] * 0.8 + ") scale(0.2 , 0.2)");
			attr(text2, "class", "second_y_label svelte-16nl2z8");
			attr(text2, "x", "50%");
			attr(text2, "y", "15%");
			attr(g4, "transform", g4_transform_value = "translate(" + /*svgWidth*/ ctx[6] * 0.7 + "," + /*svgHeight*/ ctx[7] * 0.8 + ") scale(0.3 , 0.2)");
			attr(g5, "class", "labels");
			attr(g6, "class", "y_grid_label svelte-16nl2z8");
			attr(g6, "transform", g6_transform_value = "translate(1, " + /*svgHeight*/ ctx[7] * 0.1 + ")");
			attr(g7, "class", "second_y_grid_label svelte-16nl2z8");
			attr(g7, "transform", g7_transform_value = "translate(1, " + /*svgHeight*/ ctx[7] * 0.1 + ")");
			attr(g8, "role", "graphics-object");
			attr(g8, "transform", g8_transform_value = "translate(" + /*svgWidth*/ ctx[6] * 0.1 + "," + /*svgHeight*/ ctx[7] * 0.1 + ")");
			attr(g8, "class", "functions");
			attr(svg, "class", "chart svelte-16nl2z8");
			attr(svg, "role", "graphics-document");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "width", svg_width_value = /*dimension*/ ctx[3].width);
			attr(svg, "height", svg_height_value = /*dimension*/ ctx[3].height);
			attr(div2, "class", "svg_wrap");
			add_render_callback(() => /*div2_elementresize_handler*/ ctx[13].call(div2));
			attr(div3, "class", "captions svelte-16nl2z8");
			set_style(div3, "padding", "0 " + /*svgWidth*/ ctx[6] * 0.1 + "px");
			attr(div4, "class", "wrapper svelte-16nl2z8");
		},
		m(target, anchor) {
			insert(target, div4, anchor);
			append(div4, div0);
			/*div0_binding*/ ctx[12](div0);
			append(div4, t0);
			append(div4, div1);
			append(div1, t1);
			append(div4, t2);
			append(div4, div2);
			append(div2, svg);
			append(svg, title);
			append(title, t3);
			append(svg, desc);
			append(desc, t4);
			append(svg, defs0);
			append(defs0, pattern);
			append(pattern, path);
			append(svg, defs1);
			if (if_block0) if_block0.m(defs1, null);
			append(svg, g0);
			append(g0, rect);
			if (if_block1) if_block1.m(svg, null);
			append(svg, g1);
			append(g1, line0);
			append(g1, line1);
			append(g1, line2);
			append(svg, g5);
			append(g5, g2);
			append(g2, text0);
			append(text0, t5);
			append(g5, g3);
			append(g3, text1);
			append(text1, t6);
			append(g5, g4);
			append(g4, text2);
			append(text2, t7);
			append(svg, g6);
			if (if_block2) if_block2.m(g6, null);
			append(svg, g7);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(g7, null);
			}

			append(svg, g8);
			if_block3.m(g8, null);
			div2_resize_listener = add_resize_listener(div2, /*div2_elementresize_handler*/ ctx[13].bind(div2));
			append(div4, t8);
			append(div4, div3);
			if (if_block4) if_block4.m(div3, null);
			append(div4, t9);
			if (if_block5) if_block5.m(div4, null);
			current = true;
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*chartInfo*/ 4) && t1_value !== (t1_value = /*chartInfo*/ ctx[2].desc + "")) set_data(t1, t1_value);

			if (!current || dirty[0] & /*chartInfo*/ 4 && div1_aria_label_value !== (div1_aria_label_value = /*chartInfo*/ ctx[2].desc)) {
				attr(div1, "aria-label", div1_aria_label_value);
			}

			if ((!current || dirty[0] & /*chartInfo*/ 4) && t3_value !== (t3_value = /*chartInfo*/ ctx[2].title + "")) set_data(t3, t3_value);

			if (!current || dirty[0] & /*idChart*/ 256 && title_id_value !== (title_id_value = "" + (/*idChart*/ ctx[8] + "_title_chart"))) {
				attr(title, "id", title_id_value);
			}

			if ((!current || dirty[0] & /*chartInfo*/ 4) && t4_value !== (t4_value = /*chartInfo*/ ctx[2].desc + "")) set_data(t4, t4_value);

			if (!current || dirty[0] & /*idChart*/ 256 && desc_id_value !== (desc_id_value = "" + (/*idChart*/ ctx[8] + "_desc_chart"))) {
				attr(desc, "id", desc_id_value);
			}

			if (!current || dirty[0] & /*idChart*/ 256 && pattern_id_value !== (pattern_id_value = "" + (/*idChart*/ ctx[8] + "_grid_pattern"))) {
				attr(pattern, "id", pattern_id_value);
			}

			if (dirty[0] & /*series, hatchPatterns*/ 48) show_if_4 = !isSeriesEmpty(/*series*/ ctx[4]) && /*hatchPatterns*/ ctx[5];

			if (show_if_4) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty[0] & /*series, hatchPatterns*/ 48) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_6(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(defs1, null);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (dirty[0] & /*series*/ 16) show_if_3 = !isSeriesEmpty(/*series*/ ctx[4]);

			if (show_if_3) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_5(ctx);
					if_block1.c();
					if_block1.m(svg, g1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if ((!current || dirty[0] & /*labels*/ 2) && t5_value !== (t5_value = /*labels*/ ctx[1].x + "")) set_data(t5, t5_value);

			if (!current || dirty[0] & /*svgWidth, svgHeight*/ 192 && g2_transform_value !== (g2_transform_value = "translate(" + /*svgWidth*/ ctx[6] * 0.9 + "," + /*svgHeight*/ ctx[7] * 0.1 + ") scale(0.2 , 0.2)")) {
				attr(g2, "transform", g2_transform_value);
			}

			if ((!current || dirty[0] & /*labels*/ 2) && t6_value !== (t6_value = /*labels*/ ctx[1].y + "")) set_data(t6, t6_value);

			if (!current || dirty[0] & /*svgHeight*/ 128 && g3_transform_value !== (g3_transform_value = "translate(0," + /*svgHeight*/ ctx[7] * 0.8 + ") scale(0.2 , 0.2)")) {
				attr(g3, "transform", g3_transform_value);
			}

			if ((!current || dirty[0] & /*labels*/ 2) && t7_value !== (t7_value = /*labels*/ ctx[1].secondY + "")) set_data(t7, t7_value);

			if (!current || dirty[0] & /*svgWidth, svgHeight*/ 192 && g4_transform_value !== (g4_transform_value = "translate(" + /*svgWidth*/ ctx[6] * 0.7 + "," + /*svgHeight*/ ctx[7] * 0.8 + ") scale(0.3 , 0.2)")) {
				attr(g4, "transform", g4_transform_value);
			}

			if (dirty[0] & /*series*/ 16) show_if_2 = !isSeriesEmpty(/*series*/ ctx[4]);

			if (show_if_2) {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block_4$1(ctx);
					if_block2.c();
					if_block2.m(g6, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (!current || dirty[0] & /*svgHeight*/ 128 && g6_transform_value !== (g6_transform_value = "translate(1, " + /*svgHeight*/ ctx[7] * 0.1 + ")")) {
				attr(g6, "transform", g6_transform_value);
			}

			if (dirty[0] & /*labels, svgHeight*/ 130) {
				each_value_3 = Array(Math.floor(/*svgHeight*/ ctx[7] * 0.7 / gridGap));
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(g7, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_3.length;
			}

			if (!current || dirty[0] & /*svgHeight*/ 128 && g7_transform_value !== (g7_transform_value = "translate(1, " + /*svgHeight*/ ctx[7] * 0.1 + ")")) {
				attr(g7, "transform", g7_transform_value);
			}

			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block3) {
				if_block3.p(ctx, dirty);
			} else {
				if_block3.d(1);
				if_block3 = current_block_type(ctx);

				if (if_block3) {
					if_block3.c();
					if_block3.m(g8, null);
				}
			}

			if (!current || dirty[0] & /*svgWidth, svgHeight*/ 192 && g8_transform_value !== (g8_transform_value = "translate(" + /*svgWidth*/ ctx[6] * 0.1 + "," + /*svgHeight*/ ctx[7] * 0.1 + ")")) {
				attr(g8, "transform", g8_transform_value);
			}

			if (!current || dirty[0] & /*dimension*/ 8 && svg_width_value !== (svg_width_value = /*dimension*/ ctx[3].width)) {
				attr(svg, "width", svg_width_value);
			}

			if (!current || dirty[0] & /*dimension*/ 8 && svg_height_value !== (svg_height_value = /*dimension*/ ctx[3].height)) {
				attr(svg, "height", svg_height_value);
			}

			if (dirty[0] & /*series*/ 16) show_if = !isSeriesEmpty(/*series*/ ctx[4]);

			if (show_if) {
				if (if_block4) {
					if_block4.p(ctx, dirty);
				} else {
					if_block4 = create_if_block_1$1(ctx);
					if_block4.c();
					if_block4.m(div3, null);
				}
			} else if (if_block4) {
				if_block4.d(1);
				if_block4 = null;
			}

			if (!current || dirty[0] & /*svgWidth*/ 64) {
				set_style(div3, "padding", "0 " + /*svgWidth*/ ctx[6] * 0.1 + "px");
			}

			if (/*chartInfo*/ ctx[2].source !== '') {
				if (if_block5) {
					if_block5.p(ctx, dirty);
				} else {
					if_block5 = create_if_block$1(ctx);
					if_block5.c();
					if_block5.m(div4, null);
				}
			} else if (if_block5) {
				if_block5.d(1);
				if_block5 = null;
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div4);
			/*div0_binding*/ ctx[12](null);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			destroy_each(each_blocks, detaching);
			if_block3.d();
			div2_resize_listener();
			if (if_block4) if_block4.d();
			if (if_block5) if_block5.d();
		}
	};
}

function create_fragment$1(ctx) {
	let themecontext;
	let updating_theme;
	let current;

	function themecontext_theme_binding(value) {
		/*themecontext_theme_binding*/ ctx[15](value);
	}

	let themecontext_props = {
		$$slots: { default: [create_default_slot$1] },
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

			if (dirty[0] & /*chartInfo, svgWidth, series, idChart, theme, svgHeight, dimension, hatchPatterns, labels, headerChartParentTag*/ 1023 | dirty[1] & /*$$scope*/ 8) {
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

let gridGap = 20;
let barGap = 6;

function cleanIdName(name) {
	return name.replace(/\s/g, "");
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

function isSeriesEmpty(series) {
	if (series.series === undefined) {
		return true;
	}

	return false;
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

	let { labels = defaultLabel } = $$props;

	let { chartInfo = {
		title: "Bar chart title",
		desc: "This description is accessible and your screenreader will detect it.",
		source: ""
	} } = $$props;

	let { theme = defaultBarTheme } = $$props;
	let { dimension = { width: "800", height: "300" } } = $$props;
	let { series = {} } = $$props;
	let { hatchPatterns = false } = $$props;
	let svgWidth = 0;
	let svgHeight = 0;
	let idChart;
	let headerChartParentTag;
	let barGroupSize = calculateBarGroupSize();

	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
		$$invalidate(8, idChart = generateId());
		createHeaderTagForElement(headerChartParentTag, chartInfo.title);
	}));

	function calculateBarGroupSize() {
		if (!isSeriesEmpty(series)) {
			return parseInt(dimension.width) * 0.75 / series.category.length - barGap * 2;
		}

		return 0;
	}

	function calculateBarSize() {
		if (!isSeriesEmpty(series)) {
			return barGroupSize / series.series.length;
		}

		return 0;
	}

	function div0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			headerChartParentTag = $$value;
			$$invalidate(9, headerChartParentTag);
		});
	}

	function div2_elementresize_handler() {
		svgWidth = this.clientWidth;
		svgHeight = this.clientHeight;
		$$invalidate(6, svgWidth);
		$$invalidate(7, svgHeight);
	}

	const click_handler = event => toggleBars(event);

	function themecontext_theme_binding(value) {
		theme = value;
		$$invalidate(0, theme);
	}

	$$self.$$set = $$props => {
		if ('labels' in $$props) $$invalidate(1, labels = $$props.labels);
		if ('chartInfo' in $$props) $$invalidate(2, chartInfo = $$props.chartInfo);
		if ('theme' in $$props) $$invalidate(0, theme = $$props.theme);
		if ('dimension' in $$props) $$invalidate(3, dimension = $$props.dimension);
		if ('series' in $$props) $$invalidate(4, series = $$props.series);
		if ('hatchPatterns' in $$props) $$invalidate(5, hatchPatterns = $$props.hatchPatterns);
	};

	return [
		theme,
		labels,
		chartInfo,
		dimension,
		series,
		hatchPatterns,
		svgWidth,
		svgHeight,
		idChart,
		headerChartParentTag,
		barGroupSize,
		calculateBarSize,
		div0_binding,
		div2_elementresize_handler,
		click_handler,
		themecontext_theme_binding
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
				labels: 1,
				chartInfo: 2,
				theme: 0,
				dimension: 3,
				series: 4,
				hatchPatterns: 5
			},
			null,
			[-1, -1]
		);
	}
}

function calculateXPositionOnCircleByPercent(decimalPointPercent) {
    return Math.cos(2 * Math.PI * decimalPointPercent);
}
function calculateYPositionOnCircleByPercent(decimalPointPercent) {
    return Math.sin(2 * Math.PI * decimalPointPercent);
}
function calculateLargeArcFlagByPercent(decimalPointPercent) {
    return decimalPointPercent > 0.5 ? 1 : 0;
}

var css_248z = ".marked_legend{text-decoration:underline var(--focusColor) 3px;z-index:1000}.wrapper.svelte-smlgkn{background-color:var(--wrapperStyles-backgroundColor);display:inline-block}.no_series_text.svelte-smlgkn{font-size:3em;margin:auto;text-align:center;margin-top:40px;background-color:var(--wrapperStyles-backgroundColor)}.pie_chart_text.svelte-smlgkn{font-size:3em;background-color:var(--wrapperStyles-backgroundColor)}.slice.svelte-smlgkn{outline:none}.display_front.svelte-smlgkn{rotate:-90deg}.show_slice_border{stroke:var(--focusColor);outline:none;stroke-width:20px;stroke-linecap:square;fill:none !important;border:none !important;color:none}.source.svelte-smlgkn{font-size:9px;text-align:right;padding-right:10px;padding-bottom:2px}.chart_title.svelte-smlgkn{text-align:center !important}.chart_desc.svelte-smlgkn{text-align:center}";
styleInject(css_248z);

/* src\components\PieChart.svelte generated by Svelte v3.49.0 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[17] = list[i];
	child_ctx[19] = i;
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[17] = list[i];
	child_ctx[19] = i;
	return child_ctx;
}

// (143:18) {:else}
function create_else_block(ctx) {
	let text_1;
	let t;

	return {
		c() {
			text_1 = svg_element("text");
			t = text("No series available");
			attr(text_1, "text-anchor", "middle");
			attr(text_1, "class", "no_series_text svelte-smlgkn");
			attr(text_1, "x", "0");
			attr(text_1, "y", "0");
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

// (99:18) {#if series.slices !== undefined}
function create_if_block_3(ctx) {
	let each_1_anchor;
	let each_value_1 = /*series*/ ctx[3].slices;
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*cumulativePercents, series, calculateXPositionOnCircleByPercent, dimension, calculateYPositionOnCircleByPercent, idChart, colors, calculateLargeArcFlagByPercent, removeAllChildNodes, unmaskLegend, moveSliceForward, markLowLegend*/ 1852) {
				each_value_1 = /*series*/ ctx[3].slices;
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_1.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (121:22) {#if slice.percent > 0.05}
function create_if_block_4(ctx) {
	let text_1;
	let t_value = /*slice*/ ctx[17].name + " " + /*slice*/ ctx[17].percent * 100 + "%" + "";
	let t;
	let text_1_dominant_baseline_value;
	let text_1_text_anchor_value;
	let text_1_x_value;
	let text_1_y_value;

	return {
		c() {
			text_1 = svg_element("text");
			t = text(t_value);
			attr(text_1, "class", "pie_chart_text svelte-smlgkn");

			attr(text_1, "dominant-baseline", text_1_dominant_baseline_value = /*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 > 0.25 && /*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 < 0.75
			? 'hanging'
			: 'auto');

			attr(text_1, "text-anchor", text_1_text_anchor_value = /*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 > 0.5 && /*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 < 1
			? 'end'
			: 'start');

			attr(text_1, "x", text_1_x_value = calculateXPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 + 0.75) * (/*dimension*/ ctx[2].resolution / 2) * 1.1);
			attr(text_1, "y", text_1_y_value = calculateYPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 + 0.75) * (/*dimension*/ ctx[2].resolution / 2) * 1.1);
		},
		m(target, anchor) {
			insert(target, text_1, anchor);
			append(text_1, t);
		},
		p(ctx, dirty) {
			if (dirty & /*series*/ 8 && t_value !== (t_value = /*slice*/ ctx[17].name + " " + /*slice*/ ctx[17].percent * 100 + "%" + "")) set_data(t, t_value);

			if (dirty & /*series*/ 8 && text_1_dominant_baseline_value !== (text_1_dominant_baseline_value = /*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 > 0.25 && /*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 < 0.75
			? 'hanging'
			: 'auto')) {
				attr(text_1, "dominant-baseline", text_1_dominant_baseline_value);
			}

			if (dirty & /*series*/ 8 && text_1_text_anchor_value !== (text_1_text_anchor_value = /*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 > 0.5 && /*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 < 1
			? 'end'
			: 'start')) {
				attr(text_1, "text-anchor", text_1_text_anchor_value);
			}

			if (dirty & /*series, dimension*/ 12 && text_1_x_value !== (text_1_x_value = calculateXPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 + 0.75) * (/*dimension*/ ctx[2].resolution / 2) * 1.1)) {
				attr(text_1, "x", text_1_x_value);
			}

			if (dirty & /*series, dimension*/ 12 && text_1_y_value !== (text_1_y_value = calculateYPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19] + 1] - /*slice*/ ctx[17].percent / 2 + 0.75) * (/*dimension*/ ctx[2].resolution / 2) * 1.1)) {
				attr(text_1, "y", text_1_y_value);
			}
		},
		d(detaching) {
			if (detaching) detach(text_1);
		}
	};
}

// (100:20) {#each series.slices as slice, index }
function create_each_block_1(ctx) {
	let path;
	let path_id_value;
	let path_aria_label_value;
	let path_fill_value;
	let path_d_value;
	let if_block_anchor;
	let mounted;
	let dispose;
	let if_block = /*slice*/ ctx[17].percent > 0.05 && create_if_block_4(ctx);

	return {
		c() {
			path = svg_element("path");
			if (if_block) if_block.c();
			if_block_anchor = empty();
			attr(path, "id", path_id_value = "" + (/*idChart*/ ctx[5] + "_" + /*slice*/ ctx[17].name + "_slice"));
			attr(path, "class", "slice svelte-smlgkn");
			attr(path, "transform", "rotate(-90)");
			attr(path, "role", "graphics-symbol");
			attr(path, "aria-label", path_aria_label_value = "This slice of pie chart has " + /*slice*/ ctx[17].percent * 100 + "%. The name of the slice is " + /*slice*/ ctx[17].name + ". This is slice " + (/*index*/ ctx[19] + 1) + " of " + /*series*/ ctx[3].slices.length);
			attr(path, "tabindex", "0");

			attr(path, "fill", path_fill_value = /*slice*/ ctx[17].color
			? /*slice*/ ctx[17].color
			: /*colors*/ ctx[4][/*index*/ ctx[19]]);

			attr(path, "d", path_d_value = 'M ' + calculateXPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]]) * /*dimension*/ ctx[2].resolution / 2 + " " + calculateYPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]]) * /*dimension*/ ctx[2].resolution / 2 + " A " + /*dimension*/ ctx[2].resolution / 2 + " " + /*dimension*/ ctx[2].resolution / 2 + " 0 " + calculateLargeArcFlagByPercent(/*slice*/ ctx[17].percent) + " 1 " + calculateXPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]] + /*slice*/ ctx[17].percent) * /*dimension*/ ctx[2].resolution / 2 + " " + calculateYPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]] + /*slice*/ ctx[17].percent) * /*dimension*/ ctx[2].resolution / 2 + "L 0 0 L" + calculateXPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]]) * /*dimension*/ ctx[2].resolution / 2 + " " + calculateYPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]]) * /*dimension*/ ctx[2].resolution / 2);
		},
		m(target, anchor) {
			insert(target, path, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);

			if (!mounted) {
				dispose = [
					listen(path, "blur", /*blur_handler*/ ctx[12]),
					listen(path, "focus", /*focus_handler*/ ctx[13])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty & /*idChart, series*/ 40 && path_id_value !== (path_id_value = "" + (/*idChart*/ ctx[5] + "_" + /*slice*/ ctx[17].name + "_slice"))) {
				attr(path, "id", path_id_value);
			}

			if (dirty & /*series*/ 8 && path_aria_label_value !== (path_aria_label_value = "This slice of pie chart has " + /*slice*/ ctx[17].percent * 100 + "%. The name of the slice is " + /*slice*/ ctx[17].name + ". This is slice " + (/*index*/ ctx[19] + 1) + " of " + /*series*/ ctx[3].slices.length)) {
				attr(path, "aria-label", path_aria_label_value);
			}

			if (dirty & /*series, colors*/ 24 && path_fill_value !== (path_fill_value = /*slice*/ ctx[17].color
			? /*slice*/ ctx[17].color
			: /*colors*/ ctx[4][/*index*/ ctx[19]])) {
				attr(path, "fill", path_fill_value);
			}

			if (dirty & /*dimension, series*/ 12 && path_d_value !== (path_d_value = 'M ' + calculateXPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]]) * /*dimension*/ ctx[2].resolution / 2 + " " + calculateYPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]]) * /*dimension*/ ctx[2].resolution / 2 + " A " + /*dimension*/ ctx[2].resolution / 2 + " " + /*dimension*/ ctx[2].resolution / 2 + " 0 " + calculateLargeArcFlagByPercent(/*slice*/ ctx[17].percent) + " 1 " + calculateXPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]] + /*slice*/ ctx[17].percent) * /*dimension*/ ctx[2].resolution / 2 + " " + calculateYPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]] + /*slice*/ ctx[17].percent) * /*dimension*/ ctx[2].resolution / 2 + "L 0 0 L" + calculateXPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]]) * /*dimension*/ ctx[2].resolution / 2 + " " + calculateYPositionOnCircleByPercent(/*cumulativePercents*/ ctx[8][/*index*/ ctx[19]]) * /*dimension*/ ctx[2].resolution / 2)) {
				attr(path, "d", path_d_value);
			}

			if (/*slice*/ ctx[17].percent > 0.05) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_4(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (detaching) detach(path);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (148:18) {#if series.slices !== undefined}
function create_if_block_1(ctx) {
	let each_1_anchor;
	let each_value = /*series*/ ctx[3].slices;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*idChart, series, dimension, colors*/ 60) {
				each_value = /*series*/ ctx[3].slices;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (150:22) {#if slice.percent <= 0.05}
function create_if_block_2(ctx) {
	let circle;
	let circle_fill_value;
	let circle_cx_value;
	let circle_cy_value;
	let text_1;
	let t_value = /*slice*/ ctx[17].name + " " + /*slice*/ ctx[17].percent * 100 + "%" + "";
	let t;
	let text_1_id_value;
	let text_1_x_value;
	let text_1_y_value;

	return {
		c() {
			circle = svg_element("circle");
			text_1 = svg_element("text");
			t = text(t_value);

			attr(circle, "fill", circle_fill_value = /*slice*/ ctx[17].color
			? /*slice*/ ctx[17].color
			: /*colors*/ ctx[4][/*index*/ ctx[19]]);

			attr(circle, "cx", circle_cx_value = -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom * 1.25));
			attr(circle, "cy", circle_cy_value = -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom * 1.15) / 2 * (1 - /*index*/ ctx[19] * 0.15) - 10);
			attr(circle, "r", "10");
			attr(text_1, "id", text_1_id_value = "" + (/*idChart*/ ctx[5] + "_" + /*slice*/ ctx[17].name + "_slice_low_legend"));
			attr(text_1, "class", "pie_chart_text svelte-smlgkn");
			attr(text_1, "x", text_1_x_value = -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom * 1.2));
			attr(text_1, "y", text_1_y_value = -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom * 1.1) / 2 * (1 - /*index*/ ctx[19] * 0.15));
		},
		m(target, anchor) {
			insert(target, circle, anchor);
			insert(target, text_1, anchor);
			append(text_1, t);
		},
		p(ctx, dirty) {
			if (dirty & /*series, colors*/ 24 && circle_fill_value !== (circle_fill_value = /*slice*/ ctx[17].color
			? /*slice*/ ctx[17].color
			: /*colors*/ ctx[4][/*index*/ ctx[19]])) {
				attr(circle, "fill", circle_fill_value);
			}

			if (dirty & /*dimension*/ 4 && circle_cx_value !== (circle_cx_value = -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom * 1.25))) {
				attr(circle, "cx", circle_cx_value);
			}

			if (dirty & /*dimension*/ 4 && circle_cy_value !== (circle_cy_value = -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom * 1.15) / 2 * (1 - /*index*/ ctx[19] * 0.15) - 10)) {
				attr(circle, "cy", circle_cy_value);
			}

			if (dirty & /*series*/ 8 && t_value !== (t_value = /*slice*/ ctx[17].name + " " + /*slice*/ ctx[17].percent * 100 + "%" + "")) set_data(t, t_value);

			if (dirty & /*idChart, series*/ 40 && text_1_id_value !== (text_1_id_value = "" + (/*idChart*/ ctx[5] + "_" + /*slice*/ ctx[17].name + "_slice_low_legend"))) {
				attr(text_1, "id", text_1_id_value);
			}

			if (dirty & /*dimension*/ 4 && text_1_x_value !== (text_1_x_value = -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom * 1.2))) {
				attr(text_1, "x", text_1_x_value);
			}

			if (dirty & /*dimension*/ 4 && text_1_y_value !== (text_1_y_value = -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom * 1.1) / 2 * (1 - /*index*/ ctx[19] * 0.15))) {
				attr(text_1, "y", text_1_y_value);
			}
		},
		d(detaching) {
			if (detaching) detach(circle);
			if (detaching) detach(text_1);
		}
	};
}

// (149:20) {#each series.slices as slice, index }
function create_each_block(ctx) {
	let if_block_anchor;
	let if_block = /*slice*/ ctx[17].percent <= 0.05 && create_if_block_2(ctx);

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
			if (/*slice*/ ctx[17].percent <= 0.05) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_2(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (167:12) {#if chartInfo.source !== ''}
function create_if_block(ctx) {
	let div;
	let a;
	let t0;
	let t1_value = /*chartInfo*/ ctx[1].source + "";
	let t1;
	let a_aria_label_value;
	let a_href_value;

	return {
		c() {
			div = element("div");
			a = element("a");
			t0 = text("Source: ");
			t1 = text(t1_value);
			attr(a, "tabindex", "0");
			attr(a, "aria-label", a_aria_label_value = "Read more about the source of the diagram and visit the website " + /*chartInfo*/ ctx[1].source);
			attr(a, "href", a_href_value = /*chartInfo*/ ctx[1].source);
			attr(div, "class", "source svelte-smlgkn");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, a);
			append(a, t0);
			append(a, t1);
		},
		p(ctx, dirty) {
			if (dirty & /*chartInfo*/ 2 && t1_value !== (t1_value = /*chartInfo*/ ctx[1].source + "")) set_data(t1, t1_value);

			if (dirty & /*chartInfo*/ 2 && a_aria_label_value !== (a_aria_label_value = "Read more about the source of the diagram and visit the website " + /*chartInfo*/ ctx[1].source)) {
				attr(a, "aria-label", a_aria_label_value);
			}

			if (dirty & /*chartInfo*/ 2 && a_href_value !== (a_href_value = /*chartInfo*/ ctx[1].source)) {
				attr(a, "href", a_href_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (79:6) <ThemeContext bind:theme={theme}>
function create_default_slot(ctx) {
	let div3;
	let div0;
	let t0;
	let div1;
	let p;
	let t1_value = /*chartInfo*/ ctx[1].desc + "";
	let t1;
	let p_aria_label_value;
	let t2;
	let div2;
	let svg;
	let title;
	let t3_value = /*chartInfo*/ ctx[1].title + "";
	let t3;
	let title_id_value;
	let desc;
	let t4_value = /*chartInfo*/ ctx[1].desc + "";
	let t4;
	let desc_id_value;
	let g0;
	let g1;
	let g2;
	let svg_aria_labelledby_value;
	let svg_viewBox_value;
	let svg_width_value;
	let svg_height_value;
	let t5;

	function select_block_type(ctx, dirty) {
		if (/*series*/ ctx[3].slices !== undefined) return create_if_block_3;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block0 = current_block_type(ctx);
	let if_block1 = /*series*/ ctx[3].slices !== undefined && create_if_block_1(ctx);
	let if_block2 = /*chartInfo*/ ctx[1].source !== '' && create_if_block(ctx);

	return {
		c() {
			div3 = element("div");
			div0 = element("div");
			t0 = space();
			div1 = element("div");
			p = element("p");
			t1 = text(t1_value);
			t2 = space();
			div2 = element("div");
			svg = svg_element("svg");
			title = svg_element("title");
			t3 = text(t3_value);
			desc = svg_element("desc");
			t4 = text(t4_value);
			g0 = svg_element("g");
			if_block0.c();
			g1 = svg_element("g");
			if (if_block1) if_block1.c();
			g2 = svg_element("g");
			t5 = space();
			if (if_block2) if_block2.c();
			attr(div0, "class", "chart_title svelte-smlgkn");
			attr(p, "aria-label", p_aria_label_value = /*chartInfo*/ ctx[1].desc);
			attr(p, "tabindex", "0");
			attr(p, "role", "note");
			attr(div1, "class", "chart_desc svelte-smlgkn");
			attr(title, "id", title_id_value = "" + (/*idChart*/ ctx[5] + "_title_chart"));
			attr(desc, "id", desc_id_value = "" + (/*idChart*/ ctx[5] + "_desc_chart"));
			attr(g1, "class", "legend");
			attr(g2, "class", "display_front svelte-smlgkn");
			attr(svg, "class", "chart");
			attr(svg, "role", "graphics-document");
			attr(svg, "aria-labelledby", svg_aria_labelledby_value = "" + (/*idChart*/ ctx[5] + "_desc_chart"));
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "viewBox", svg_viewBox_value = "" + (-(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom) / 2 + " " + -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom) / 2 + " " + /*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom + " " + /*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom));
			attr(svg, "width", svg_width_value = /*dimension*/ ctx[2].width);
			attr(svg, "height", svg_height_value = /*dimension*/ ctx[2].height);
			attr(div2, "class", "svg_wrap");
			attr(div3, "id", /*idChart*/ ctx[5]);
			attr(div3, "class", "wrapper svelte-smlgkn");
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div0);
			/*div0_binding*/ ctx[11](div0);
			append(div3, t0);
			append(div3, div1);
			append(div1, p);
			append(p, t1);
			append(div3, t2);
			append(div3, div2);
			append(div2, svg);
			append(svg, title);
			append(title, t3);
			append(svg, desc);
			append(desc, t4);
			append(svg, g0);
			if_block0.m(g0, null);
			append(svg, g1);
			if (if_block1) if_block1.m(g1, null);
			append(svg, g2);
			/*g2_binding*/ ctx[14](g2);
			append(div3, t5);
			if (if_block2) if_block2.m(div3, null);
		},
		p(ctx, dirty) {
			if (dirty & /*chartInfo*/ 2 && t1_value !== (t1_value = /*chartInfo*/ ctx[1].desc + "")) set_data(t1, t1_value);

			if (dirty & /*chartInfo*/ 2 && p_aria_label_value !== (p_aria_label_value = /*chartInfo*/ ctx[1].desc)) {
				attr(p, "aria-label", p_aria_label_value);
			}

			if (dirty & /*chartInfo*/ 2 && t3_value !== (t3_value = /*chartInfo*/ ctx[1].title + "")) set_data(t3, t3_value);

			if (dirty & /*idChart*/ 32 && title_id_value !== (title_id_value = "" + (/*idChart*/ ctx[5] + "_title_chart"))) {
				attr(title, "id", title_id_value);
			}

			if (dirty & /*chartInfo*/ 2 && t4_value !== (t4_value = /*chartInfo*/ ctx[1].desc + "")) set_data(t4, t4_value);

			if (dirty & /*idChart*/ 32 && desc_id_value !== (desc_id_value = "" + (/*idChart*/ ctx[5] + "_desc_chart"))) {
				attr(desc, "id", desc_id_value);
			}

			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if_block0.d(1);
				if_block0 = current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(g0, null);
				}
			}

			if (/*series*/ ctx[3].slices !== undefined) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					if_block1.m(g1, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty & /*idChart*/ 32 && svg_aria_labelledby_value !== (svg_aria_labelledby_value = "" + (/*idChart*/ ctx[5] + "_desc_chart"))) {
				attr(svg, "aria-labelledby", svg_aria_labelledby_value);
			}

			if (dirty & /*dimension*/ 4 && svg_viewBox_value !== (svg_viewBox_value = "" + (-(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom) / 2 + " " + -(/*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom) / 2 + " " + /*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom + " " + /*dimension*/ ctx[2].resolution * /*dimension*/ ctx[2].zoom))) {
				attr(svg, "viewBox", svg_viewBox_value);
			}

			if (dirty & /*dimension*/ 4 && svg_width_value !== (svg_width_value = /*dimension*/ ctx[2].width)) {
				attr(svg, "width", svg_width_value);
			}

			if (dirty & /*dimension*/ 4 && svg_height_value !== (svg_height_value = /*dimension*/ ctx[2].height)) {
				attr(svg, "height", svg_height_value);
			}

			if (/*chartInfo*/ ctx[1].source !== '') {
				if (if_block2) {
					if_block2.p(ctx, dirty);
				} else {
					if_block2 = create_if_block(ctx);
					if_block2.c();
					if_block2.m(div3, null);
				}
			} else if (if_block2) {
				if_block2.d(1);
				if_block2 = null;
			}

			if (dirty & /*idChart*/ 32) {
				attr(div3, "id", /*idChart*/ ctx[5]);
			}
		},
		d(detaching) {
			if (detaching) detach(div3);
			/*div0_binding*/ ctx[11](null);
			if_block0.d();
			if (if_block1) if_block1.d();
			/*g2_binding*/ ctx[14](null);
			if (if_block2) if_block2.d();
		}
	};
}

function create_fragment(ctx) {
	let themecontext;
	let updating_theme;
	let current;

	function themecontext_theme_binding(value) {
		/*themecontext_theme_binding*/ ctx[15](value);
	}

	let themecontext_props = {
		$$slots: { default: [create_default_slot] },
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
		p(ctx, [dirty]) {
			const themecontext_changes = {};

			if (dirty & /*$$scope, idChart, chartInfo, dimension, displayFront, series, colors, headerChartParentTag*/ 2097406) {
				themecontext_changes.$$scope = { dirty, ctx };
			}

			if (!updating_theme && dirty & /*theme*/ 1) {
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

function partialSum(slices, unshiftZero = true) {
	if (slices === undefined) {
		return [];
	}

	let partialSliceSums = Array(slices.length).fill(0);

	for (let i = 0; i < slices.length; i++) {
		if (i === 0) {
			partialSliceSums[i] = slices[i].percent;
		} else {
			partialSliceSums[i] = partialSliceSums[i - 1] + slices[i].percent;
		}
	}

	if (unshiftZero) {
		partialSliceSums.unshift(0);
	}

	return partialSliceSums;
}

function unmaskLegend(event) {
	var _a;
	let name = event.target.id + "_low_legend";

	if (document.getElementById(name) !== null) {
		(_a = document.getElementById(name)) === null || _a === void 0
		? void 0
		: _a.classList.remove("marked_legend");
	}
}

function markLowLegend(event) {
	var _a;
	let name = event.target.id + "_low_legend";

	if (document.getElementById(name) !== null) {
		(_a = document.getElementById(name)) === null || _a === void 0
		? void 0
		: _a.classList.add("marked_legend");
	}
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

	let { chartInfo = {
		title: "Pie chart title",
		desc: "This description is accessible and your screenreader will detect it.",
		source: ""
	} } = $$props;

	let { theme = defaultPieTheme } = $$props;

	let { dimension = {
		width: "800",
		height: "300",
		resolution: 800,
		zoom: 1.2
	} } = $$props;

	let { series = {} } = $$props;
	let colors;
	let idChart;
	let headerChartParentTag;
	let cumulativePercents = partialSum(series.slices);
	let displayFront;

	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
		$$invalidate(4, colors = Object.values(theme.colors));
		$$invalidate(5, idChart = generateId());
		createHeaderTagForElement(headerChartParentTag, chartInfo.title);
	}));

	function moveSliceForward(event) {
		let slice = event.target;
		let sliceBorder = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		sliceBorder.setAttribute('d', slice.getAttribute('d').toString());
		sliceBorder.classList.add('show_slice_border');
		displayFront.appendChild(sliceBorder);
	}

	function removeAllChildNodes() {
		while (displayFront.firstChild) {
			displayFront.removeChild(displayFront.firstChild);
		}
	}

	function div0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			headerChartParentTag = $$value;
			$$invalidate(6, headerChartParentTag);
		});
	}

	const blur_handler = event => {
		removeAllChildNodes();
		unmaskLegend(event);
	};

	const focus_handler = event => {
		moveSliceForward(event);
		markLowLegend(event);
	};

	function g2_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			displayFront = $$value;
			$$invalidate(7, displayFront);
		});
	}

	function themecontext_theme_binding(value) {
		theme = value;
		$$invalidate(0, theme);
	}

	$$self.$$set = $$props => {
		if ('chartInfo' in $$props) $$invalidate(1, chartInfo = $$props.chartInfo);
		if ('theme' in $$props) $$invalidate(0, theme = $$props.theme);
		if ('dimension' in $$props) $$invalidate(2, dimension = $$props.dimension);
		if ('series' in $$props) $$invalidate(3, series = $$props.series);
	};

	return [
		theme,
		chartInfo,
		dimension,
		series,
		colors,
		idChart,
		headerChartParentTag,
		displayFront,
		cumulativePercents,
		moveSliceForward,
		removeAllChildNodes,
		div0_binding,
		blur_handler,
		focus_handler,
		g2_binding,
		themecontext_theme_binding
	];
}

class PieChart extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance, create_fragment, safe_not_equal, {
			chartInfo: 1,
			theme: 0,
			dimension: 2,
			series: 3
		});
	}
}

const PointSchema = typebox.Type.Object({
    x: typebox.Type.Integer(),
    y: typebox.Type.Integer(),
    ariaLabel: typebox.Type.String({
        $comment: 'this will set the aria label attribute for accessibility',
    }),
});

var Point_type = /*#__PURE__*/Object.freeze({
    __proto__: null,
    PointSchema: PointSchema
});

exports.AccessibleChartTypes = Point_type;
exports.BarChart = BarChart;
exports.LineChart = LineChart;
exports.PieChart = PieChart;
