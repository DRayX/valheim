import { BinaryReader } from "./binary_reader";
import { readByteArray, Biome, Vector2, Vector3, ZdoId } from "./util";

enum SkillType {
  None = 0,
  Sowrds = 1,
  Knives = 2,
  Clubs = 3,
  Polearms = 4,
  Spears = 5,
  Blocking = 6,
  Axes = 7,
  Bows = 8,
  FireMagic = 9,
  FrostMagic = 10,
  Unarmed = 11,
  Pickaxes = 12,
  WoodCutting = 13,
  Jump = 100,
  Sneak = 101,
  Run = 102,
  Swim = 103,
  All = 999,
}

enum PinType {
  Icon0,
  Icon1,
  Icon2,
  Icon3,
  Death,
  Bed,
  Icon4,
  Shout,
  None,
  Boss,
  Player,
  RandomEvent,
  Ping,
  EventArea,
}

class PlayerStats {
  kills: number;
  deaths: number;
  crafts: number;
  builds: number;
}

class WorldPlayerData {
  haveCustomSpawnPoint: boolean;
  spawnPoint: Vector3;
  haveLogoutPoint: boolean;
  logoutPoint: Vector3;
  haveDeathPoint: boolean;
  deathPoint: Vector3;
  homePoint: Vector3;
  mapData: MapData;
}

class Food {
  name: string;
  health: number;
  stamina: number;
}

class Item {
  name: string;
  stack: number;
  durability: number;
  pos: Vector2;
  equiped: boolean;
  quality: number;
  variant: number;
  crafterId: bigint;
  crafterName: string;
}

class Skill {
  skill: SkillType;
  name_: string;
  level: number;
  accumulator: number;
}

class Inventory {
  readonly inventory: Item[] = [];

  load(reader: BinaryReader) {
    const version = reader.readInt32();
    const itemCount = reader.readInt32();
    for (let i = 0; i < itemCount; ++i) {
      const item = new Item();
      item.name = reader.readString();
      item.stack = reader.readInt32();
      item.durability = reader.readSingle();
      item.pos = Vector2.readInt32(reader);
      item.equiped = reader.readBoolean();
      item.quality = version >= 101 ? reader.readInt32() : 1;
      item.variant = version >= 102 ? reader.readInt32() : 0;
      if (version >= 103) {
        item.crafterId = reader.readInt64();
        item.crafterName = reader.readString();
      } else {
        item.crafterId = 0n;
        item.crafterName = "";
      }
      this.inventory.push(item);
    }
  }
}

class Skills {
  readonly skills: Skill[] = [];
  load(reader: BinaryReader) {
    const version = reader.readInt32();
    const skillCount = reader.readInt32();
    for (let i = 0; i < skillCount; ++i) {
      const skill = new Skill();
      skill.skill = reader.readInt32();
      skill.name_ = SkillType[skill.skill];
      skill.level = reader.readSingle();
      skill.accumulator = version >= 2 ? reader.readSingle() : 0;
      this.skills.push(skill);
    }
  }
}

class Player {
  maxHealth: number;
  health: number;
  stamina: number;
  firstSpawn: boolean;
  timeSinceDeath: number;
  guardianPower: string;
  guardianPowerCooldown: number;
  readonly inventory = new Inventory();
  readonly knownRecipes: string[] = [];
  readonly knownStations: {[key: string]: number} = {};
  readonly knownMaterial: string[] = [];
  readonly shownTutorials: string[] = [];
  readonly uniques: string[] = [];
  readonly trophies: string[] = [];
  readonly knownBiome: Biome[] = [];
  readonly knownBiomeNames_: string[] = [];
  readonly knownTexts: {[key: string]: string} = {};
  beard: string;
  hair: string;
  skinColor: Vector3;
  hairColor: Vector3;
  playerModel: number;
  readonly foods: Food[] = [];
  readonly skills = new Skills();

  constructor(readonly version: number) {}

