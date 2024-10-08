import { h } from "../../lib/mini-vue.esm.js"
export const Foo = {
    name: 'Foo',
    setup(props, { emit }) {
        const emitAdd = () => {
            console.log('emitAdd');
            emit('add', 1)
            emit('add-foo')
            return
        }
        return {
            emitAdd
        }
    },
    render() {
        const btn = h('button', {
            onClick: this.emitAdd
        }, 'emitAdd')
        const foo = h('p', {}, 'foo')
        return h('div', {}, [foo,btn])
    }
}