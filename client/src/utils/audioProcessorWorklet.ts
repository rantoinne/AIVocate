export const audioProcessorCode = `
  class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
    }

    process(inputs, outputs, parameters) {
      const input = inputs[0];
      
      if (input.length > 0) {
        const inputBuffer = input[0]; // First channel
        
        // Convert float32 to int16
        const int16Buffer = new Int16Array(inputBuffer.length);
        for (let i = 0; i < inputBuffer.length; i++) {
          int16Buffer[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
        }
        
        // Send the buffer to the main thread
        this.port.postMessage(int16Buffer.buffer);
      }
      
      return true; // Keep the processor alive
    }
  }

  registerProcessor('audio-processor', AudioProcessor);
`;