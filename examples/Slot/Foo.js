import { h,renderSlots } from "../../lib/mini-vue.esm.js"
export const Foo = {
    name: 'Foo',
    setup() {
        return {
            
        }
    },
    render() {
        const foo = h('p', {}, 'foo')
        // 获取到渲染的元素
        // 获取到渲染的位置
        return h('div', {}, [renderSlots(this.$slots,'slot1',{ age: '18岁'}),foo,renderSlots(this.$slots,'slot2')])
    }
}