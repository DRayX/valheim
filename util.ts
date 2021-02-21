import { BinaryReader } from "./binary_reader";

export class Vector2 {
  constructor(readonly x: number, readonly y: number) {}
  get [Symbol.toStringTag](): string {
    return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`;
  }
  static readInt32(reader: BinaryReader): Vector2 {
    return new Vector2(reader.readInt32(), reader.readInt32());
  }
}

export class Vector3 {
  constructor(readonly x: number, readonly y: number, readonly z: number) {}
  get [Symbol.toStringTag](): string {
    return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)}, ${this.z.toFixed(1)})`;
  }
  static readSingle(reader: BinaryReader): Vector3 {
    return new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
  }
}

export class Quaternion {
  constructor(readonly x: number, readonly y: number, readonly z: number, readonly w: number) {}
  get [Symbol.toStringTag](): string {
    return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)}, ${this.z.toFixed(1)}, ${this.w.toFixed(1)})`;
  }
  static readSingle(reader: BinaryReader): Quaternion {
    return new Quaternion(reader.readSingle(), reader.readSingle(), reader.readSingle(), reader.readSingle());
  }
}

export class ZdoId {
  constructor(readonly userId: bigint, readonly id: number) {}

  get [Symbol.toStringTag](): string {
    return `${this.userId}:${this.id}`;
  }

  static load(reader: BinaryReader): ZdoId {
    return new ZdoId(reader.readInt64(), reader.readUInt32());
  }
}

export function stableHash(str: string): number {
  let a = 5381;
  let b = a;
  for (let i = 0; i < str.length && str[i] != "\0"; i += 2) {
    a = iadd(a << 5, a) ^ str.charCodeAt(i);
    if (i != str.length - 1 && str[i + 1] != "\0") {
      b = iadd(b << 5, b) ^ str.charCodeAt(i + 1);
    } else {
      break;
    }
  }
  return iadd(a, Math.imul(b, 1566083941));
}

export function readByteArray(reader: BinaryReader): Uint8Array {
  return reader.readBytes(reader.readInt32());
}

function iadd(a: number, b: number): number {
  return (a + b) | 0;
}