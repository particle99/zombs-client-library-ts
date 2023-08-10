'use strict';

const ByteBuffer = require('bytebuffer');
const { _WebAssembly } = require('../_WebAssembly.js');

let PACKET = {
  PRE_ENTER_WORLD: 5,
  ENTER_WORLD: 4,
  RPC: 9,
  PING: 7,
  ENTITY_UPDATE: 0,
  INPUT: 3,
  ENTER_WORLD2: 6
};

var ATTRIBUTE_TYPE;
(function(ATTRIBUTE_TYPE) {
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Uninitialized"] = 0] = "Uninitialized";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Uint32"] = 1] = "Uint32";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Int32"] = 2] = "Int32";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Float"] = 3] = "Float";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["String"] = 4] = "String";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Vector2"] = 5] = "Vector2";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["EntityType"] = 6] = "EntityType";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["ArrayUint32"] = 8] = "ArrayUint32";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Uint16"] = 9] = "Uint16";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Uint8"] = 10] = "Uint8";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Int16"] = 11] = "Int16";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Int8"] = 12] = "Int8";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Uint64"] = 13] = "Uint64";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Int64"] = 14] = "Int64";
  ATTRIBUTE_TYPE[ATTRIBUTE_TYPE["Double"] = 15] = "Double";
})(ATTRIBUTE_TYPE || (ATTRIBUTE_TYPE = {}));
var e_ParameterType;
(function(e_ParameterType) {
  e_ParameterType[e_ParameterType["Uint32"] = 0] = "Uint32";
  e_ParameterType[e_ParameterType["Int32"] = 1] = "Int32";
  e_ParameterType[e_ParameterType["Float"] = 2] = "Float";
  e_ParameterType[e_ParameterType["String"] = 3] = "String";
  e_ParameterType[e_ParameterType["Uint64"] = 4] = "Uint64";
  e_ParameterType[e_ParameterType["Int64"] = 5] = "Int64";
})(e_ParameterType || (e_ParameterType = {}));

class Codec {
  constructor(window, hostname) {
    this.absentEntitiesFlags = [];
    this.rpcMaps = [];
    this.updatedEntityFlags = [];
    this.attributeMaps = {};
    this.entityTypeNames = {};
    this.removedEntities = {};
    this.rpcMapsByName = {};
    this.sortedUidsByType = {};
    this.entities = {};

    this.window = window;
    this.hostname = hostname;


    this.init();
  };

  async init() {
    this.wasm = new _WebAssembly(this.window, this.hostname);
    await this.wasm.init();

    //console.log("Instantiated wasm");
  }

  encode(opcode, data) {
    const buffer = new ByteBuffer(100, true);
    switch (opcode) {
      case PACKET.ENTER_WORLD:
        buffer.writeUint8(PACKET.ENTER_WORLD);
        this.encodeEnterWorld(buffer, data);
        break;
      case PACKET.ENTER_WORLD2:
        buffer.writeUint8(PACKET.ENTER_WORLD2);
        this.encodeEnterWorld2(buffer);
        break;
      case PACKET.INPUT:
        buffer.writeUint8(PACKET.INPUT);
        this.encodeInput(buffer, data);
        break;
      case PACKET.PING:
        buffer.writeUint8(PACKET.PING);
        this.encodePing(buffer);
        break;
      case PACKET.RPC:
        buffer.writeUint8(PACKET.RPC);
        this.encodeRpc(buffer, data);
    }

    buffer.flip();
    buffer.compact();

    return buffer.toArrayBuffer();
  }

  decode(arrayBuffer) {
    const buffer = ByteBuffer.wrap(arrayBuffer, 'utf8', true);
    const opcode = buffer.readUint8();

    let decoded = {};
    switch (opcode) {
      case PACKET.PRE_ENTER_WORLD:
        decoded = this.decodePreEnterWorldResponse(buffer);
        break;
      case PACKET.ENTER_WORLD:
        decoded = this.decodeEnterWorldResponse(buffer);
        break;
      case PACKET.ENTITY_UPDATE:
        decoded = this.decodeEntityUpdate(buffer);
        break;
      case PACKET.PING:
        decoded = this.decodePing();
        break;
      case PACKET.RPC:
        decoded = this.decodeRpc(buffer);
    }

    decoded.opcode = opcode;
    return decoded;
  }

