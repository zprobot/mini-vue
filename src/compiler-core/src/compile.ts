import { generate } from "./codeGen"
import { beseParse } from "./parse"
import { transform } from "./transform"
import { transformElement } from "./transforms/transformElement"
import { transformExpression } from "./transforms/transformExpression"
import { transformText } from "./transforms/transformText"

export function baseCompile(template: string) {
    const ast = beseParse(template)
    transform(ast,{
        nodeTransforms:[transformExpression,transformElement,transformText]
    })
    //console.log(generate(ast))
    return generate(ast)
}