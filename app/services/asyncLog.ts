export default class AsyncLogger {
    public async asyncLog(log: string) {
        console.log(`Log executed immediatelly: ${log}`)

        // We force the log to be printed only after some time.
        // Most importantly - AFTER the response is given.
        await new Promise(resolve => {
            setTimeout(resolve, 10_000)
        })

        console.log(`Log executed after 10 seconds: ${log}`)
    }
}
