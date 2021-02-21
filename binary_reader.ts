export class BinaryReader {
  private readonly data: DataView;
  private offset: number = 0;

  constructor(buffer: ArrayBufferLike | ArrayBufferView, private readonly encoding = "utf-8") {
    if (ArrayBuffer.isView(buffer)) {
      this.data = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else {
      this.data = new DataView(buffer);
    }
  }

  readByte(): number {
    const result = this.data.getUint8(this.offset);
    this.offset += 1;
    return result;
  }

  readSbyte(): number {
    const result = this.data.getInt8(this.offset);
    this.offset += 1;
    return result;
  }

  readInt16(): number {
    const result = this.data.getInt16(this.offset);
    this.offset += 2;
    return result;
  }

  readUInt16(): number {
    const result = this.data.getUint16(this.offset);
    this.offset += 2;
    return result;
  }

  readInt32(): number {
    const result = this.data.getInt32(this.offset, true);
    this.offset += 4;
    return result;
  }

  readUInt32(): number {
    const result = this.data.getUint32(this.offset, true);
    this.offset += 4;
    return result;
  }

  readInt64(): bigint {
    const result = this.data.getBigInt64(this.offset, true);
    this.offset += 8;
    return result;
  }

  reaUInt64(): bigint {
    const result = this.data.getBigUint64(this.offset, true);
    this.offset += 8;
    return result;
  }

  readSingle(): number {
    const result = this.data.getFloat32(this.offset, true);
    this.offset += 4;
    return result;
  }

  readDouble(): number {
    const result = this.data.getFloat64(this.offset, true);
    this.offset += 8;
    return result;
  }

  readBytes(count: number): Uint8Array {
    const result = new Uint8Array(this.data.buffer, this.data.byteOffset + this.offset, count);
    this.offset += count;
    return result;
  }

  readBoolean(): boolean {
    return this.readByte() > 0;
  }

  readChar(): number {
    const decoder = new TextDecoder(this.encoding, {fatal: true});
    let char: string;
    do {
      char = decoder.decode(this.readBytes(1), {stream: true});
    } while (char.length === 0);
    return char.charCodeAt(0);
  }

  readString(): string {
    let count = 0;
    let shift = 0;
    let b: number;
    do {
      b = this.readByte();
      count |= (b & 0x7f) << shift;
      shift += 7;
    } while ((b & 0x80) != 0);
    return new TextDecoder(this.encoding, {fatal: true}).decode(this.readBytes(count));
  }
}