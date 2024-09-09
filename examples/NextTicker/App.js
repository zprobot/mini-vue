import { h,ref,getCurrentInstance,nextTick } from "../../lib/mini-vue.esm.js"
export const App = {
    name: 'APP',
    setup() {
        const count = ref(1)
        const instance = getCurrentInstance()
        const onClick = () => {
            for (let i=0; i< 100; i++){
                console.log('update')
                count.value = i
            }
            console.log('start',instance.subTree.children[1].children)
            nextTick(()=>{
                console.log('next',instance.subTree.children[1].children)
            })
        }
        return {
            count,
            onClick,
        }
    },
    render() {
        const button = h('button',{onClick: this.onClick},'update')
        const p = h('p',{},'count:'+this.count)
        return h('div',
            {},
            [
                button,
                p
            ])
    },
}