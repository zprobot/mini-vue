import { h, provide, inject} from "../../lib/mini-vue.esm.js"
import { Foo } from "./Foo.js"

const Provider = {
    name: 'Provider',
    setup() {
        provide('foo','fooval')
        provide('bar','barval')
    },
    render() {
        return h('div', {}, [h('p', {}, 'provider: fooval, barval'), h(ProviderTwo)])
    }
}
const ProviderTwo = {
    name: 'ProviderTwo',
    setup() {
        provide('foo','fooval2')
        const foo = inject('foo')
        return {
            foo
        }
    },
    render() {
        return h('div', {}, [h('p', {}, 'parentfoo:'+this.foo+' provide foo: fooval2'), h(Consumer)])
    }
}
const Consumer = {
    name: 'Consumer',
    setup() {
        const foo = inject('foo')
        const bar = inject('bar')
        const boo = inject('boo','booval')
        const boo2 = inject('boo2',()=>'booval2')
        return {
            foo,
            bar,
            boo,
            boo2
        }
    },
    render() {
        return h('div', {}, `consumer: ${this.foo}-${this.bar}-${this.boo}-${this.boo2}`)
    }
}
export const App = {
    name: 'APP',
    render() {
        return h('div',{},[h('div',{},"inject"),h(Provider)])
    },
    setup() {}
}