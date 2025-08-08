import '@testing-library/jest-dom';

// Mock fetch globally for tests
global.fetch = jest.fn();

// Reset fetch mock before each test
beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

// Mock ReadableStream and TextDecoderStream for Node.js environment
if (!global.ReadableStream) {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    pipeThrough() { return this; }
    pipeTo() { return Promise.resolve(); }
  } as any;
}

if (!global.TextDecoderStream) {
  global.TextDecoderStream = class TextDecoderStream {
    constructor() {}
  } as any;
}

if (!global.WritableStream) {
  global.WritableStream = class WritableStream {
    constructor() {}
  } as any;
}