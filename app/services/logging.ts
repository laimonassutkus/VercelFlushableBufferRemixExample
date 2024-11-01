import { waitUntil } from "@vercel/functions"
import AsyncLogger from "./asyncLog"


class Logger {
    asyncLogger: AsyncLogger

    public constructor() {
        this.asyncLogger = new AsyncLogger()
    }

    public info(log: string) {
        waitUntil(this.asyncLogger.asyncLog(log))
    
        const promise = new Promise<void>((resolve) => {
            setTimeout(async () => {
                try { await this.asyncLogger.asyncLog(`In a promise of 10 seconds: ${log}`) }
                finally { resolve() }
            }, 10_000)
        })
    
        waitUntil(promise)
    }
}

const logger = new Logger()
export default logger
