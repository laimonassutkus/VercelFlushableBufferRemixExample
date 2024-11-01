import { waitUntil } from "@vercel/functions"
import asyncLog from "./asyncLog"

export default function info(log: string) {
    waitUntil(asyncLog(log))

    const promise = new Promise<void>((resolve) => {
        setTimeout(async () => {
            try { await asyncLog(`In a promise of 10 seconds: ${log}`) }
            finally { resolve() }
        }, 10_000)
    })

    waitUntil(promise)
}