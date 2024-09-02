import { h } from "../lib/mini-vue.esm.js"
export const App = {
    render() {
        return h('div',{
            id: 'root',
            class: ['foo','boo']
        },
        [h('p',{class: 'foo'},'hi'),h('p',{class: 'boo'},'mini-vue')]
        )
    },
    setup() {
        return {
            msg: 'mini-vue',
        }
    }
}