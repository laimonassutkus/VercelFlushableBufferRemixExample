import FlushableBuffer from "./flushableBuffer"

const buffer = new FlushableBuffer<string>(async buffer => {
    await new Promise<void>(resolve => {
        setTimeout(() => {
            buffer.forEach(item => console.log(`Flush action after 10 seconds: ${item}`))
            resolve()
        }, 10_000)
    })
})

export default function info(log: string) {
    buffer.addToBuffer(log)
    console.log(`Successfully added log to buffer: ${log}`)
}