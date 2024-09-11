import { NodeTypes } from "../ast";
import { isText } from "../utils";

export function transformText(node) {
    let currentContainer
    if(node.type === NodeTypes.ELEMENT) {
        return () => {
            const { children } = node
            for (let i = 0; i < children.length-1; i++) {
                const child = children[i]
                if(isText(child) && isText(children[i+1])) {
                    if(!currentContainer) {
                        currentContainer = children[i] = {
                            type: NodeTypes.COMPOUND_EXPRESSION,
                            children: [child]
                        }
                    }
                    currentContainer.children.push(' + ',children[i+1])
                    children.splice(i+1,1)
                    i--
                } else {
                    currentContainer = undefined
                    break
                }
            }
        }
    }
}