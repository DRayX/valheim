import { BinaryReader } from "./binary_reader";

export enum Biome {
  None = 0x000,
  Meadows = 0x001,
  Swamp = 0x002,
  Mountain = 0x004,
  BlackForest = 0x008,
  Plains = 0x010,
  AshLands = 0x020,
  DeepNorth = 0x040,
  Ocean = 0x100,
  Mistlands = 0x200,
}

export class Vector2 {
  static readInt32(reader: BinaryReader): Vector2 {
    return new Vector2(reader.readInt32(), reader.readInt32());
  }
  constructor(readonly x: number, readonly y: number) {}
  get [Symbol.toStringTag](): string {
    return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`;
  }
  get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  dot(other: Vector2): number {
    return this.x * other.x + this.y * other.y;
  }
}

export class Vector3 {
  static readSingle(reader: BinaryReader): Vector3 {
    return new Vector3(reader.readSingle(), reader.readSingle(), reader.readSingle());
  }
  constructor(readonly x: number, readonly y: number, readonly z: number) {}
  get [Symbol.toStringTag](): string {
    return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)}, ${this.z.toFixed(1)})`;
  }
  get magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  dot(other: Vector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }
}

export class Quaternion {
  static readSingle(reader: BinaryReader): Quaternion {
    return new Quaternion(reader.readSingle(), reader.readSingle(), reader.readSingle(), reader.readSingle());
  }
  constructor(readonly x: number, readonly y: number, readonly z: number, readonly w: number) {}
  get [Symbol.toStringTag](): string {
    return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)}, ${this.z.toFixed(1)}, ${this.w.toFixed(1)})`;
  }
}

export class ZdoId {
  static load(reader: BinaryReader): ZdoId {
    return new ZdoId(reader.readInt64(), reader.readUInt32());
  }
  constructor(readonly userId: bigint, readonly id: number) {}
  get [Symbol.toStringTag](): string {
    return `${this.userId}:${this.id}`;
  }
}

export class Color {
  static readonly white = new Color(1, 1, 1, 1);
  constructor(readonly r: number, readonly g: number, readonly b: number, readonly a: number = 1) {}
  get [Symbol.toStringTag](): string {
    return `RGBA(${this.r.toFixed(3)}, ${this.g.toFixed(3)}, ${this.b.toFixed(3)}, ${this.a.toFixed(3)})`;
  }
}

export function readByteArray(reader: BinaryReader): Uint8Array {
  return reader.readBytes(reader.readInt32());
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
  return iadd(a, imul(b, 1566083941));
}

export const imul = Math.imul;

export function iadd(a: number, b: number): number {
  return (a + b) | 0;
}

export function idiv(a: number, b: number): number {
  return (a / b) | 0;
}

export function isub(a: number, b: number): number {
  return (a - b) | 0;
}