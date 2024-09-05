import { h } from "../../lib/mini-vue.esm.js"
import { Foo } from "./Foo.js"
export const App = {
    name: 'APP',
    render() {
        const app = h('div',{},'App')
        const foo = h(Foo,{},{
            slot1:({age}) => h('p',{},'123'+age),
            slot2:() => h('p',{},'456')}
        )
        return h('div',{},[app,foo])
    },
    setup() {
        return {
            
        }
    }
}