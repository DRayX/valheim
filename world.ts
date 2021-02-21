import { BinaryReader } from "./binary_reader";
import { PREFAB_MAP } from "./prefabs";
import { Quaternion, readByteArray, stableHash, Vector2, Vector3, ZdoId } from "./util";

enum ObjectType {
  Default,
  Prioritized,
  Solid,
}

class Zdo {
  uid: ZdoId;
  ownerRevision: number;
  dataRevision: number;
  persistent: boolean;
  owner: bigint;
  timeCreated: bigint;
  pgwVersion: number;
  type: ObjectType;
  typeName_: string;
  distant: boolean;
  prefab: number;
  prefabName_: string;
  sector: Vector2;
  position: Vector3;
  rotation: Quaternion;
  readonly floats: {[id: number] : number} = {};
  readonly vec3: {[id: number] : Vector3} = {};
  readonly quats: {[id: number] : Quaternion} = {};
  readonly ints: {[id: number] : number} = {};
  readonly longs: {[id: number] : bigint} = {};
  readonly strings: {[id: number] : string} = {};

  load(reader: BinaryReader, version: number) {
    this.ownerRevision = reader.readUInt32();
    this.dataRevision = reader.readUInt32();
    this.persistent = reader.readBoolean();
    this.owner = reader.readInt64();
    this.timeCreated = reader.readInt64();
    this.pgwVersion = reader.readInt32();
    if (version >= 16 && version < 24) {
      reader.readInt32();  // unused
    }
    if (version >= 23) {
      this.type = reader.readSbyte();
      this.typeName_ = ObjectType[this.type];
    }
    if (version >= 22) {
      this.distant = reader.readBoolean();
    }
    if (version < 13) {
      reader.readChar();  // unused
      reader.readChar();  // unused
    }
    if (version >= 17) {
      this.prefab = reader.readInt32();
    }
    this.sector = Vector2.readInt32(reader);
    this.position = Vector3.readSingle(reader);
    this.rotation = Quaternion.readSingle(reader);
    const floatCount = reader.readChar();
    for (let i = 0; i < floatCount; ++i) {
      this.floats[reader.readInt32()] = reader.readSingle();
    }
    const vec3Count = reader.readChar();
    for (let i = 0; i < vec3Count; ++i) {
      this.vec3[reader.readInt32()] = Vector3.readSingle(reader);
    }
    const quatCount = reader.readChar();
    for (let i = 0; i < quatCount; ++i) {
      this.quats[reader.readInt32()] = Quaternion.readSingle(reader);
    }
    const intCount = reader.readChar();
    for (let i = 0; i < intCount; ++i) {
      this.ints[reader.readInt32()] = reader.readInt32();
    }
    const longCount = reader.readChar();
    for (let i = 0; i < longCount; ++i) {
      this.longs[reader.readInt32()] = reader.readInt64();
    }
    const stringCount = reader.readChar();
    for (let i = 0; i < stringCount; ++i) {
      this.strings[reader.readInt32()] = reader.readString();
    }
    if (version < 17) {
      this.prefab = this.ints[stableHash('prefab')];
    }
    this.prefabName_ = PREFAB_MAP[this.prefab];
  }
}

class ZdoMan {
  nextUid: number;
  readonly objectsById: {[id: string] : Zdo} = {};
  readonly deadZdos: {[id: string] : bigint} = {};

  load(reader: BinaryReader, version: number) {
    reader.readInt64();  // unused
    this.nextUid = reader.readUInt32();
    const zdoCount = reader.readInt32();
    for (let i = 0; i < zdoCount; ++i) {
      const zdo = new Zdo();
      zdo.uid = ZdoId.load(reader);
      const pkg = new BinaryReader(readByteArray(reader));
      zdo.load(pkg, version);
      this.objectsById[zdo.uid.toString()] = zdo;
    }
    const deadZdoCount = reader.readInt32();
    for (let i = 0; i < deadZdoCount; ++i) {
      const key = ZdoId.load(reader);
      this.deadZdos[key.toString()] = reader.readInt64();
    }
  }
}

class LocationInstance {
  name: string;
  position: Vector3;
  placed: boolean;
}

class ZoneSystem {
  static readonly zoneSize = 64;
  readonly generatedZones: Vector2[] = [];
  readonly globalKeys: string[] = [];
  readonly locationInstances: {[pos: string]: LocationInstance} = {};
  pgwVersion: number;
  locationVersion: number;
  locationsGenerated: boolean;

  static getZone(point: Vector3): Vector2 {
    return new Vector2(
        Math.floor((point.x + this.zoneSize / 2) / this.zoneSize),
        Math.floor((point.z + this.zoneSize / 2) / this.zoneSize));
  }

  load(reader: BinaryReader, version: number) {
    const zoneCount = reader.readInt32();
    for (let i = 0; i < zoneCount; ++i) {
      this.generatedZones.push(Vector2.readInt32(reader));
    }
    if (version < 13) {
      return;
    }
    this.pgwVersion = reader.readInt32();
    this.locationVersion = version >= 21 ? reader.readInt32() : 0;
    if (version >= 14) {
      const globalKeyCount = reader.readInt32();
      for (let i = 0; i < globalKeyCount; ++i) {
        this.globalKeys.push(reader.readString());
      }
    }
    if (version < 18) {
      return;
    }
    if (version >= 20) {
      this.locationsGenerated = reader.readBoolean();
    }
    const locationCount = reader.readInt32();
    for (let i = 0; i < locationCount; ++i) {
      const location = new LocationInstance();
      location.name = reader.readString();
      location.position = Vector3.readSingle(reader);
      location.placed = version >= 19 ? reader.readBoolean() : false;
      this.locationInstances[ZoneSystem.getZone(location.position).toString()] = location;
    }
  }
}

class RandEventSystem {
  eventTimer: number;
  eventName: string;
  eventTime: number;
  eventPos: Vector3;

  load(reader: BinaryReader, version: number) {
    this.eventTimer = reader.readSingle();
    if (version < 25) {
      return;
    }
    this.eventName = reader.readString();
    this.eventTime = reader.readSingle();
    this.eventPos = Vector3.readSingle(reader);
  }
}

export class World {
  netTime: number;
  readonly zdoMan = new ZdoMan();
  readonly zoneSystem = new ZoneSystem();
  readonly randEventSystem = new RandEventSystem();

  constructor(readonly version: number) {}

  static load(dbBuffer: ArrayBufferLike | ArrayBufferView): World {
    const dbReader = new BinaryReader(dbBuffer);
    const world = new World(dbReader.readInt32());
    if (world.version >= 4) {
      world.netTime = dbReader.readDouble();
    }
    world.zdoMan.load(dbReader, world.version);
    if (world.version >= 12) {
      world.zoneSystem.load(dbReader, world.version);
    }
    if (world.version >= 15) {
      world.randEventSystem.load(dbReader, world.version);
    }
    return world;
  }
}

export class WorldMeta {
  name: string;
  seedName: string;
  seed: number;
  uid: bigint;
  worldGenVersion: number;

  constructor(readonly version: number) {}

  static load(metaBuffer: ArrayBufferLike | ArrayBufferView): WorldMeta {
    const metaReader = new BinaryReader(metaBuffer);
    const pkg = new BinaryReader(readByteArray(metaReader));
    const meta = new WorldMeta(pkg.readInt32());
    meta.name = pkg.readString();
    meta.seedName = pkg.readString();
    meta.seed = pkg.readInt32();
    meta.uid = pkg.readInt64();
    if (meta.version >= 26) {
      meta.worldGenVersion = pkg.readInt32();
    }
    return meta;
  }
}