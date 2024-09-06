import { getCurrentInstance } from "./component";
// 只能在setup中使用
export function provide(key, value){
    // 存
    const currentInstance: any = getCurrentInstance()
    if(currentInstance) {
        let { provides } = currentInstance
        const parentProvides = currentInstance.parent.provides
        // 只在第一次执行初始化操作设置原型
        // 初始化时当前组件的provides和父组件的provides是一个对象
        if(parentProvides === currentInstance.provides) {
            provides = currentInstance.provides = Object.create(parentProvides)
        }
        // 在当前对象上赋值，原型执行父对象
        provides[key] = value
    }
}
export function inject(key,defaultVal?) {
    const currentInstance: any = getCurrentInstance()
    if(currentInstance) {
        const { parent } = currentInstance
        const parentProvides = parent.provides
        if (key in parentProvides) {
            return parentProvides[key]
        } else if(defaultVal) {
            return typeof defaultVal === 'function' ? defaultVal() : defaultVal
        }
    }
}