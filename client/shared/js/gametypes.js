/* global bootKind, _, exports, module, Types */

EventType = {
  KILLMOB: 1,
  LOOTITEM: 2,
  KILLPLAYER: 3,
  DAMAGE: 4,
  USE_NODE: 5,
  HARVEST: 6
};

QuestType = {
  KILLMOBKIND: 1,
  GETITEMKIND: 2,
  KILLMOBS: 3,
  HIDEANDSEEK: 4,
  USENODE: 5
};

QuestStatus = {
  STARTED: 0,
  INPROGRESS: 1,
  COMPLETE: 2
};

InventoryMode = {
  MODE_NORMAL: 0,
  MODE_SELL: 1,
  MODE_REPAIR: 2,
  MODE_ENCHANT: 3,
  MODE_BANK: 4,
  MODE_AUCTION: 5
};

SkillEffects = {
  SkillType: {
    SELF: 0,
    TARGET: 1,
    ATTACK: 2
  },
  TargetType: {
    SELF: 0,
    ENEMY: 1,
    PLAYER_AOE: 2,
    ENEMY_AOE: 3
  },
  EffectStat: {
    HP: 0,
    EP: 1,
    ATTACK: 2,
    DEFENSE: 3,
    DAMAGE: 4,
    FREEZE: 5,
    MOVESPEED: 6
  }
};

Types = {
    Messages: {
      //BI_HEARTBEAT: 0,
      BI_SYNCTIME: 100,

      CS_CREATE_USER: 1,
      CS_LOGIN_USER: 2,
      CS_CREATE_PLAYER: 3,
      CS_LOGIN_PLAYER: 4,
      CS_REMOVE_USER: 5,
      //CS_ZONE: 10,
      CS_ITEMSLOT: 10,
      CS_APPEARANCEUNLOCK: 11,
      CS_ATTACK: 12,
      CS_AUCTIONBUY: 13,
      CS_AUCTIONDELETE: 14,
      CS_AUCTIONOPEN: 15,
      CS_AUCTIONSELL: 16,
      CS_BANKRETRIEVE: 17,
      CS_BANKSTORE: 18,
      CS_CHAT: 19,
      CS_COLOR_TINT: 20,
      BI_BLOCK_MODIFY: 21,
      CS_GOLD: 22,
      CS_PARTY: 23,
      BI_HARVEST: 24,
      CS_USE_NODE: 25,
      CS_LOADLOOKS: 26,
      CS_LOOKUPDATE: 27,
      CS_LOOT: 28,
      CS_MOVE: 29,
      CS_MOVEPATH: 30,
      CS_PLAYER_REVIVE: 31,
      CS_QUEST: 32,
      //CS_ACHIEVEMENT: 33,
      BI_SEND_BANK: 34,
      BI_SEND_INVENTORY: 35,
      CS_STATADD: 36,
      CS_STOREBUY: 37,
      CS_STOREENCHANT: 38,
      CS_STOREREPAIR: 39,
      CS_STORESELL: 40,
      CS_TALKTONPC: 41,
      CS_CRAFT: 42,
      CS_TELEPORT_MAP: 43,
      CS_WHO: 44,
      CS_SKILL: 45,
      CS_SKILLINSTALL: 46,

      SC_ERROR: 60,
      SC_WORLDS: 61,
      SC_VERSION: 62,
      SC_PLAYER_SUM: 63,
      SC_PLAYER: 64,
      SC_ACHIEVEMENT: 65,
      SC_AUCTIONOPEN: 66,
      SC_ITEMSLOT: 67,
      SC_CHANGEPOINTS: 68,
      SC_CHAT: 69,
      SC_COLOR_TINT: 70,
      SC_DAMAGE: 71,
      SC_DESPAWN: 72,
      SC_SWAPSPRITE: 73,
      SC_APPEARANCE: 74,
      SC_GOLD: 75,
      SC_PARTY: 76,
      BI_PLAYERINFO: 77,
      SC_ITEMLEVELUP: 78,
      SC_KILL: 79,
      SC_LEVELUP: 80,
      SC_LIST: 81,
      SC_LOOKS: 82,
      SC_LOG: 83,
      //SC_LOOKUPDATE: 84,
      SC_MOVE: 85,
      SC_MOVEPATH: 86,
      SC_NOTIFY: 87,
      SC_QUEST: 88,
      SC_SKILLEFFECTS: 89,
      SC_SKILLLOAD: 90,
      SC_SPAWN: 91,
      SC_SPEECH: 92,
      SC_STATINFO: 93,
      SC_TELEPORT_MAP: 94,
      SC_SKILL_XP: 95,
      SC_DIALOGUE: 96,
      SC_SET_SPRITE: 97,
      SC_SET_ANIMATION: 98,

      //SC_SEND_INVENTORY: 97,

    },

    Orientations: {
        NONE: 0,
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4
    },

    EntityTypes: {
      NONE: 0,
      PLAYER: 1,
      MOB: 2,
      ITEM: 3,
      ITEMLOOT: 4,
      NPCSTATIC: 5,
      NPCMOVE: 6,
      CHEST: 7,
      BLOCK: 8,
      TRAP: 9,
      NODE: 10,
    },

    Keys: {
        ENTER: 13,
        UP: 38,
        DOWN: 40,
        LEFT: 37,
        RIGHT: 39,
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        SPACE: 32,
        I: 73,
        H: 72,
        M: 77,
        P: 80,
        T: 84,
        Y: 89,
        KEYPAD_4: 100,
        KEYPAD_6: 102,
        KEYPAD_8: 104,
        KEYPAD_2: 98,
        KEY_0: 48,
        KEY_1: 49,
        KEY_2: 50,
        KEY_3: 51,
        KEY_4: 52,
        KEY_5: 53,
        KEY_6: 54,
        KEY_7: 55,
        KEY_8: 56,
        KEY_9: 57
    },

    Skills: {
      BLOODSUCKING: 1,
      RECOVERHEALTH: 2,
      HEALANDHEAL: 3,
      AVOIDATTACK: 4,
      ADDEXPERIENCE: 5,
      ATTACKWITHBLOOD: 6,
      CRITICALATTACK: 7,
      CRITICALRATIO: 8
    },

    PlayerClass: {
      FIGHTER: 0,
      ARCHER: 1,
      DEFENDER: 2,
      MAGE: 3
    },

    PlayerState: {
    	Roaming: 0,
    	Moving: 1,
    	Following: 2,
    	Aggro: 3,
    	Hurting: 4,
    	GettingItems: 5,
    	FollowPlayer: 6,
    },
};

