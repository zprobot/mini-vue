function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isString = (val) => typeof val === 'string';
const hadChange = (oldVal, newVal) => {
    return !Object.is(oldVal, newVal);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// add-foo -> addFoo
const camelize = str => str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '');
// addFoo -> AddFoo
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
// add -> onAdd 
const toHandlerKey = str => str ? 'on' + capitalize(str) : '';

class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        shouldTrack = false;
        return res;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((deps) => {
        deps.delete(effect);
    });
    effect.deps.length = 0;
}
const targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let deps = depsMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, deps);
    }
    trackEffects(deps);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trackEffects(deps) {
    if (deps.has(activeEffect))
        return;
    deps.add(activeEffect);
    activeEffect.deps.push(deps); // 反向收集依赖
}
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const deps = depsMap.get(key);
    triggerEffects(deps);
}
function triggerEffects(deps) {
    for (const effect of deps) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
let activeEffect;
let shouldTrack;
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // extend options
    extend(options);
    _effect.onStop = options.onStop;
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}

// 缓存，不需要每次访问都创建
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        // 用于判断响应式
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isObject(res) && !isShallow) {
            // 深度响应式
            return isReadonly ? readonly(res) : reactive(res);
        }
        // 搜集依赖
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn('readonly do not support set');
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(obj) {
    return createActiveObject(obj, mutableHandlers);
}
function readonly(obj) {
    return createActiveObject(obj, readonlyHandlers);
}
function shallowReadonly(obj) {
    return createActiveObject(obj, shallowReadonlyHandlers);
}
function createActiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} must be an object`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.deps = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hadChange(this._rawValue, newValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.deps);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.deps);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(ref) {
    return new Proxy(ref, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, newValue) {
            if (isRef(target[key]) && !isRef(newValue)) {
                return (target[key].value = newValue);
            }
            return Reflect.set(target, key, newValue);
        }
    });
}

function emit(instance, event, ...args) {
    console.log('emit', event);
    const { props } = instance;
    // add -> onAdd
    // add-foo -> onAddFoo
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    // props
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // steupState
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // publicProp
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    // 希望组件传过来的children是一个对象 {key: h} or {key: [h,h]}
    const { vnode } = instance;
    // 判断当前vnode是不是插槽
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    console.log(vnode.type, parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        next: null,
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: null,
        update: () => { },
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setComponentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setComponentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function 
    // obj
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
function getCurrentInstance() {
    //返回当前组件的实例对象 只在setup中可用
    return currentInstance;
}
function setComponentInstance(instance) {
    currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function shouldUpdateComponent(preVNode, nextVNode) {
    const { props: prevProps } = preVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 组件类型 children为object 
    if (vnode.shapeFlag === 2 /* ShapeFlags.STATEFUL_COMPONENT */ && isObject(vnode.children)) {
        vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVnode(text) {
    return createVNode(Text, {}, text);
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            }
        };
    };
}

const queue = new Set();
let isFlushing = false;
Promise.resolve();
function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
}
// 异步任务队列
function queueJobs(job) {
    queue.add(job); //
    queueFlush();
}
function queueFlush() {
    if (isFlushing)
        return;
    isFlushing = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushing = false;
    queue.forEach(job => job());
}

function createRenderer(options) {
    const { createElement, patchProp, insert, remove, setTextElement } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    // n1 old vnode
    // n2 new vnode
    function patch(n1, n2, container, parentComponent, anchor) {
        // 处理组件
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        // Frament节点只渲染children
        mountChildren(n2.children, container, parentComponent);
    }
    function processText(n1, n2, container) {
        const textNode = (n2.el = document.createTextNode(n2.children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            // 更新
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // props
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        const el = n2.el = n1.el;
        patchProps(el, oldProps, newProps);
        // children
        patchChildren(n1, n2, el, parentComponent);
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const preProp = oldProps[key];
                const nextProp = newProps[key];
                if (preProp !== nextProp) {
                    patchProp(el, key, preProp, nextProp);
                }
            }
            // 删除
            for (const key in oldProps) {
                if (!(key in newProps)) {
                    patchProp(el, key, oldProps[key], null);
                }
            }
        }
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const preShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 新的为文本，老的为数组
            if (preShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 清理老的，设置新的
                unmountChildren(n1.children);
                setTextElement(container, n2.children);
            }
            else {
                if (n1.children !== n2.children) {
                    setTextElement(container, n2.children);
                }
            }
        }
        else {
            if (preShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                setTextElement(container, '');
                mountChildren(n2.children, container, parentComponent);
            }
            else {
                // array to array
                patchKeyChildren(n1.children, n2.children, container, parentComponent);
            }
        }
    }
    function unmountChildren(children) {
        for (const child in children) {
            remove(child);
        }
    }
    function patchKeyChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0;
        let c1Len = c1.length - 1, c2Len = c2.length - 1;
        while (i <= c1Len && i <= c2Len) {
            const n1 = c1[i], n2 = c2[i];
            if (isSameNode(n1, n2)) {
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        while (i <= c1Len && i <= c2Len) {
            const n1 = c1[c1Len], n2 = c2[c2Len];
            if (isSameNode(n1, n2)) {
                patch(n1, n2, container, parentComponent);
            }
            else {
                break;
            }
            c1Len--;
            c2Len--;
        }
        // 创建新的
        if (i > c1Len && i <= c2Len) {
            const nextPos = c2Len + 1;
            nextPos < c2.length ? c2[nextPos].el : null;
            while (i <= c2Len) {
                patch(null, c2[i], container, parentComponent);
                i++;
            }
        }
        else if (i > c2Len) {
            while (i <= c1Len) {
                remove(c1[i].el);
                i++;
            }
        }
        else {
            let s1 = i, s2 = i;
            const patchSum = c2Len - s2 + 1;
            let patchCount = 0;
            const indexMap = new Map();
            const newToOldIndexMap = Array(patchSum).fill(0);
            let moved = false;
            let maxIndex = 0;
            for (let i = s2; i <= c2Len; i++) {
                const nextChild = c2[i];
                indexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= c1Len; i++) {
                const preChild = c1[i];
                if (patchCount >= patchSum) {
                    remove(preChild.el);
                    continue;
                }
                let newIndex;
                if (preChild.key !== null) {
                    newIndex = indexMap.get(preChild.key);
                }
                else {
                    for (let j = s2; j <= c2Len; j++) {
                        if (isSameNode(preChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    // 删除老节点
                    remove(preChild.el);
                }
                else {
                    if (newIndex >= maxIndex) {
                        maxIndex = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newToOldIndexMap[newIndex - s2] = i + 1;
                    patch(preChild, c2[newIndex], container, parentComponent);
                    patchCount++;
                }
            }
            const maxLenSubSeq = moved ? getSequence(newToOldIndexMap) : [];
            let j = maxLenSubSeq.length - 1;
            for (let i = patchSum - 1; i >= 0; i--) {
                const newIndex = i + s2;
                const nextChild = c2[newIndex];
                const anchor = newIndex + 1 < c2.length ? c2[newIndex + 1].el : null;
                if (newToOldIndexMap[i] === 0) {
                    // 创建新的
                    patch(null, nextChild, container, parentComponent);
                }
                if (moved) {
                    if (i !== maxLenSubSeq[j]) {
                        // 移动
                        insert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function isSameNode(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        const { type, props, children, shapeFlag } = vnode;
        const el = (vnode.el = createElement(type));
        // children
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent);
        }
        for (const key in props) {
            let val = props[key];
            patchProp(el, key, null, val);
        }
        insert(el, container);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(v => patch(null, v, container, parentComponent));
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent);
        }
        else {
            // update
            updateComponent(n1, n2);
        }
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        const instance = initialVnode.component = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function updateComponent(n1, n2) {
        const instance = n2.component = n1.component;
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                const subTree = instance.subTree = instance.render.call(proxy, proxy);
                // vnode -> patch
                // vnode -> element -> mountElement
                // 递归挂载子树
                patch(null, subTree, container, instance);
                // 所有组件都挂载
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { proxy, next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy, proxy);
                const preSubTree = instance.subTree;
                instance.subTree = subTree;
                patch(preSubTree, subTree, container, instance);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            }
        });
    }
    function updateComponentPreRender(instance, nextVnode) {
        instance.vnode = nextVnode;
        instance.next = null;
        instance.props = nextVnode.props;
    }
    return {
        createApp: createAppAPI(render)
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, key, props) {
    const slot = slots[key];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

// 只能在setup中使用
function provide(key, value) {
    // 存
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 只在第一次执行初始化操作设置原型
        // 初始化时当前组件的provides和父组件的provides是一个对象
        if (parentProvides === currentInstance.provides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        // 在当前对象上赋值，原型执行父对象
        provides[key] = value;
    }
}
function inject(key, defaultVal) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { parent } = currentInstance;
        const parentProvides = parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultVal) {
            return typeof defaultVal === 'function' ? defaultVal() : defaultVal;
        }
    }
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, preVal, nextVal) {
    // 处理修改
    // 处理nextval为null或者undifined
    // 处理删除
    const isOn = key => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === null || nextVal == undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, container, anchor) {
    container.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setTextElement(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setTextElement
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextVnode: createTextVnode,
    effect: effect,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    nextTick: nextTick,
    provide: provide,
    proxyRefs: proxyRefs,
    ref: ref,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    toDisplayString: toDisplayString
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode'
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    // 处理导入
    genFunctionPreamble(ast, context);
    push('return function ');
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`${functionName}(${signature}){`);
    push('return ');
    genNode(ast.codegenNode, context);
    push(`}`);
    return {
        code: context.code
    };
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SAMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, healper } = context;
    push(healper(TO_DISPLAY_STRING));
    push(`(`);
    genNode(node.content, context);
    push(')');
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, healper } = context;
    const { tag, children, props } = node;
    push(`${healper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(')');
    //genNode(children,context)
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(', ');
        }
    }
}
function genNullable(args) {
    return args.map(arg => arg || 'null');
}
function genCompoundExpression(node, context) {
    const children = node.children;
    const { push } = context;
    for (const child of children) {
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        healper(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const vueBinging = 'Vue';
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${vueBinging}`);
    }
    push('\n');
}

function beseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advance(context, length);
    return content;
}
function parseChildren(context, tagStack) {
    const nodes = [];
    while (!isEnd(context, tagStack)) {
        let node;
        let s = context.source;
        if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        else if (s[0] === '<') {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, tagStack);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, tagStack) {
    const s = context.source;
    // 结束标签
    if (s.startsWith('</')) {
        for (let i = tagStack.length - 1; i >= 0; i--) {
            const tag = tagStack[i];
            if (startWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // 字符为空
    return !s;
}
function parseInterpolation(context) {
    // {{ message }}
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    let endIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advance(context, openDelimiter.length);
    const contentLen = endIndex - openDelimiter.length;
    const contentRaw = parseTextData(context, contentLen);
    advance(context, closeDelimiter.length);
    const content = contentRaw.trim();
    return {
        type: 0 /* NodeTypes.INTERPOLATION */, //'interpolation',
        content: {
            type: 1 /* NodeTypes.SAMPLE_EXPRESSION */,
            content: content
        }
    };
}
function parseElement(context, tagStack) {
    const element = parseTag(context, 0 /* TagsType.Start */);
    tagStack.push(element.tag);
    element.children = parseChildren(context, tagStack);
    tagStack.pop();
    if (startWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagsType.End */);
    }
    else {
        throw new Error(`缺少结束标签${element.tag}`);
    }
    return element;
}
function startWithEndTagOpen(source, tag) {
    return source.startsWith('</') && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
function parseTag(context, type) {
    // 解析tag
    // 前进
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    advance(context, match[0].length);
    advance(context, 1);
    if (type === 1 /* TagsType.End */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
    };
}
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ["<", "{{"];
    for (const token of endTokens) {
        const index = context.source.indexOf(token);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
function advance(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        type: 4 /* NodeTypes.ROOT */,
        children
    };
}
function createParserContext(content) {
    return {
        source: content
    };
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 深度优先遍历
    traverseNode(root, context);
    //
    createRootChildren(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootChildren(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function traverseNode(node, context) {
    // 使用插件式向函数外部暴露节点，让外部决定节点处理逻辑
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const exitFn = transform(node, context);
        if (exitFn)
            exitFns.push(exitFn);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            // 处理差值的render函数需要toDisplayString辅助
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        traverseNode(children[i], context);
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            const vnodeProps = node.props;
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    // 处理插值类型的插件
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    let currentContainer;
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            for (let i = 0; i < children.length - 1; i++) {
                const child = children[i];
                if (isText(child) && isText(children[i + 1])) {
                    if (!currentContainer) {
                        currentContainer = children[i] = {
                            type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                            children: [child]
                        };
                    }
                    currentContainer.children.push(' + ', children[i + 1]);
                    children.splice(i + 1, 1);
                    i--;
                }
                else {
                    currentContainer = undefined;
                    break;
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = beseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    //console.log(generate(ast))
    return generate(ast);
}

// 出口文件
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDom);
    console.log(render);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextVnode, effect, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, registerRuntimeCompiler, renderSlots, toDisplayString };
//# sourceMappingURL=mini-vue.esm.js.map
