import { h } from "../lib/mini-vue.esm.js"
// 实现setup中获取传入的props
// 实现render中获取到值
// 实现props为readonly
export const Foo = {
    setup(props) {
        console.log(props)
        props.count++
        console.log(props)
    },
    render() {
        return h('div', {}, 'foo: ' + this.count)
    }
}