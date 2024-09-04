import { h } from "../../lib/mini-vue.esm.js"
import { Foo } from "./Foo.js"
export const App = {
    name: 'APP',
    render() {
        return h('div',{},[h('div',{},'app'),h(Foo,{
            onAdd(a){
                console.log('App --onAdd',a)
            },
            onAddFoo() {
                console.log('App --onAddFoo')
            }
        })])
    },
    setup() {
        return {
            
        }
    }
}