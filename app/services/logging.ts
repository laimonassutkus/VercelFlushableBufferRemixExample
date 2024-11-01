import { waitUntil } from "@vercel/functions"

async function asyncLog(log: string) {

    // We force the log to be printed only after some time.
    // Most importantly - AFTER the response is given.
    await new Promise(resolve => {
        setTimeout(resolve, 10_000)
    })

    console.log(log)
}

export default function info(log: string) {
    waitUntil(asyncLog(log))
}