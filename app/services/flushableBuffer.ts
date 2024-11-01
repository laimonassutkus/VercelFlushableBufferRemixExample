import { waitUntil } from "@vercel/functions"

export default class FlushableBuffer<T> {
    private debug: boolean = true
    private sharedBuffer: T[] = []
    private timeoutMutex: boolean = false
    private flushingMutex: boolean = false

    public constructor(
        private flushAction: (buffer: T[]) => Promise<void>,
        private maxItems: number = 100,
        private flushIntervalMs = 1000,
        private maxFlushRecursionDepth: number = 5
    ) { }

    /**
     * Asynchronously flushes a portion of the shared buffer while preventing concurrent flush operations.
     * Repeats flushing operation if the buffer is not empty after the initial flushing.
     */
    private async flushAsync(recursionDepth: number = 0): Promise<void> {
        // Max recursion depth reached, return.
        if (recursionDepth >= this.maxFlushRecursionDepth) {
            console.warn(`Max recursion depth (${this.maxFlushRecursionDepth}) has been reached. This likely means not all items were flushed. Increased the recursion depth or allowed buffer size.`)
            return
        }

        // If flushing mutext is set, this means that flushing is being executed 
        // by another thread, therefore, return.
        if (this.flushingMutex) return

        // If buffer is empty, there is nothing to flush, therefore, return.
        if (this.sharedBuffer.length === 0) return

        // Set the mutex so other threads can not perform flushing.
        this.flushingMutex = true

        // Make a splice of a shared buffer. We will flush only the copied (spliced) buffer. 
        const bufferCopy = this.sharedBuffer.splice(0, this.maxItems)

        try {
            if (this.debug) { console.debug(`Executing flush action... Buffer length: ${bufferCopy.length}. Shared buffer length: ${this.sharedBuffer.length}.`) }
            await this.flushAction(bufferCopy)
            if (this.debug) { console.debug(`Successfully executed flush action. Buffer length sent: ${bufferCopy.length}. Shared buffer length after flushing: ${this.sharedBuffer.length}.`) }
        } catch (err: any) {
            console.error(`Unexpected error in flush async operation: ${err.message} ${err}.`)
            // Reinsert bufferCopy on failure so we can try flushing again.
            this.sharedBuffer = bufferCopy.concat(this.sharedBuffer)
        } finally {
            this.flushingMutex = false

            // If buffer is empty, it means we have flushed everything.
            if (this.sharedBuffer.length === 0) return

            // Otherwise, the flushed buffer is not empty (very likely that when we were flushing
            // some new items got into the buffer or an error ocurred). We should repeat the flushing 
            // operation after the specified amount of time.
            await new Promise<void>(async (resolve) => {
                setTimeout(async () => {
                    try { await this.flushAsync(recursionDepth + 1) }
                    finally { resolve() }
                }, this.flushIntervalMs)
            })
        }
    }

    public addToBuffer(log: T) {
        // Flush the buffer if adding this log would exceed the count limits.
        if (this.sharedBuffer.length >= this.maxItems) {
            waitUntil(this.flushAsync())
        }

        // Add log to the buffer.
        this.sharedBuffer.push(log)

        // If timeout mutex is set, it means that timeout was created and the 
        // flushing will happen. Otherwise, if the mutex is not set, proceed 
        // in creating a timeout to eventually flush the buffer.
        if (this.timeoutMutex) return

        // Set the mutext so no other threads can create a timeout.
        // There should be only one timeout at a single time.
        this.timeoutMutex = true

        const promise = new Promise<void>((resolve) => {
            setTimeout(async () => {
                try { await this.flushAsync() }
                finally { this.timeoutMutex = false; resolve() }
            }, this.flushIntervalMs)
        })

        waitUntil(promise)
    }
}
