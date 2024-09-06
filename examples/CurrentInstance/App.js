import { h, getCurrentInstance } from "../../lib/mini-vue.esm.js"
import { Foo } from "./Foo.js"
export const App = {
    name: 'APP',
    render() {
        return h('div',{},[h('div',{},"currentInstance"),h(Foo)])
    },
    setup() {
        const instance = getCurrentInstance()
        console.log('app:', instance)
    }
}