import { Job, JobData, Queue, Worker } from "bullmq";
import { bullMQOpts, bullMQWorkerOpts } from "../../utils/bullMQ.js";

interface CallTranscript {
  message: string
  interviewId: number
  speaker: 'ai_interviewer' | 'user'  
}

const syncTranscriptQueue: Queue<CallTranscript> = new Queue('sync-interview-transcript', bullMQOpts)

const syncTranscriptWorkerProcessor = async (job: Job<CallTranscript>) => {
  const { message } = job.data
  console.log({ message })
}

const worker = new Worker('sync-interview-transcript', syncTranscriptWorkerProcessor, bullMQWorkerOpts)

worker.on('failed', (job: Job<CallTranscript>) => console.warn('Job failed', job.data))

export { syncTranscriptQueue }