  safeReadVString(buffer) {
    let offset = buffer.offset;
    const len = buffer.readVarint32(offset);

    try {
      const func = buffer.readUTF8String.bind(buffer);
      offset += len.length;

      const str = func(len.value, ByteBuffer.METRICS_BYTES, offset);
      offset += str.length;
      buffer.offset = offset;

      return str.string;
    } catch (e) {
      offset += len.value;
      buffer.offset = offset;

      return '?';
    }
  }

  decodePreEnterWorldResponse(buffer) {
    const blendField1 = this.wasm._MakeBlendField(24, 132);

    let BlendField = this.wasm._MakeBlendField(228, buffer.remaining());
    for (let i = 0; buffer.remaining();) {
      this.wasm.HEAPU8[BlendField + i] = buffer.readUint8();
      i++;
    }

    this.wasm._MakeBlendField(172, 36);
    BlendField = this.wasm._MakeBlendField(4, 152);

    let extra = new ArrayBuffer(64);
    let extraData = new Uint8Array(extra);

    for (let i = 0; i < 64; i++)
      extraData[i] = this.wasm.HEAPU8[BlendField + i];

    return { extra };
  }

  decodeEnterWorldResponse(buffer) {
    const EnterWorldResponse = {
      allowed: buffer.readUint32(),
      uid: buffer.readUint32(),
      startingTick: buffer.readUint32(),
      tickRate: buffer.readUint32(),
      effectiveTickRate: buffer.readUint32(),
      players: buffer.readUint32(),
      maxPlayers: buffer.readUint32(),
      chatChannel: buffer.readUint32(),
      effectiveDisplayName: this.safeReadVString(buffer),
      x1: buffer.readInt32(),
      y1: buffer.readInt32(),
      x2: buffer.readInt32(),
      y2: buffer.readInt32()
    }

    const dataLength = buffer.readUint32();

    this.attributeMaps = {};
    this.entityTypeNames = {};

    for (let h = 0; h < dataLength; h++) {
      const attributes = [];
      const attributeID = buffer.readUint32();
      const entityNames = buffer.readVString();
      const attributesLength = buffer.readUint32();

      for (let i = 0; i < attributesLength; i++) {
        attributes.push({
          name: buffer.readVString(),
          type: buffer.readUint32()
        });
      }

      this.attributeMaps[attributeID] = attributes;
      this.entityTypeNames[attributeID] = entityNames;
      this.sortedUidsByType[attributeID] = [];
    }

    const rpcLength = buffer.readUint32();

    this.rpcMaps = [];
    this.rpcMapsByName = {};

    for (let h = 0; h < rpcLength; h++) {
      const name = buffer.readVString();
      const parameterLength = buffer.readUint8();
      const isArray = buffer.readUint8() !== 0;
      const parameters = [];

      for (let i = 0; i < parameterLength; i++) {
        parameters.push({
          'name': buffer.readVString(),
          'type': buffer.readUint8()
        });
      }

      const rpc = {
        name,
        parameters,
        isArray,
        index: this.rpcMaps.length
      };

      this.rpcMaps.push(rpc);
      this.rpcMapsByName[name] = rpc;
    }

    return EnterWorldResponse;
  }

