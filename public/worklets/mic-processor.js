class MicProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (input && input[0]) {
      const channelData = input[0];
      const bufferCopy = channelData.slice(0);
      this.port.postMessage(bufferCopy, [bufferCopy.buffer]);
    }

    if (output && output[0]) {
      output[0].fill(0);
    }

    return true;
  }
}

registerProcessor('mic-processor', MicProcessor);
