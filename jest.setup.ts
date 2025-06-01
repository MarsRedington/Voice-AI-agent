/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// jest.setup.ts

// polyfill fetch
import 'whatwg-fetch';

// polyfill TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';
;(global as any).TextEncoder = TextEncoder;
;(global as any).TextDecoder = TextDecoder;

// stub BroadcastChannel for MSW
class BroadcastChannel {
  name: string;
  onmessage: ((ev: MessageEvent) => any) | null = null;
  constructor(name: string) {
    this.name = name;
  }
  postMessage(_message: any) {
    // no-op
  }
  close() {
    // no-op
  }
}
;(global as any).BroadcastChannel = BroadcastChannel;

// jest-dom matchers (optional)
import '@testing-library/jest-dom';
