import { waitUntil } from "@vercel/functions"
import asyncLog from "./asyncLog"

export default function info(log: string) {
    waitUntil(asyncLog(log))
    waitUntil(asyncLog(log))
}