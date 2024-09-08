import { createRenderer } from "../runtime-core/renderer";
function createElement(type) {
    return document.createElement(type)
}

function patchProp(el,key,preVal,nextVal) {
    // 处理修改
    // 处理nextval为null或者undifined
    // 处理删除
    const isOn = key => /^on[A-Z]/.test(key)
    if(isOn(key)){
        const event = key.slice(2).toLowerCase()
        el.addEventListener(event,nextVal)
    }else {
        if(nextVal===null || nextVal == undefined) {
            el.removeAttribute(key)
        } else{
            el.setAttribute(key,nextVal)
        }
    }
}

function insert(child, container,anchor) {
    container.insertBefore(child,anchor || null)
}

function remove(child) {
    const parent = child.parentNode
    if(parent){
        parent.removeChild(child)
    }
}
function setTextElement(el,text){
    el.textContent = text
}
const renderer: any = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setTextElement
})

export function createApp(...args) {
    return renderer.createApp(...args)
}
export * from '../runtime-core'