var extend = Object.assign;
var isObject = function (val) {
    return val !== null && typeof val === 'object';
};
var hasOwn = function (val, key) { return Object.prototype.hasOwnProperty.call(val, key); };
// add-foo -> addFoo
var camelize = function (str) { return str.replace(/-(\w)/g, function (_, c) { return c ? c.toUpperCase() : ''; }); };
// addFoo -> AddFoo
var capitalize = function (str) { return str.charAt(0).toUpperCase() + str.slice(1); };
// add -> onAdd 
var toHandlerKey = function (str) { return str ? 'on' + capitalize(str) : ''; };

var Fragment = Symbol('Fragment');
var Text = Symbol('Text');
function createVNode(type, props, children) {
    var vnode = {
        type: type,
        props: props,
        children: children,
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

var targetMap = new Map();
function trigger(target, key) {
    var depsMap = targetMap.get(target);
    var deps = depsMap.get(key);
    triggerEffects(deps);
}
function triggerEffects(deps) {
    for (var _i = 0, deps_1 = deps; _i < deps_1.length; _i++) {
        var effect_1 = deps_1[_i];
        if (effect_1.scheduler) {
            effect_1.scheduler();
        }
        else {
            effect_1.run();
        }
    }
}

// 缓存，不需要每次访问都创建
var get = createGetter();
var set = createSetter();
var readonlyGet = createGetter(true);
var shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly, isShallow) {
    if (isReadonly === void 0) { isReadonly = false; }
    if (isShallow === void 0) { isShallow = false; }
    return function get(target, key) {
        // 用于判断响应式
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        var res = Reflect.get(target, key);
        if (isObject(res) && !isShallow) {
            // 深度响应式
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        var res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
var mutableHandlers = {
    get: get,
    set: set,
};
var readonlyHandlers = {
    get: readonlyGet,
    set: function (target, key, value) {
        console.warn('readonly do not support set');
        return true;
    }
};
var shallowReadonlyHandlers = extend({}, readonlyHandlers, {
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
        console.warn("target ".concat(raw, " must be an object"));
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

function emit(instance, event) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    console.log('emit', event);
    var props = instance.props;
    // add -> onAdd
    // add-foo -> onAddFoo
    var handlerName = toHandlerKey(camelize(event));
    var handler = props[handlerName];
    handler && handler.apply(void 0, args);
}

function initProps(instance, rawProps) {
    // props
    instance.props = rawProps || {};
}

var publicPropertiesMap = {
    $el: function (i) { return i.vnode.el; },
    $slots: function (i) { return i.slots; }
};
var PublicInstanceProxyHandlers = {
    get: function (_a, key) {
        var instance = _a._;
        // steupState
        var setupState = instance.setupState, props = instance.props;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // publicProp
        var publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    // 希望组件传过来的children是一个对象 {key: h} or {key: [h,h]}
    var vnode = instance.vnode;
    // 判断当前vnode是不是插槽
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    var _loop_1 = function (key) {
        var value = children[key];
        slots[key] = function (props) { return normalizeSlotValue(value(props)); };
    };
    for (var key in children) {
        _loop_1(key);
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

var currentInstance = null;
function createComponentInstance(vnode, parent) {
    console.log(vnode.type, parent);
    var component = {
        vnode: vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent: parent,
        emit: function () { }
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
    var Component = instance.type;
    // ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    var setup = Component.setup;
    if (setup) {
        setComponentInstance(instance);
        var setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setComponentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function 
    // obj
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    var Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
function getCurrentInstance() {
    //返回当前组件的实例对象 只在setup中可用
    return currentInstance;
}
function setComponentInstance(instance) {
    currentInstance = instance;
}

function render(vnode, container, parentComponent) {
    patch(vnode, container, parentComponent);
}
function patch(vnode, container, parentComponent) {
    // 处理组件
    var type = vnode.type, shapeFlag = vnode.shapeFlag;
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                processElement(vnode, container, parentComponent);
            }
            else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                processComponent(vnode, container, parentComponent);
            }
            break;
    }
}
function processFragment(vnode, container, parentComponent) {
    // Frament节点只渲染children
    mountChildren(vnode, container, parentComponent);
}
function processText(vnode, container) {
    var textNode = (vnode.el = document.createTextNode(vnode.children));
    container.append(textNode);
}
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}
function mountElement(vnode, container, parentComponent) {
    var type = vnode.type, props = vnode.props, children = vnode.children, shapeFlag = vnode.shapeFlag;
    var el = (vnode.el = document.createElement(type));
    // children
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode, el, parentComponent);
    }
    for (var key in props) {
        var val = props[key];
        var isOn = function (key) { return /^on[A-Z]/.test(key); };
        if (isOn(key)) {
            var event_1 = key.slice(2).toLowerCase();
            el.addEventListener(event_1, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach(function (v) { return patch(v, container, parentComponent); });
}
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
function mountComponent(initialVnode, container, parentComponent) {
    var instance = createComponentInstance(initialVnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    var proxy = instance.proxy;
    var subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    // 递归挂载子树
    patch(subTree, container, instance);
    // 所有组件都挂载
    initialVnode.el = subTree.el;
}

function createApp(rootComponent) {
    return {
        mount: function (rootContainer) {
            var vnode = createVNode(rootComponent);
            render(vnode, rootContainer, undefined);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, key, props) {
    var slot = slots[key];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

// 只能在setup中使用
function provide(key, value) {
    // 存
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        var provides = currentInstance.provides;
        var parentProvides = currentInstance.parent.provides;
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
    var currentInstance = getCurrentInstance();
    if (currentInstance) {
        var parent_1 = currentInstance.parent;
        var parentProvides = parent_1.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultVal) {
            return typeof defaultVal === 'function' ? defaultVal() : defaultVal;
        }
    }
}

export { createApp, createTextVnode, getCurrentInstance, h, inject, provide, renderSlots };
//# sourceMappingURL=mini-vue.esm.js.map