  decodeEntityUpdate(buffer) {
    var tick = buffer.readUint32();
    var removedEntityCount = buffer.readVarint32();
    var entityUpdateData = {};
    entityUpdateData.tick = tick;
    entityUpdateData.entities = {};
    for (var uid in this.removedEntities) {
      delete this.removedEntities[uid];
    }
    for (var i = 0; i < removedEntityCount; i++) {
      var uid = buffer.readUint32();
      this.removedEntities[uid] = 1;
    }
    var brandNewEntityTypeCount = buffer.readVarint32();
    for (var i = 0; i < brandNewEntityTypeCount; i++) {
      var brandNewEntityCountForThisType = buffer.readVarint32();
      var brandNewEntityType = buffer.readUint32();
      var brandNewEntityTypeString = this.entityTypeNames[brandNewEntityType];
      for (var j = 0; j < brandNewEntityCountForThisType; j++) {
        var brandNewEntityUid = buffer.readUint32();
        this.sortedUidsByType[brandNewEntityType].push(brandNewEntityUid);
      }
    }
    for (var i in this.sortedUidsByType) {
      var table = this.sortedUidsByType[i];
      var newEntityTable = [];
      for (var j = 0; j < table.length; j++) {
        var uid = table[j];
        if (!(uid in this.removedEntities)) {
          newEntityTable.push(uid);
        }
      }
      newEntityTable.sort(function(a, b) {
        if (a < b) {
          return -1;
        }
        if (a > b) {
          return 1;
        }
        return 0;
      });
      this.sortedUidsByType[i] = newEntityTable;
      entityUpdateData.sortedUidsByType = this.sortedUidsByType;
    }
    while (buffer.remaining()) {
      var entityType = buffer.readUint32();
      var entityTypeString = this.entityTypeNames[entityType];
      if (!(entityType in this.attributeMaps)) {
        throw new Error('Entity type is not in attribute map: ' + entityType);
      }
      var absentEntitiesFlagsLength = Math.floor((this.sortedUidsByType[entityType].length + 7) / 8);
      this.absentEntitiesFlags.length = 0;
      for (var i = 0; i < absentEntitiesFlagsLength; i++) {
        this.absentEntitiesFlags.push(buffer.readUint8());
      }
      var attributeMap = this.attributeMaps[entityType];
      for (var tableIndex = 0; tableIndex < this.sortedUidsByType[entityType].length; tableIndex++) {
        var uid = this.sortedUidsByType[entityType][tableIndex];
        if ((this.absentEntitiesFlags[Math.floor(tableIndex / 8)] & (1 << (tableIndex % 8))) !== 0) {
          entityUpdateData.entities[uid] = true;
          continue;
        }
        var player = {
          uid: uid
        };
        this.updatedEntityFlags.length = 0;
        for (var j = 0; j < Math.ceil(attributeMap.length / 8); j++) {
          this.updatedEntityFlags.push(buffer.readUint8());
        }
        for (var j = 0; j < attributeMap.length; j++) {
          var attribute = attributeMap[j];
          var flagIndex = Math.floor(j / 8);
          var bitIndex = j % 8;
          var count = void 0;
          var v = [];
          if (this.updatedEntityFlags[flagIndex] & (1 << bitIndex)) {
            switch (attribute.type) {
              case ATTRIBUTE_TYPE.Uint32:
                player[attribute.name] = buffer.readUint32();
                break;
              case ATTRIBUTE_TYPE.Int32:
                player[attribute.name] = buffer.readInt32();
                break;
              case ATTRIBUTE_TYPE.Float:
                player[attribute.name] = buffer.readInt32() / 100.0;
                break;
              case ATTRIBUTE_TYPE.String:
                player[attribute.name] = this.safeReadVString(buffer);
                break;
              case ATTRIBUTE_TYPE.Vector2:
                var x = buffer.readInt32() / 100.0;
                var y = buffer.readInt32() / 100.0;
                player[attribute.name] = {
                  x: x,
                  y: y
                };
                break;
              case ATTRIBUTE_TYPE.ArrayVector2:
                count = buffer.readInt32();
                v = [];
                for (var i = 0; i < count; i++) {
                  var x_1 = buffer.readInt32() / 100.0;
                  var y_1 = buffer.readInt32() / 100.0;
                  v.push({
                    x: x_1,
                    y: y_1
                  });
                }
                player[attribute.name] = v;
                break;
              case ATTRIBUTE_TYPE.ArrayUint32:
                count = buffer.readInt32();
                v = [];
                for (var i = 0; i < count; i++) {
                  var element = buffer.readInt32();
                  v.push(element);
                }
                player[attribute.name] = v;
                break;
              case ATTRIBUTE_TYPE.Uint16:
                player[attribute.name] = buffer.readUint16();
                break;
              case ATTRIBUTE_TYPE.Uint8:
                player[attribute.name] = buffer.readUint8();
                break;
              case ATTRIBUTE_TYPE.Int16:
                player[attribute.name] = buffer.readInt16();
                break;
              case ATTRIBUTE_TYPE.Int8:
                player[attribute.name] = buffer.readInt8();
                break;
              case ATTRIBUTE_TYPE.Uint64:
                player[attribute.name] = buffer.readUint32() + buffer.readUint32() * 4294967296;
                break;
              case ATTRIBUTE_TYPE.Int64:
                var s64 = buffer.readUint32();
                var s642 = buffer.readInt32();
                if (s642 < 0) {
                  s64 *= -1;
                }
                s64 += s642 * 4294967296;
                player[attribute.name] = s64;
                break;
              case ATTRIBUTE_TYPE.Double:
                var s64d = buffer.readUint32();
                var s64d2 = buffer.readInt32();
                if (s64d2 < 0) {
                  s64d *= -1;
                }
                s64d += s64d2 * 4294967296;
                s64d = s64d / 100.0;
                player[attribute.name] = s64d;
                break;
              default:
                throw new Error('Unsupported attribute type: ' + attribute.type);
            }
          }
        }
        entityUpdateData.entities[player.uid] = player;
      }
    }
    for (var uid in entityUpdateData.entities) {
      if (entityUpdateData.entities[uid] === true) continue;
      if (!(uid in this.entities)) this.entities[uid] = entityUpdateData.entities[uid];
    };
    for (var uid in this.entities) {
      if (!(uid in entityUpdateData.entities)) delete this.entities[uid];
    }
    entityUpdateData.byteSize = buffer.capacity();
    return entityUpdateData;
  }

