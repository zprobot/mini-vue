const publicPropertiesMap = {
    $el: (i) => i.vnode.el
}
export const PublicInstanceProxyHandlers = {
    get({_: instance}, key) {
        // steupState
        const { setupState } = instance
        if(key in setupState) {
            return setupState[key]
        }
        // publicProp
        const publicGetter = publicPropertiesMap[key]
        if(publicGetter) {
            return publicGetter(instance)
        }

    }
}