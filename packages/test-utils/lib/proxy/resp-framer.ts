// RespFramer: Frames raw Buffer data into complete RESP messages
// Accumulates incoming bytes and emits each complete RESP message as a separate Buffer

import EventEmitter from "node:events";

export interface RespFramerEvents {
  message: (data: Buffer) => void;
  push: (data: Buffer) => void;
}

export default class RespFramer extends EventEmitter {
  private buffer: Buffer;
  private offset: number;

  constructor() {
    super();
    this.buffer = Buffer.alloc(0);
    this.offset = 0;
  }

  public write(data: Buffer) {
    this.buffer = Buffer.concat([this.buffer, data]);

    while (this.offset < this.buffer.length) {
      const messageEnd = this.findMessageEnd(this.buffer, this.offset);
      if (messageEnd === -1) {
        break; // Incomplete message
      }
      const message = this.buffer.subarray(this.offset, messageEnd);
      this.emit("message", message);
      this.offset = messageEnd;
    }

    // Remove processed data from the buffer
    if (this.offset > 0) {
      this.buffer = this.buffer.subarray(this.offset);
      this.offset = 0;
    }
  }

  private findMessageEnd(buffer: Buffer, start: number): number {
    if (start >= buffer.length) {
      return -1;
    }
    const prefix = String.fromCharCode(buffer[start]);
    switch (prefix) {
      case "+": // Simple String
      case "-": // Error
      case ":": // Integer
      case "_": // Null
      case "#": // Boolean
      case ",": // Double
      case "(": // Big Number
        return this.findLineEnd(buffer, start);
      case "$": // Bulk String
      case "!": // Bulk Error
      case "=": // Verbatim String
        return this.findBulkStringEnd(buffer, start);
      case "*": // Array
        return this.findArrayEnd(buffer, start);
      case "%": // Map
        return this.findMapEnd(buffer, start);
      case "~": // Set
      case ">": // Push
        return this.findArrayEnd(buffer, start);
      case "|": // Attribute
        return this.findAttributeEnd(buffer, start);
      default:
        return -1; // Unknown prefix
    }
  }

  private findArrayEnd(buffer: Buffer, start: number): number {
    const result = this.readLength(buffer, start);
    if (!result) {
      return -1;
    }
    const { length, lineEnd } = result;
    if (length === -1) {
      return lineEnd;
    }
    let currentOffset = lineEnd;
    for (let i = 0; i < length; i++) {
      const elementEnd = this.findMessageEnd(buffer, currentOffset);
      if (elementEnd === -1) {
        return -1;
      }
      currentOffset = elementEnd;
    }
    return currentOffset;
  }

  private findBulkStringEnd(buffer: Buffer, start: number): number {
    const result = this.readLength(buffer, start);
    if (!result) {
      return -1;
    }
    const { length, lineEnd } = result;
    if (length === -1) {
      return lineEnd;
    }
    const totalLength = lineEnd + length + 2;
    return totalLength <= buffer.length ? totalLength : -1;
  }

  private findMapEnd(buffer: Buffer, start: number): number {
    const result = this.readLength(buffer, start);
    if (!result) {
      return -1;
    }
    const { length, lineEnd } = result;
    if (length === -1) {
      return lineEnd;
    }
    let currentOffset = lineEnd;
    for (let i = 0; i < length * 2; i++) {
      const elementEnd = this.findMessageEnd(buffer, currentOffset);
      if (elementEnd === -1) {
        return -1;
      }
      currentOffset = elementEnd;
    }
    return currentOffset;
  }

  private findAttributeEnd(buffer: Buffer, start: number): number {
    const result = this.readLength(buffer, start);
    if (!result) {
      return -1;
    }
    const { length, lineEnd } = result;
    let currentOffset = lineEnd;
    for (let i = 0; i < length * 2; i++) {
      const elementEnd = this.findMessageEnd(buffer, currentOffset);
      if (elementEnd === -1) {
        return -1;
      }
      currentOffset = elementEnd;
    }
    const valueEnd = this.findMessageEnd(buffer, currentOffset);
    if (valueEnd === -1) {
      return -1;
    }
    return valueEnd;
  }

  private findLineEnd(buffer: Buffer, start: number): number {
    const end = buffer.indexOf("\r\n", start);
    return end !== -1 ? end + 2 : -1;
  }

  private readLength(
    buffer: Buffer,
    start: number,
  ): { length: number; lineEnd: number } | null {
    const lineEnd = this.findLineEnd(buffer, start);
    if (lineEnd === -1) {
      return null;
    }
    const lengthLine = buffer.subarray(start + 1, lineEnd - 2).toString();
    const length = parseInt(lengthLine, 10);
    if (isNaN(length)) {
      return null;
    }
    return { length, lineEnd };
  }
}