  static load(buffer: ArrayBufferLike | ArrayBufferView): Player {
    const reader = new BinaryReader(buffer);
    const player = new Player(reader.readInt32());
    if (player.version >= 7) {
      player.maxHealth = reader.readSingle();
    }
    player.health = reader.readSingle();
    if (player.version >= 10) {
      player.stamina = reader.readSingle();
    }
    if (player.version >= 8) {
      player.firstSpawn = reader.readBoolean();
    }
    if (player.version >= 20) {
      player.timeSinceDeath = reader.readSingle();
    }
    if (player.version >= 23) {
      player.guardianPower = reader.readString();
    }
    if (player.version >= 24) {
      player.guardianPowerCooldown = reader.readSingle();
    }
    if (player.version === 2) {
      ZdoId.load(reader);  // unused
    }
    player.inventory.load(reader);
    const knownRecipeCount = reader.readInt32();
    for (let i = 0; i < knownRecipeCount; ++i) {
      player.knownRecipes.push(reader.readString());
    }
    if (player.version < 15) {
      const count = reader.readInt32();
      for (let i = 0; i < count; ++i) {
        reader.readString();  // unused
      }
    } else {
      const knownStationsCount = reader.readInt32();
      for (let i = 0; i < knownStationsCount; ++i) {
        player.knownStations[reader.readString()] = reader.readInt32();
      }
    }
    const knownMaterialCount = reader.readInt32();
    for (let i = 0; i < knownMaterialCount; ++i) {
      player.knownMaterial.push(reader.readString());
    }
    if (player.version < 19 || player.version >= 21) {
      const shownTutorialCount = reader.readInt32();
      for (let i = 0; i < shownTutorialCount; ++i) {
        player.shownTutorials.push(reader.readString());
      }
    }
    if (player.version >= 6) {
      const uniqueCount = reader.readInt32();
      for (let i = 0; i < uniqueCount; ++i) {
        player.uniques.push(reader.readString());
      }
    }
    if (player.version >= 9) {
      const trophiesCount = reader.readInt32();
      for (let i = 0; i < trophiesCount; ++i) {
        player.trophies.push(reader.readString());
      }
    }
    if (player.version >= 18) {
      const knownBiomeCount = reader.readInt32();
      for (let i = 0; i < knownBiomeCount; ++i) {
        const biome = reader.readInt32();
        player.knownBiome.push(biome);
        player.knownBiomeNames_.push(Biome[biome]);
      }
    }
    if (player.version >= 22) {
      const knownTextCount = reader.readInt32();
      for (let i = 0; i < knownTextCount; ++i) {
        player.knownTexts[reader.readString()] = reader.readString();
      }
    }
    if (player.version >= 4) {
      player.beard = reader.readString();
      player.hair = reader.readString();
    }
    if (player.version >= 5) {
      player.skinColor = Vector3.readSingle(reader);
      player.hairColor = Vector3.readSingle(reader);
    }
    if (player.version >= 11) {
      player.playerModel = reader.readInt32();
    }
    if (player.version >= 12) {
      const foodCount = reader.readInt32();
      for (let i = 0; i < foodCount; ++i) {
        if (player.version >= 14) {
          const food = new Food();
          food.name = reader.readString();
          food.health = reader.readSingle();
          if (player.version >= 16) {
            food.stamina = reader.readSingle();
          }
          player.foods.push(food);
        } else {
          reader.readSingle();  // unused
          reader.readSingle();  // unused
          reader.readSingle();  // unused
          reader.readSingle();  // unused
          reader.readSingle();  // unused
          reader.readSingle();  // unused
          reader.readSingle();  // unused
          if (player.version >= 13) {
            reader.readSingle();  // unused
          }
        }
      }
    }
    if (player.version >= 17) {
      player.skills.load(reader);
    }
    return player;
  }
}

class Pin {
  name: string;
  pos: Vector3;
  type: PinType;
  typeName_: string;
  isChecked: boolean;
}

class MapData {
  textureSize: number;
  readonly explored: boolean[] = [];

  constructor(readonly version: number) {}

  static load(buffer: ArrayBufferLike | ArrayBufferView): MapData {
    const reader = new BinaryReader(buffer);
    const mapData = new MapData(reader.readInt32());
    mapData.textureSize = reader.readInt32();
    for (let i = 0; i < mapData.textureSize * mapData.textureSize; ++i) {
      mapData.explored.push(reader.readBoolean());
    }
    if (mapData.version >= 2) {
      const pinCount = reader.readInt32();
      for (let i = 0; i < pinCount; ++i) {
        const pin = new Pin();
        pin.name = reader.readString();
        pin.pos = Vector3.readSingle(reader);
        pin.type = reader.readInt32();
        pin.typeName_ = PinType[pin.type];
        pin.isChecked = reader.readBoolean();
      }
    }
    return mapData;
  }
}

export class Character {
  hash: Uint8Array;
  readonly playerStats = new PlayerStats();
  readonly worldData: {[key: string] : WorldPlayerData} = {};
  playerName: string;
  playerId: bigint;
  startSeed: string;
  player: Player;

  constructor(readonly version: number) {}

  static load(buffer: ArrayBufferLike | ArrayBufferView): Character {
    const reader = new BinaryReader(buffer);
    const data = readByteArray(reader);
    const hash = readByteArray(reader);
    const pkg = new BinaryReader(data);
    const character = new Character(pkg.readInt32());
    character.hash = hash;
    if (character.version >= 28) {
      character.playerStats.kills = pkg.readInt32();
      character.playerStats.deaths = pkg.readInt32();
      character.playerStats.crafts = pkg.readInt32();
      character.playerStats.builds = pkg.readInt32();
    }
    const worldCount = pkg.readInt32();
    for (let i = 0; i < worldCount; ++i) {
      const key = pkg.readInt64();
      const worldPlayerData = new WorldPlayerData();
      worldPlayerData.haveCustomSpawnPoint = pkg.readBoolean();
      worldPlayerData.spawnPoint = Vector3.readSingle(pkg);
      worldPlayerData.haveLogoutPoint = pkg.readBoolean();
      worldPlayerData.logoutPoint = Vector3.readSingle(pkg);
      if (character.version >= 30) {
        worldPlayerData.haveDeathPoint = pkg.readBoolean();
        worldPlayerData.deathPoint = Vector3.readSingle(pkg);
      }
      worldPlayerData.homePoint = Vector3.readSingle(pkg);
      if (character.version >= 29 && pkg.readBoolean()) {
        worldPlayerData.mapData = MapData.load(readByteArray(pkg));
      }
      character.worldData[key.toString()] = worldPlayerData;
    }
    character.playerName = pkg.readString();
    character.playerId = pkg.readInt64();
    character.startSeed = pkg.readString();
    if (pkg.readBoolean()) {
      character.player = Player.load(readByteArray(pkg));
    }
    return character;
  }
}