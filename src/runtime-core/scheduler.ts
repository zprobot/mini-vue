const queue: any = new Set()
let isFlushing = false
const p = Promise.resolve()
export function nextTick(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve()
}
// 异步任务队列
export function queueJobs(job){
    queue.add(job) //
    queueFlush()
}

function queueFlush() {
    if(isFlushing) return
    isFlushing = true
    nextTick(flushJobs)
}
function flushJobs() {
    isFlushing = false
    queue.forEach(job=>job())
}
