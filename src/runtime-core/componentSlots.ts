import { ShapeFlags } from "../shared/ShapeFlags"

export function initSlots(instance,children){
    // 希望组件传过来的children是一个对象 {key: h} or {key: [h,h]}
    const { vnode } = instance
    // 判断当前vnode是不是插槽
    if(vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children,instance.slots)
    }
}
function normalizeObjectSlots(children,slots){
    for( const key in children) {
        const value = children[key]
        slots[key] = (props) => normalizeSlotValue(value(props))
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}