var EntityTypes = Types.EntityTypes;

Types.expForLevel = [];
Types.defenseExp = [];
Types.attackExp = [];
Types.moveExp = [];
Types.skillExp = [];
Types.weaponExp = [];

Types.expForLevel[0] = 0;
Types.defenseExp[0] = 0;
Types.attackExp[0] = 0;
Types.moveExp[0] = 0;
Types.skillExp[0] = 0;
Types.weaponExp[0] = 0;

for(i=1; i < 50; i++){
    var points = Math.floor((i * 300) * Math.pow(1.5, i / 5.));
    console.info("level_"+i+"="+points);
    Types.expForLevel[i] = points;
    Types.defenseExp[i] = (points * 10)+50;
    Types.attackExp[i] = (points * 10)+50;
    Types.moveExp[i] = (points * 5)+20;
    Types.skillExp[i] = ~~(points / 1.5);
    Types.weaponExp[i] = (points * 10)+50;
};


Types.getLevel = function(exp){
    if (typeof(exp)=='undefined' || exp==0) return 1;
    for(var i=1; i < 200; i++){
        if(exp < Types.expForLevel[i]){
            return i;
        }
    }
    return 50;
};

Types.getAttackLevel = function(exp){
    if (exp==0) return 1;
    for(var i=1; i < 200; i++){
        if(exp < Types.attackExp[i]){
            return i;
        }
    }
    return 50;
};

Types.getDefenseLevel = function(exp){
    if (exp==0) return 1;
    for(var i=1; i < 200; i++){
        if(exp < Types.defenseExp[i]){
            return i;
        }
    }
    return 50;
};

Types.getMoveLevel = function(exp){
    if (exp==0) return 1;
    for(var i=1; i < 200; i++){
        if(exp < Types.moveExp[i]){
            return i;
        }
    }
    return 50;
};

Types.getWeaponLevel = function(exp){
    if (exp==0) return 1;
    for(var i=1; i < 200; i++){
        if(exp < Types.weaponExp[i]){
            return i;
        }
    }
    return 50;
};

Types.getSkillLevel = function(exp, level) {
    level = level || 1;
    if (typeof(exp)=='undefined' || exp==0) return 1;
    for(var i=level; i < 20; i++){
        if(exp < Types.skillExp[i]){
            return i;
        }
    }
    return 20;
};

Types.isPlayer = function(kind) {
	if (kind === 1 || kind === 222)
		return true;
	return false;
};

Types.getOrientationAsString = function(orientation) {
    switch(orientation) {
        case Types.Orientations.LEFT: return "left"; break;
        case Types.Orientations.RIGHT: return "right"; break;
        case Types.Orientations.UP: return "up"; break;
        case Types.Orientations.DOWN: return "down"; break;
    }
};

Types.getMessageTypeAsString = function(type) {
    var typeName;
    _.each(Types.Messages, function(value, name) {
        if(value === type) {
            typeName = name;
        }
    });
    if(!typeName) {
        typeName = "UNKNOWN";
    }
    return typeName;
};


if(!(typeof exports === 'undefined')) {
    module.exports = Types;
}