  decodePing() {
    return {};
  }

  encodeRpc(buffer, packet) {
    if (!(packet.name in this.rpcMapsByName)) return console.error(`RPC not in map: ${packet.name}`);

    const rpc = this.rpcMapsByName[packet.name];
    buffer.writeUint32(rpc.index);

    for (const parameter of rpc.parameters) {
      const _0x539cc1 = packet[parameter.name];
      switch (parameter.type) {
        case e_ParameterType.Float:
          buffer.writeInt32(Math.floor(100 * _0x539cc1));
          break;
        case e_ParameterType.Int32:
          buffer.writeInt32(_0x539cc1);
          break;
        case e_ParameterType.String:
          buffer.writeVString(_0x539cc1);
          break;
        case e_ParameterType.Uint32:
          buffer.writeUint32(_0x539cc1);
      }
    }
  }

  decodeRpcObject(buffer, parameters) {
    const decodedObject = {};

    for (let parameter of parameters) {
      switch (parameter.type) {
        case e_ParameterType.Uint32:
          decodedObject[parameter.name] = buffer.readUint32();
          break;
        case e_ParameterType.Int32:
          decodedObject[parameter.name] = buffer.readInt32();
          break;
        case e_ParameterType.Float:
          decodedObject[parameter.name] = buffer.readInt32() / 100.0;
          break;
        case e_ParameterType.String:
          decodedObject[parameter.name] = this.safeReadVString(buffer);
          break;
        case e_ParameterType.Uint64:
          decodedObject[parameter.name] = buffer.readUint32() + 4294967296 * buffer.readUint32();
      }
    }
    return decodedObject;
  }

  decodeRpc(buffer) {
    const rpcIndex = buffer.readUint32();
    const rpcInMap = this.rpcMaps[rpcIndex];

    const rpc = {
      name: rpcInMap.name,
      response: null
    };

    if (rpcInMap.isArray) {
      const _0x565f3a = [];
      const _0x37944e = buffer.readUint16();

      for (let i = 0; i < _0x37944e; i++)
        _0x565f3a.push(this.decodeRpcObject(buffer, rpcInMap.parameters));

      rpc.response = _0x565f3a;
    } else rpc.response = this.decodeRpcObject(buffer, rpcInMap.parameters);

    return rpc;
  }

  encodeEnterWorld(buffer, params) {
    buffer.writeVString(params.displayName);
    const extra = new Uint8Array(params.extra);

    for (let i = 0x0; i < params.extra.byteLength; i++)
      buffer.writeUint8(extra[i]);
  }

  encodeEnterWorld2(buffer) {
    const BlendField = this.wasm._MakeBlendField(187, 22);

    for (let i = 0; i < 16; i++)
      buffer.writeUint8(this.wasm.HEAPU8[BlendField + i]);
  }

  encodeInput(buffer, input) {
    return buffer.writeVString(JSON.stringify(input));
  }

  encodePing(buffer) {
    return buffer.writeUint8(0);
  }
}

module.exports = { Codec };