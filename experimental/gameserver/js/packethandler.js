var cls = require("./lib/class"),
  _ = require("underscore"),
  Character = require('./entity/character'),
  Chest = require('./entity/chest'),
  Mob = require('./entity/mob'),
  Node = require('./entity/node'),
  Messages = require("./message"),
  Utils = require("./utils"),
  MobData = require("./data/mobdata"),
  Formulas = require("./formulas"),
  formatCheck = require("./format").check,
  Party = require("./party"),
  ItemData = require("./data/itemdata"),
  Bank = require("./bank"),
  Types = require("../shared/js/gametypes"),
  ItemTypes = require("../shared/js/itemtypes"),
  bcrypt = require('bcrypt'),
  Inventory = require("./inventory"),
  //NpcPlayer = require('./npcplayer'),
  SkillHandler = require("./skillhandler"),
  //Variations = require('./variations'),
  Trade = require('./trade'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express(),
  Quests = require('./data/questdata'),
  //request = require("request"),
  SkillData = require("./data/skilldata"),
  EntitySpawn = require("./entityspawn"),
  AppearanceData = require('./data/appearancedata'),
  TaskHandler = require("./taskhandler");

module.exports = PacketHandler = Class.extend({
  init: function(user, player, connection, worldServer, map) {
    this.user = user;
    this.player = player;
    this.connection = connection;
    this.server = worldServer;
    this.map = player.map;
    this.entities = player.map.entities;
    //this.loadedPlayer = false;
    //this.formatChecker = new FormatChecker();

    var self = this;

    //this.connection.off('msg', this.player.user.listener);
    this.connection.listen(function(message) {
      console.info("recv="+JSON.stringify(message));
      var action = parseInt(message[0]);

      if (action)
      if(!formatCheck(message)) {
          self.connection.close("Invalid "+Types.getMessageTypeAsString(action)+" message format: "+message);
          return;
      }
      message.shift();

      self.user.lastPacketTime = Date.now();

      /*switch (action) {
        case Types.UserMessages.UW_LOAD_USER_INFO:
          self.handleLoadUserInfo(message);
          return;
        case Types.UserMessages.UW_LOAD_PLAYER_INFO:
          self.handleLoadPlayerInfo(message);
          return;
        case Types.UserMessages.UW_LOAD_PLAYER_QUESTS:
          self.handleLoadPlayerQuests(message);
          return;
        case Types.UserMessages.UW_LOAD_PLAYER_ACHIEVEMENTS:
          self.handleLoadPlayerAchievements(message);
          return;
        case Types.UserMessages.UW_LOAD_PLAYER_ITEMS:
          self.handleLoadPlayerItems(message);
          return;
      }*/

      switch (action) {
        case Types.Messages.CW_REQUEST:
          self.handleRequest(message);
          break;

        case Types.Messages.CW_WHO:
          //console.info("Who: " + self.player.name);
          //console.info("list: " + message);
          self.handleWho(message);
          break;

        case Types.Messages.CW_CHAT:
          self.handleChat(message);
          break;

        case Types.Messages.CW_MOVE:
          self.handleMoveEntity(message);
          break;

        case Types.Messages.CW_MOVEPATH:
          self.handleMovePath(message);
          break;

        case Types.Messages.CW_ATTACK:
          //console.info("Player: " + self.player.name + " hit: " + message[1]);
          self.handleAttack(message);
          break;

        case Types.Messages.CW_ITEMSLOT:
          self.handleItemSlot(message);
          break;

        case Types.Messages.CW_STORESELL:
          //console.info("Player: " + self.player.name + " store sell: " + message[1]);
          self.handleStoreSell(message);
          break;
        case Types.Messages.CW_STOREBUY:
          //console.info("Player: " + self.player.name + " store buy: " + message[1] + " " + message[2] + " " + message[3]);
          self.handleStoreBuy(message);
          break;
        case Types.Messages.CW_CRAFT:
          //console.info("Player: " + self.player.name + " store buy: " + message[1] + " " + message[2] + " " + message[3]);
          self.handleCraft(message);
          break;
        case Types.Messages.CW_APPEARANCEUNLOCK:
          self.handleAppearanceUnlock(message);
          break;
        case Types.Messages.CW_LOOKUPDATE:
          self.handleLookUpdate(message);
          break;
        case Types.Messages.CW_AUCTIONSELL:
          //console.info("Player: " + self.player.name + " auction sell: " + message[0]);
          self.handleAuctionSell(message);
          break;

        case Types.Messages.CW_AUCTIONBUY:
          //console.info("Player: " + self.player.name + " auction buy: " + message[0]);
          self.handleAuctionBuy(message);
          break;

        case Types.Messages.CW_AUCTIONOPEN:
          //console.info("Player: " + self.player.name + " auction open: " + message[0]);
          self.handleAuctionOpen(message);
          break;

        case Types.Messages.CW_AUCTIONDELETE:
          //console.info("Player: " + self.player.name + " auction delete: " + message[0]);
          self.handleAuctionDelete(message);
          break;

        case Types.Messages.CW_STORE_MODITEM:
          //console.info("Player: " + self.player.name + " store enchant: " + message[0]);
          self.handleStoreModItem(message);
          break;

// TODO - Fix CHaracter Info
        case Types.Messages.CW_CHARACTERINFO:
          //console.info("Player character info: " + self.player.name);
          self.entities.pushToPlayer(self.player, new Messages.CharacterInfo(self.player));
          break;

        case Types.Messages.CW_TELEPORT_MAP:
          self.handleTeleportMap(message);
          break;
        case Types.Messages.CW_LOOT:
          self.handleLoot(message);
          break;
        case Types.Messages.CW_TALKTONPC:
          self.handleTalkToNPC(message);
          break;
        case Types.Messages.CW_QUEST:
          self.handleQuest(message);
          break;
        case Types.Messages.CW_GOLD:
          self.handleGold(message);
          break;
        case Types.Messages.CW_STATADD:
          self.handleStatAdd(message);
          break;
        case Types.Messages.CW_SKILL:
          self.handleSkill(message);
          break;
        case Types.Messages.CW_SHORTCUT:
          self.handleShortcut(message);
          break;
        case Types.Messages.CW_BLOCK_MODIFY:
          self.handleBlock(message);
          break;

        case Types.Messages.CW_PARTY:
          self.handleParty(message);
          break;

        case Types.Messages.CW_HARVEST:
          self.handleHarvest(message);
          break;

        case Types.Messages.CW_USE_NODE:
          self.handleUseNode(message);
          break;

        default:
          if (self.message_callback)
            self.player.message_callback(message);
          break;
      }
    });

    this.connection.onClose(function() {
      console.info("Player: " + self.player.name + " has exited the world.");
      //if (self.player.user.loadedPlayer)
      self.player.save();

      //if (players[self.player.name])
        //players[self.player.name] = 0;

      //if (users[self.player.user.name])
        //users[self.player.user.name] = 0;

      if (self.player && self.entities) {
        console.info("deleting player connection");
        self.entities.removePlayer(self.player);
      }

      delete self.player;

      //self.user.onClose(true);

      console.info("onClose - called");
      clearTimeout(this.disconnectTimeout);
      if (this.exit_callback) {
        this.exit_callback();
      }
      this.close("onClose");

    });

  },

  setMap: function (map) {
      this.map = map;
      this.entities = map.entities;
  },

  timeout: function() {
    this.connection.sendUTF8("timeout");
    this.connection.close("Player was idle for too long");
  },

  broadcast: function(message, ignoreSelf) {
    if (this.broadcast_callback) {
      this.broadcast_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
    }
  },

  broadcastToZone: function(message, ignoreSelf) {
    if (this.broadcastzone_callback) {
      this.broadcastzone_callback(message, ignoreSelf === undefined ? true : ignoreSelf);
    }
  },

  sendPlayer: function (message) {
    this.entities.pushToPlayer(this.player, message);
  },

  onExit: function(callback) {
    this.exit_callback = callback;
    /*try {
    throw new Error()
    }
    catch (e) { console.info(e.stack); }*/
  },

  onMove: function(callback) {
    this.move_callback = callback;
  },

  //onZone: function(callback) {
    //this.zone_callback = callback;
  //},

  onMessage: function(callback) {
    this.message_callback = callback;
  },

  onBroadcast: function(callback) {
    this.broadcast_callback = callback;
  },

  //onBroadcastToZone: function(callback) {
    //this.broadcastzone_callback = callback;
  //},

  /*handleHeartbeat: function () {
      var self = this;
      if (typeof heartbeatTimeout !== "undefined")
        clearTimeout(heartbeatTimeout);
      heartbeatTimeout = setTimeout(function () {
        self.timeout();
      },35000);
  },*/

  sendToPlayer: function (player, message) {
    this.map.entities.pushToPlayer(player, message);
  },

  send: function(message) {
    this.connection.send(message);
  },

  handleChat: function(message) {
    var self = this;
    var msg = Utils.sanitize(message[0]);
    console.info("Chat: " + self.player.name + ": " + msg);

    if ((new Date()).getTime() > self.player.chatBanEndTime) {
      self.send([Types.Messages.WC_NOTIFY, "CHAT", "CHATMUTED"]);
      return;
    }

    if (msg && (msg !== "" || msg !== " ")) {
      msg = msg.substr(0, 256); //Will have to change the max length
      var command = msg.split(" ", 3)
      switch (command[0]) {
        case "/w":
          self.send([Types.Messages.WC_NOTIFY, "CHAT", "CHATMUTED"]);
          break;
        default:
          self.server.pushWorld(new Messages.Chat(self.player, msg));
          break;

      }
    }
  },

  handleQuest: function (msg) {
    console.info("handleQuest");
    var npcId = parseInt(msg[0]);
    var questId = parseInt(msg[1]);
    var status = parseInt(msg[2]);

    npc = this.entities.getEntityById(npcId);
    if (!this.player.isInScreen(npc)) {
      console.info("player not close enough to NPC!");
      return;
    }

    if (status == 1)
      npc.acceptQuest(this.player, questId);
    else {
      npc.rejectQuest(this.player, questId);
    }
  },

  handleTalkToNPC: function(message) { // 30
    console.info("handleTalkToNPC");
    var type = parseInt(message[0]);
    var npcId = parseInt(message[1]);

    npc = this.entities.getEntityById(npcId);
    if (!npc.isNextTooEntity(this.player)) {
      console.info("player not close enough to NPC!");
      return;
    }

    if (npc)
      npc.talk(this.player);
  },

  handleStoreSell: function(message) {
    var type = parseInt(message[0]);
    var itemIndex = parseInt(message[1]);

    var item = this.player.itemStore[0].rooms[itemIndex];
    if (!item)
      return;

    this.player.tut.buy = true;
    this.player.tut.buy2 = true;

    var kind = item.itemKind;
    if (ItemTypes.isConsumableItem(kind) || ItemTypes.isLootItem(kind))
      return;

    var price = ItemTypes.getEnchantSellPrice(item);
    if (price < 0)
      return;

    var itemKind = item.itemKind;
    //gold = this.player.gold[0];
    this.player.inventory.makeEmptyItem(itemIndex);
    this.player.modifyGold(price);
    var itemName = ItemTypes.KindData[itemKind].name;
    this.sendPlayer(new Messages.Notify("SHOP","SHOP_SOLD", [itemName]));
  },

// TODO - Revise beloww!!!!!!!!!!!!!!
  handleAuctionSell: function(message) {
    var itemIndex = parseInt(message[0]),
        price = parseInt(message[1]);
    if (price < 0 || itemIndex < 0 || itemIndex >= this.player.inventory.maxNumber)
      return;

    var item = this.player.inventory.rooms[itemIndex];
    console.info(JSON.stringify(item));

    var kind = item.itemKind;
    if (ItemTypes.isConsumableItem(kind) || ItemTypes.isLootItem(kind))
      return;

    if (kind) {
      this.server.auction.add(this.player, item, price, itemIndex);
      this.server.auction.list(this.player, 0);
      this.player.inventory.setItem(itemIndex, null);
    }
  },

  handleAuctionOpen: function(message) {
    var type = parseInt(message[0]);
    if (type >= 0 && type <= 3)
      this.server.auction.list(this.player, type);
  },

  handleAuctionBuy: function(message) {
    var auctionIndex = parseInt(message[0]),
        type = parseInt(message[1]);
    if (auctionIndex < 0 || auctionIndex >= this.server.auction.auctions.length)
      return;
    if (type < 0 || type > 3)
      return;

    var auction = this.server.auction.auctions[auctionIndex];
    if (!auction)
      return;
    if (auction.playerName == this.player.name)
      return;

    var price = auction.price;
    if (price < 0)
      return;

    var goldCount = self.player.gold[0];

    if (goldCount < price) {
      this.sendPlayer(new Messages.Notify("SHOP","SHOP_NOGOLD"));
      return;
    }

    if (!this.player.inventory.hasRoom()) {
      this.sendPlayer(new Messages.Notify("SHOP","SHOP_NOSPACE"));
      return;
    }

    var itemKind = auction.item.itemKind;
    this.player.inventory.putItem(auction.item);
    this.player.modifyGold(-price);
    var itemName = ItemTypes.KindData[itemKind].name;
    this.sendPlayer(new Messages.Notify("SHOP","SHOP_SOLD", [itemName]));

    var auctionPlayer = this.server.getPlayerByName(auction.playerName);
    if (auctionPlayer)
      auctionPlayer.modifyGold(price);
    else
      databaseHandler.modifyGold(auction.playerName, price);

    this.server.auction.remove(auctionIndex);
    this.server.auction.list(this.player, type);
  },

  handleAuctionDelete: function(message) {
    var auctionIndex = parseInt(message[0]),
        type = parseInt(message[1]);
    if (auctionIndex < 0 || auctionIndex >= this.server.auction.auctions.length)
      return;
    if (type < 0 || type > 3)
      return;

    var auction = this.server.auction.auctions[auctionIndex];
    if (!auction)
      return;

    if (!this.player.inventory.hasRoom()) {
      this.sendPlayer(new Messages.Notify("SHOP", "SHOP_NOSPACE"));
      return;
    }

    var itemKind = auction.item.itemKind;
    this.player.inventory.putItem(auction.item);
    var itemName = ItemTypes.KindData[itemKind].name;
    this.sendPlayer(new Messages.Notify("SHOP","SHOP_REMOVED", [itemName]));
    this.server.auction.remove(auctionIndex);
    this.server.auction.list(this.player, type);
  },

  handleStoreModItem: function (msg) {
      var modType = parseInt(msg[0]),
          type = parseInt(msg[1]),
          itemIndex = parseInt(msg[2]);

      //console.info("type=" + type + ",invNumber=" + inventoryNumber1);
      if (type == 0 || type == 2) {
        var itemStore = this.player.itemStore[type];
        if (itemIndex < 0 && itemIndex >= itemStore.maxNumber)
          return;
        var item = this.player.itemStore[type].rooms[itemIndex];
        //console.info("item=" + JSON.stringify(item));
        if (modType == 0)
          this._repairItem(type, item, itemIndex);
        if (modType == 1)
          this._enchantItem(type, item, itemIndex);
      }
  },

  _repairItem: function(type, item, index) {
    var itemKind = null,
      price = 0;

    if (!(item && item.itemKind))
      return;

    if (!ItemTypes.isEquipment(item.itemKind))
      return;

    if (item.itemDurability == item.itemDurabilityMax)
      return;

    price = ~~(ItemTypes.getRepairPrice(item));
    if (price <= 0)
      return;

    goldCount = this.player.gold[0];
    //console.info("goldCount="+goldCount+",price="+price);
    if (goldCount < price) {
      this.sendPlayer(new Messages.Notify("SHOP","SHOP_NOGOLD"));
      return;
    }

    item.itemDurabilityMax -= 50;
    item.itemDurability = item.itemDurabilityMax;
    if (item.itemDurabilityMax <= 0) {
      item = null;
      this.player.itemStore[type].makeEmptyItem(index);
    } else {
      console.info("itemNumber=" + item.itemNumber);
      this.player.modifyGold(-price);
    }
    item.slot = index;

    this.sendPlayer(new Messages.ItemSlot(type, [item]));
    var itemName = ItemTypes.KindData[item.itemKind].name;
    this.sendPlayer(new Messages.Notify("SHOP","SHOP_REPAIRED", [itemName]));
  },

  _enchantItem: function(type, item, index) {
    var itemKind = null,
      price = 0;

    if (!(item && item.itemKind))
      return;

    if (!ItemTypes.isEquipment(item.itemKind))
      return;

    price = ItemTypes.getEnchantPrice(item);
    if (price <= 0)
      return;

    goldCount = this.player.gold[0];
    //console.info("goldCount="+goldCount+",price="+price);
    if (goldCount < price) {
      this.sendPlayer(new Messages.Notify("SHOP", "SHOP_NOGOLD"));
      return;
    }

    item.itemExperience = ItemTypes.itemExpForLevel[item.itemNumber - 1];
    item.itemNumber++;

    item.slot = index;

    this.sendPlayer(new Messages.ItemSlot(type, [item]));
    console.info("itemNumber=" + item.itemNumber);
    this.player.modifyGold(-price);
    var itemName = ItemTypes.KindData[item.itemKind].name;
    this.sendPlayer(new Messages.Notify("SHOP", "SHOP_ENCHANTED", [itemName]));

  },

  handleBankStore: function(message) {
    var itemIndex = parseInt(message[0]);

    var p = this.player;
    if (itemIndex >= 0 && itemIndex < p.inventory.maxNumber) {
      var item = p.inventory.rooms[itemIndex];
      //console.info("bankitem: " + JSON.stringify(item));
      if (item && item.itemKind) {
        var slot = p.bank.getEmptyIndex();
        //console.info("slot=" + slot);
        if (slot >= 0) {
          p.bank.putItem(item);
          p.inventory.takeOutItems(itemIndex, item.itemNumber);
        }
      }
    }
  },

  handleBankRetrieve: function(message) {
    var bankIndex = parseInt(message[0]);

    var p = this.player;
    if (bankIndex >= 0 && bankIndex < p.bank.maxNumber) {
      var item = p.bank.rooms[bankIndex];
      if (item && item.itemKind) {
        var slot = p.inventory.getEmptyIndex();
        if (slot >= 0) {
          p.inventory.putItem(item);
          p.bank.takeOutItems(bankIndex, item.itemNumber);
        }
      }
    }
    this.sendPlayer(new Messages.Gold(p));
  },

  handleStoreBuy: function(message) {
    var itemType = parseInt(message[0]),
      itemKind = parseInt(message[1]),
      itemCount = parseInt(message[2]),
      itemName = null,
      price = 0,
      goldCount = 0,
      buyCount = 0;

    if (!itemKind || itemCount <= 0) {
      return;
    }

    if (itemKind < 0 || itemKind >= ItemTypes.KindData.length)
      return;

    //console.info("itemKind="+itemKind);
    //console.info(JSON.stringify(ItemTypes));
    var itemData = ItemTypes.KindData[itemKind];

    var itemName = itemData.name;
    price = ItemTypes.getBuyPrice(itemKind);
    if (price > 0) {
      if (ItemTypes.Store.isBuyMultiple(itemKind)) {
        itemCount = itemData.buycount;
      }
      goldCount = this.player.gold[0];
      //console.info("goldCount="+goldCount);
      //console.info("itemCount="+itemCount);

      if (goldCount < price) {
        this.sendPlayer(new Messages.Notify("SHOP","SHOP_NOGOLD"));
        return;
      }

      var consume = ItemTypes.isConsumableItem(itemKind);
      if (consume || (!consume && this.player.inventory.hasRoom())) {
        var item = new ItemRoom(itemKind, itemCount, 0, 0);
        var res = this.player.inventory.putItem(item);
        if (res == -1)
          return;
        this.player.modifyGold(-price);
        this.sendPlayer(new Messages.Notify("SHOP", "SHOP_BUY", [itemName]));
        /*if (!this.player.tut.equip) {
          this.player.tutChat("TUTORIAL_EQUIP", 10, "equip");
        }*/
      } else {
        this.sendPlayer(new Messages.Notify("SHOP", "SHOP_NOSPACE"));
      }
    }

  },

  handleCraft: function(message) {
    var craftId = parseInt(message[0]),
      itemCount = parseInt(message[1]),
      itemName = null,
      price = 0,
      goldCount = 0,
      buyCount = 0;

    if (itemCount <= 0) {
      return;
    }

    if (craftId < 0 || craftId >= ItemData.CraftData.length)
      return;

    var craftData = ItemData.CraftData[craftId];

    var itemKind = craftData.o;

    //console.info("itemKind="+itemKind);
    //console.info(JSON.stringify(ItemTypes));
    if (!ItemTypes.KindData.hasOwnProperty(itemKind))
    {
      console.error("handleCraft - itemData not found for kind: "+itemKind);
      return;
    }

    var itemData = ItemTypes.KindData[itemKind];

    var itemName = itemData.name;
    price = ItemTypes.getCraftPrice(itemKind);
    if (price < 0)
      return;

    if (ItemTypes.Store.isBuyMultiple(itemKind)) {
      itemCount = (itemCount < itemData.buycount) ? itemCount : itemData.buycount;
    } else {
      itemCount = 1;
    }

    price = price * itemCount;

    goldCount = this.player.gold[0];
    //console.info("goldCount="+goldCount);
    //console.info("itemCount="+itemCount);

    if (goldCount < price) {
      this.sendPlayer(new Messages.Notify("SHOP","SHOP_NOGOLD"));
      return;
    }

    if (itemData.craft.length == 0)
      return;

    for (var it of craftData.i)
    {
        if (!this.player.inventory.hasItems(it[0],it[1]*itemCount)) {
          this.sendPlayer(new Messages.Notify("SHOP", "SHOP_NOCRAFTITEMS"));
          return;
        }
    }

    if (!this.player.inventory.hasRoom())
    {
      this.sendPlayer(new Messages.Notify("SHOP", "SHOP_NOSPACE"));
      return;
    }

    this.player.modifyGold(-price);
    for (var it of craftData.i)
    {
        this.player.inventory.removeItemKind(it[0],it[1]*itemCount);
    }

    var durability = 0;
    if (ItemTypes.isWeapon() || ItemTypes.isArmor())
      durability = 900;

    var item = new ItemRoom(itemKind, itemCount, durability, durability);
    if (this.player.inventory.putItem(item) == -1)
      return;

    this.sendPlayer(new Messages.Notify("SHOP", "SHOP_BUY", [itemName]));
  },

  handleAppearanceUnlock: function(message) {
    var appearanceIndex = parseInt(message[0]);
    var priceClient = parseInt(message[1]);

    if (appearanceIndex < 0 || appearanceIndex >= AppearanceData.Data.length)
      return;

    var itemData = AppearanceData.Data[appearanceIndex];
    if (!itemData)
      return;

    if (!(itemData.type == "armorarcher" || itemData.type == "armor"))
      return;

    var price = this.server.looks.prices[appearanceIndex];
    if (price != priceClient) {
      this.sendPlayer(new Messages.Notify("SHOP", "SHOP_MISMATCH", [itemData.name]));
      this.server.looks.sendLooks(this.player);
      return;
    }

    var gemCount = 0;

    if (appearanceIndex >= 0) {
      gemCount = this.player.user.gems;

      console.info("gemCount=" + gemCount);

      if (gemCount >= price) {
        this.player.user.looks[appearanceIndex] = 1;
        this.player.user.modifyGems(-price);
        this.server.looks.prices[appearanceIndex] += 100;

        this.sendPlayer(new Messages.Notify("SHOP", "SHOP_SOLD", [itemData.name]));
        this.server.looks.sendLooks(this.player);
      } else {
        this.sendPlayer(new Messages.Notify("SHOP", "SHOP_NOGEMS"));
      }
    }
  },

  handleLookUpdate: function(message) {
    var type = parseInt(message[0]),
      id = parseInt(message[1]);

    var p = this.player;
    if (id < 0 || id >= AppearanceData.Data.length)
      return;
    if (type < 0 || type > 1)
      return;

    var itemData = AppearanceData.Data[id];
    if (!itemData)
      return;

    if (!(itemData.type == "armorarcher" || itemData.type == "armor"))
      return;

    var appearance = this.player.user.looks[id];
    if (appearance == 1) {
      if (type == 0) {
        p.setSprite(0, id);
      }
    }

    var s1 = p.getSprite(0);
    var s2 = p.getSprite(1);
    this.broadcast(new Messages.setSprite(p, s1, s2));
  },


// param 1 - action type.
// type 0 eat.
// type 1 equip.
// type 2 move item.
// type 3 drop item.
// type 4 store item.

// param 2 - slot type.
// slot 0 inventory.
// slot 1 equipment.
// slot 2 bank.

// param 3 slot index. (0-48).
// param 4 count of items.

// param 5 - slot type 2.
// param 6 - slot index 2.
// param 7 - count of items 2.

  handleItemSlot: function(message) { // 28
    var self = this;
    var action = parseInt(message[0]);

    if (this.player.isDying || this.player.isDead)
      return;

    // slot type, slot index, slot count.
    var slot = [parseInt(message[1]), parseInt(message[2]), parseInt(message[3])];
    if (slot[0] == 2 && slot[1] > this.player.equipment.maxNumber)
      return;
    var item = null;
    if (slot[1] >= 0)
      item = this.player.getStoredItem(slot[0], slot[1], slot[2]);

    var slot2 = null;
    if (message.length == 6)
    {
      slot2 = [parseInt(message[4]), parseInt(message[5])];
      if (slot[0] == slot2[0] && slot[1] == slot2[1])
        return;
    }
    if (action === 0) {
      this.player.handleInventoryEat(item, slot[1]);
    }
    else if (action === 1) {
      this.player.swapItem(slot, slot2);
    }
    else if (action === 2) { // move item.
      this.player.swapItem(slot, slot2);
    }
    else if (action === 3) { // drop item.
      this.player.handleStoreEmpty(slot, item);
    }
    else if (action === 4) { // store item.
      this.player.swapItem(slot, slot2);
    }

    /*if (slot[0] == 0 || slot2[0] == 0) {
      this.server.taskHandler.processEvent(this.player, PlayerEvent(EventType.LOOTITEM, item, 1));
    }*/
  },

  handleLoot: function(message) {
    console.info("handleLoot");

    item = this.entities.getEntityById(parseInt(message[0]));
    if (!item) {
      console.info("no item.");
      return;
    }

    var x = parseInt(message[1]),
        y = parseInt(message[2]);

    if (!this.player.isNextToo(x,y)) {
      console.info("Player is not close enough to item.")
      return;
    }

    console.info("item="+item.toString());
    if (item.enemyDrop)
      console.info("enemyDrop");

    if (item instanceof Item) {
      if (this.player.inventory.putItem(item.room) >= 0) {
        this.server.taskHandler.processEvent(this.player, PlayerEvent(EventType.LOOTITEM, item, 1));
        this.broadcast(item.despawn(), false);
        this.entities.removeEntity(item);
      }
    }
  },

  handleAttack: function(message) {
    console.info("handleAttack");
    var self = this;
    var time = parseInt(message[0]);
    var p = this.player;
    //console.info("handleAttack, freeze: "+(G_ROUNDTRIP + (time - Date.now())));
    if (p.isDying || p.isDead)
      return;

    //this.player.attackQueue.push(message);
    if (p.movement.inProgress) {
      p.attackQueue.push(message);
    } else {
      setTimeout(function () {
        self.handleHitEntity(p, message);
      }, G_LATENCY);
    }

  },

  processAttack: function () {
    //console.info("processAttack");
    var self = this;

    for (var msg of this.player.attackQueue)
    {
      console.info("processAttack, handle hit");
      //this.handleHitEntity(this.player, msg);
      setTimeout(function () {
        self.handleHitEntity(self.player, msg);
      }, G_LATENCY);
    }
    this.player.attackQueue = [];
  },

  handleHitEntity: function(sEntity, message) { // 8
    console.info("handleHitEntity");
    //var self = this;

    console.info("message: "+JSON.stringify(message));
    var targetId = parseInt(message[1]),
        orientation = parseInt(message[2]),
        skillId = parseInt(message[3]);

    if (targetId < 0) {
      console.warn("invalid targetId");
      return;
    }

    var tEntity = this.entities.getEntityById(targetId);
    if (!tEntity) {
      console.warn("invalid entity");
      return;
    }

    //console.warn("attackDuration: "+(Date.now() - sEntity.attackTimer));
    var attackTime = Date.now() - sEntity.attackTimer;
    if (attackTime < ATTACK_INTERVAL) {
      console.warn("attack interval");
      return;
    }

    // If PvP then both players must be level 20 or higher.
    if (tEntity instanceof Player && sEntity instanceof Player &&
        (sEntity.level.base < 20 || tEntity.level.base < 20 ||
          Math.abs(sEntity.level.base-tEntity.level.base) > 10))
    {
      console.warn("pvp invalid diff");
      return;
    }

    if (tEntity.aiState == mobState.RETURNING)
      return;

    if (tEntity.invincible) {
      this.sendPlayer(new Messages.Notify("CHAT","COMBAT_TARGETINVINCIBLE"));
      console.warn("target invincible");
      return;
    }

// TODO fill sEntity, tEntity.

    //console.info("player.x:"+this.player.x+",this.player.y:"+this.player.y+",mob.x"+mob.x+",mob.y:"+mob.y);
    if (this.map.isColliding(sEntity.x, sEntity.y)) {
      console.warn("char.isColliding("+sEntity.id+","+sEntity.x+","+sEntity.y+")");
      return;
    }

    if (skillId >= 0) {
      this.handleSkill([skillId, targetId, tEntity.x, tEntity.y]);
    }

    sEntity.setOrientation(orientation);
    sEntity.engage(tEntity);

    if (sEntity == this.player) {
      //sEntity.lookAtEntity(tEntity);
      if (!sEntity.canReach(tEntity)) {
        console.info("Player not close enough!");
        console.info("p.x:" + sEntity.x + ",p.y:" + sEntity.y);
        console.info("e.x:" + tEntity.x + ",e.y:" + tEntity.y);
        console.info("dx:"+Math.abs(sEntity.x-tEntity.x)+",dy:"+Math.abs(sEntity.y-tEntity.y));
        return;
      }

      if (!sEntity.attackedTime.isOver()) {
        console.warn("attackedTime is not over.");
        return;
      }

      sEntity.isHarvesting = false;

      sEntity.lastAction = Date.now();
    }

    sEntity.isBlocking = false;

    sEntity.attackedTime.duration = 500;

    //if (tEntity instanceof Mob)
      //this.entities.mobAI.aggroPlayer(tEntity, sEntity);

    //self.server.createAttackLink(mob, sEntity);
    sEntity.hasAttacked = true;

    if (sEntity === this.player && tEntity instanceof Mob) {
      this.player.tut.attack = true;
    }

    if (sEntity instanceof Player && tEntity instanceof Mob) {
      tEntity.mobAI.checkHitAggro(tEntity, sEntity);
    }
    //sEntity.setFreeze(G_ROUNDTRIP);

    if (sEntity.effectHandler) {
      sEntity.effectHandler.interval(3,0);
    }
    var damageObj = this.calcDamage(sEntity, tEntity, null, 0); // no skill
    if (sEntity.effectHandler) {
      sEntity.effectHandler.interval(4, damageObj.damage);
      for (var skillEffect in sEntity.effectHandler.skillEffects)
      {
        for (var target in skillEffect.targets) {
          var damage = target.mod.damage;
          target.mod.damage = 0;
          this.dealDamage(sEntity, target, damage, 0);
        }
      }
    }
    this.dealDamage(sEntity, tEntity, damageObj.damage, damageObj.crit);

    if (sEntity.attackTimer)
      sEntity.attackTimer = Date.now();

    if (sEntity.effectHandler) {
      sEntity.effectHandler.interval(5,0);
    }
  },

  calcDamage: function(sEntity, tEntity, skill, attackType) {
    var damageObj = {
      damage: 0,
      crit: 0,
      dot: 0
    };

    damageObj.damage = Math.round(Formulas.dmg(sEntity, tEntity, Date.now()));
    if (damageObj.damage == 0)
      return damageObj;

    var canCrit = Formulas.crit(sEntity, tEntity);
    if (canCrit) {
      damageObj.damage *= 2;
      damageObj.crit = 1;
    }
    if (sEntity.mod.dr > 0 && !sEntity.hasFullHealth()) {
      var amount = Math.ceil(damageObj.damage * (sEntity.mod.dr / 100));
      sEntity.regenHealthBy(amount);
      if (sEntity instanceof Player)
        this.sendPlayer(sEntity, sEntity.health());
    }

    return damageObj;
  },

// TODO - Fix entity vars.
  dealDamage: function(sEntity, tEntity, dmg, crit) {
    if (!tEntity) return;

    if (tEntity instanceof Mob)
      this.entities.mobAI.aggroPlayer(tEntity, sEntity);

    this.server.handleDamage(tEntity, sEntity, -dmg, crit);
    if (sEntity instanceof Player)
      sEntity.weaponDamage += dmg;

    this.server.handleHurtEntity(tEntity, sEntity);
    console.info("DAMAGE OCCURED "+dmg);
    //console.info("dmg="+dmg);
    if (tEntity instanceof Mob) {
      //this.entities.mobAI.addHate(tEntity, sEntity);

      /*if (sEntity == self.player && tEntity instanceof Mob && tEntity.isDead) {
        self.player.tutChat("TUTATTACK2", 2, "attack2");
      }*/
    } else {
      //tEntity.stats.hp -= dmg;
      if (tEntity.isDead) {
        if (sEntity == self.player)
          self.entities.pushBroadcast(new Messages.Notify("CHAT","COMBAT_PLAYERKILLED", [sEntity.name, tEntity.name]));

        sEntity.pStats.pk++;
        tEntity.pStats.pd++;
      }
      //self.server.broadcastAttacker(sEntity);
    }
  },

  handleShortcut: function(message) {
    var slot = parseInt(message[0]);
    var type = parseInt(message[1]);
    var shortcutId = parseInt(message[2]);

    if (slot < 0 || slot > 7)
      return;

    if (type == 2) {
      if (shortcutId < 0 || shortcutId >= SkillData.Skills.length)
        return;
    }

    this.player.shortcuts[slot] = [slot, type, shortcutId];
  },

  handleSkill: function(message) {
    var skillId = parseInt(message[0]),
        targetId = parseInt(message[1]),
        x = parseInt(message[2]),
        y = parseInt(message[3]),
        p = this.player;

    if (skillId < 0 || skillId >= p.skills.length)
      return;

    var skill = p.skills[skillId];

    // Perform the skill.
    var target;
    //console.info("targetId="+targetId);
    if (targetId) {
      target = this.entities.getEntityById(targetId);
      if (!target)
        return;
    }
    //console.info("targetid="+targetId);

    // Make sure the skill is ready.
    if (!skill.isReady())
      return;

    //var level = skill.skillLevel + 1;

    //console.info ("skill.skillLevel="+skill.skillLevel);
    //console.info ("type="+type);

    p.effectHandler.cast(skillId, targetId, x, y);

    skill.tempXP = Math.min(skill.tempXP++,1);

    this.handleSkillEffects(p, target);
  },

  handleSkillEffects: function (source, target)
  {
    var effects = [];
    if (!source.effects)
      return;

    for (let [k,v] of Object.entries(source.effects))
    {
      if (v == 1)
        effects.push(parseInt(k));
    }
    this.entities.pushToPlayer(source, new Messages.SkillEffects(source, effects));
    effects = [];

    if (!target) return;

    for (let [k,v] of Object.entries(target.effects))
    {
      if (v == 1)
        effects.push(parseInt(k));
    }
    this.entities.pushToPlayer(source, new Messages.SkillEffects(target, effects));

  },

  // TODO map enforce for all calls.
  handleMoveEntity: function(message) {
    console.info("handleMoveEntity");
    //console.info("message="+JSON.stringify(message));
    var time = parseInt(message[0]),
      entityId = parseInt(message[1]),
      state = parseInt(message[2]),
      orientation = parseInt(message[3]),
      x = parseInt(message[4]) || -1,
      y = parseInt(message[5]) || -1;

    var p = this.player;
    if (entityId != p.id)
      return;

    if (p.map.isColliding(x, y)) {
      console.warn("char.isColliding("+p.id+","+x+","+y+")");
      return;
    }

    if (state == 2) {
      if (p.isMovingPath() && p.fullpath) {
        p.abort_pathing_callback(x, y);
        p.forceStop();
      }
      return;
    }

    var arr = [time, state, orientation, x, y];
    if (state) {
      p.move([time, false, p.orientation, x, y]);
    }
    p.move(arr);

    var msg = new Messages.Move(p, orientation, state, x, y);
    this.entities.pushNeighbours(p, msg, p);

    if (this.move_callback)
      this.move_callback();
  },

  handleMovePath: function(message) {
    console.info("handleMovePath");
    console.info("message="+JSON.stringify(message));
    var time = parseInt(message[0]),
      entityId = parseInt(message[1]),
      orientation = parseInt(message[2]),
      interrupted = (parseInt(message[3]) == 0) ? false : true;
      message.splice(0,4);
    var path = message[0];

    var p = this.player;
    if (entityId != p.id)
      return;

    console.info(JSON.stringify(path));

    var x = path[0][0],
        y = path[0][1];

    if (p.mapStatus < 2)
      return;

    /*var ts = G_TILESIZE;
    for (var node in path) {
      node[0] -= ts;
      node[1] -= ts;
    }*/
    if (!this.entities.pathfinder.checkValidPath(path)) {
      console.warn("handleMovePath: checkValidPath false.");
      p.resetMove(p.x,p.y);
      return;
    }

    if (!this.entities.pathfinder.isValidPath(p.map.grid, path)) {
      console.warn("handleMovePath: no valid path.");
      p.resetMove(p.x,p.y);
      return;
    }

    /*if (p.x != x || p.y != y) {
      console.warn("handleMovePath: invalid start coords.");
      return;
    }*/

    p.movePath([time, interrupted], path);

    var msg = new Messages.MovePath(p, path);
    this.entities.pushNeighbours(p, msg);
  },

  // TODO - enterCallback x,y not being overridden sometimes,
  // and sending to wrong Map.
  handleTeleportMap: function(msg) {
    console.info("handleTeleportMap");
    var self = this;
    var mapId = parseInt(msg[0]),
        status = parseInt(msg[1]);
    console.info("status="+status);
    var x = parseInt(msg[2]), y = parseInt(msg[3]);
    var p = this.player;
    if (status <= 0)
    {
      x = -1;
      y = -1;
    }

    var mapInstanceId = null;
    var mapName = null;

    if (mapId < 0 || mapId >= self.server.maps.length)
    {
      console.info("Map non-index");
      return;
    }

    var map = self.server.maps[mapId];
    if (!(map && map.ready)) {
      console.info("Map non-existant or not ready");
      return;
    }

    console.warn("mapIndex: p.map.mapIndex:"+map.index);
    if (status == 0) {
      p.pushSpawns = false;
      p.forceStop();
      p.mapStatus = 0;
      this.handleClearMap();

      this.entities.removePlayer(this.player);

      var finishTeleportMaps = function (mapId) {
        //console.info("real mapId: " + mapId);
        p.map = map;
        self.setMap(map);

        var pos = {x: p.x, y: p.y};
        console.info("handleTeleportMap - x: "+x+",y:"+y);

        console.warn("mapIndex: p.map.mapIndex:"+map.index);
        if (typeof p.prevPosX === "undefined" &&
            typeof p.prevPosY === "undefined")
        {
          pos = self.map.getRandomStartingPosition();
        }
        else if (p.map.mapIndex === 0)
        {

          p.prevPosX = p.x;
          p.prevPosY = p.y;
          pos = self.map.getRandomStartingPosition();
        }
        else if (p.map.mapIndex === 1)
        {
          pos = {x: p.prevPosX, y: p.prevPosY};
        }
        else {
          pos = self.map.getRandomStartingPosition();
        }

        self.entities.addPlayer(p);

        p.ex = p.sx = pos.x;
        p.ey = p.sy = pos.y;
        p.setPosition(pos.x, pos.y);
        p.move([Date.now(),3,1,pos.x,pos.y]);

        console.info("trying to send.");
        self.send([Types.Messages.WC_TELEPORT_MAP, mapId, 1, p.x, p.y]);
      };

      pos = map.enterCallback(p);
      finishTeleportMaps(mapId)
    }
    else if (status == 1) {
      p.mapStatus = 2;
      self.handleSpawnMap(mapId, p.x, p.y);

      self.send([Types.Messages.WC_TELEPORT_MAP, mapId, 2, p.x, p.y]);
    }
  },

  handleSpawnMap: function(mapId, x, y) {
    var p = this.player;

    p.knownIds = [];

    this.entities.processWho(p);
    p.setPosition(x,y);
    this.entities.pushNeighbours(p, new Messages.Spawn(p), p);
  },

  handleClearMap: function() {
    this.player.clearTarget();

    this.server.handlePlayerVanish(this.player);
    this.entities.removeEntity(this.player);
  },

  /*handleColorTint: function(data) {
    var type = parseInt(data[0]),
      color = data[1];
    if (type == 0 || type == 1) {
      this.player.colors[type] = color;
      this.entities.pushBroadcast(new Messages.ColorTint(this.player, type, color));
    }
  },*/

  /*handleDelist: function(data) {
    for (var id in data) {
      this.player.spawnsList[data[id]] = false;
    }
  },*/

  handleStatAdd: function(message) {
    var self = this;
    var attribute = parseInt(message[0]),
        points = parseInt(message[1]);
    var p = this.player;

    if (points < 0 || points > p.stats.free)
      return;

// TODO - remove energy stat.
    if (attribute == 4)
      return;

    switch (attribute) {
      case 1:
        p.stats.attack += points;
        break;
      case 2:
        p.stats.defense += points;
        break;
      case 3:
        p.stats.health += points;
        break;
      case 4:
        return;
        //this.player.stats.energy += points;
        //break;
      case 4:
        p.stats.luck += points;
        break;
    }
    p.stats.free -= points;
    p.resetBars();
    this.sendPlayer(new Messages.StatInfo(p));
  },

  handleGold: function (message) {
    var type = parseInt(message[0]),
        gold = parseInt(message[1]),
        type2 = parseInt(message[2]);

    if (gold < 0)
      return;

    if (gold > 9999999) {
      this.sendPlayer(new Messages.Notify("GOLD","MAX_TRANSFER"));
      return;
    }

    if (gold > this.player.gold[type])
    {
      this.sendPlayer(new Messages.Notify("GOLD","INSUFFICIENT_GOLD"));
      return;
    }

    // Transfer to bank.
    if (type===0 && type2===1)
    {
      if (!this.player.modifyGold(-gold, 0))
        return;
      this.player.modifyGold(gold, 1);
    }

    // Withdraw from bank.
    if (type===1 && type2===0)
    {
      if (!this.player.modifyGold(-gold, 1))
        return;
      this.player.modifyGold(gold, 0);
    }
  },

  handleBlock: function (msg) {
    var type = parseInt(msg[0]),
        id = parseInt(msg[1]),
        x = parseInt(msg[2]),
        y = parseInt(msg[3]);

    var p = this.player;

    var block = this.map.entities.getEntityById(id);
    if (!block || !(block instanceof Block))
      return;
    if (!p.isNextTooEntity(block))
      return;

    if (type == 0) // pickup
    {
      p.holdingBlock = block;
    }
    else if (type == 1) //place
    {
      x = Utils.roundTo(x, G_TILESIZE);
      y = Utils.roundTo(y, G_TILESIZE);

      if (this.map.isColliding(x, y))
        return;

      block.setPosition(x, y);
      block.update(this.player);
      p.holdingBlock = null;
    }
    var msg = new Messages.BlockModify(block, p.id, type);
    this.entities.pushNeighbours(p, msg, p);
  },

  handleRequest: function (msg) {
    var type = parseInt(msg);

    switch (type) {
      case 0: // CW_APPEARANCELIST
        this.handlePlayerInfo(msg);
        break;
      case 1: // CW_PLAYER_REVIVE
        this.handleRevive(msg);
        break;
      case 2: // CW_PLAYERINFO
        this.handlePlayerInfo(msg);
        break;
      case 3: // CW_WHO REQUEST
        this.entities.processWho(this.player);
        break;
    }
  },

  handleAppearanceList: function (msg) {
    this.server.looks.sendLooks(this.player);
  },

  handleRevive: function(msg) {
    var p = this.player;
    if (p.isDead == true) {
      console.info("handled Revive!!");
      p.revive();
      this.entities.pushNeighbours(p, new Messages.Spawn(p), p);
      // TODO
      var msg = new Messages.Move(p, p.orientation, 2, p.x, p.y);
      this.sendPlayer(msg);
    }
  },

  handlePlayerInfo: function (msg) {
    this.sendPlayer(new Messages.PlayerInfo(this.player));
  },

  handleWho: function(message) {
    //var cmd = parseInt(message.shift());
    var ids = [];
    if (message.length > 0)
      ids = message;

    //if (cmd === 1)
    //  this.entities.processWho(this.player);
    //if (cmd === 2) {
      for(var i=0; i < ids.length; ++i)
        this.player.knownIds.splice(this.player.knownIds.indexOf(ids[i]), 1);
    //}
  },

  handleParty: function (msg) {
    var partyType = msg.shift();
    switch (partyType) {
      case 1:
        this.handlePartyInvite(msg);
        break;
      case 2:
        this.handlePartyKick(msg);
        break;
      case 3:
        this.handlePartyLeader(msg);
        break;
      case 4:
        this.handlePartyLeave(msg);
        break;
    }
  },

  handlePartyInvite: function(msg) {
    var name = msg[0];
    var player2 = this.server.getEntityByName(name);
    if (!player2) {
      this.sendPlayer(new Messages.Notify("CHAT", "NO_PLAYER_EXIST", [name]));
      return;
    }

    var status = msg[1];

    var curParty = this.player.party;

    if (this.player == player2)
      return;

    if (status == 0) {

      if (curParty && curParty.players.length >= 5) {
        this.sendPlayer(new Messages.Notify("CHAT", "PARTY_MAX_PLAYERS"));
        return;
      }
      if ((!curParty || curParty.leader) && player2 instanceof Player) {
        this.sendToPlayer(player2, new Messages.PartyInvite(this.player.id));
        this.sendPlayer(new Messages.Notify("CHAT", "PARTY_PLAYER_INVITE_SENT", [player2.name]));
      }
    } else if (status == 1) {
      if (player2.party) {
        player2.party.removePlayer(player2);
        //this.handlePartyAbandoned(player2.party);
      }
      if (curParty) {
        if (curParty.players.length >= 5) {
          this.sendPlayer(new Messages.Notify("CHAT", "PARTY_MAX_PLAYERS"));
          return;
        }
        curParty.addPlayer(player2);
      } else {
        this.server.addParty(player2, this.player);
      }

      if (player2) {
        this.sendToPlayer(player2, new Messages.Notify("CHAT", "PARTY_PLAYER_JOINED", [this.player.name]));
        this.sendPlayer(new Messages.Notify("CHAT", "PARTY_PLAYER_ADDED", [player2.name]));
      }
    } else if (status == 2) {
      this.sendPlayer(new Messages.Notify("CHAT", "PARTY_YOU_REJECTED_INVITE", [player2.name]));
      this.sendToPlayer(player2, new Messages.Notify("CHAT", "PARTY_THEY_REJECTED_INVITE", [player2.name]));
    }

  },

  handlePartyKick: function(msg) {
    var name = msg[0];
    var player2 = this.server.getEntityByName(name);
    if (!player2) {
      this.sendPlayer(new Messages.Notify("CHAT", "NO_PLAYER_EXIST", [name]));
      return;
    }
    if (this.player == player2)
      return;

    var party = this.player.party;

    if (!party) {
      this.sendPlayer(new Messages.Notify("CHAT", "PARTY_CANNOT_KICK"));
      return;
    }

    if (this.player == party.leader) {
      party.removePlayer(player2);
      if (player2 instanceof Player)
        this.sendToPlayer(player2, new Messages.Notify("CHAT", "PARTY_PLAYER_KICKED"));
      this.handlePartyAbandoned(party);
    } else {
      this.sendPlayer(new Messages.Notify("CHAT", "PARTY_CANNOT_KICK"));
    }
  },

  handlePartyLeader: function(msg) {
    var name = msg[0];
    var player2 = this.server.getEntityByName(name);
    if (!player2) {
      this.sendPlayer(new Messages.Notify("CHAT", "NO_PLAYER_EXIST", [name]));
      return;
    }
    if (this.player == player2)
      return;

    var party = this.player.party;
    if (!party) {
      this.sendPlayer(new Messages.Notify("CHAT", "PARTY_NOT_LEADER"));
      return;
    }

    if (this.player == party.leader) {
      party.leader = player2;

      this.sendToPlayer(player2, new Messages.Notify("CHAT", "PARTY_YOU_LEADER"));
      this.sendPlayer(new Messages.Notify("CHAT", "PARTY_PLAYER_LEADER", [party.leader.name]));
    } else {
      this.sendPlayer(new Messages.Notify("CHAT", "PARTY_IS_LEADER", [party.leader.name]));
    }
    party.sendMembersName();
  },

  handlePartyLeave: function(msg) {
    var party = this.player.party;
    var leader = (party) ? party.leader : null;

    if (leader == null)
      return;

    if (!party) {
      this.sendPlayer(new Messages.Notify("CHAT", "PARTY_NOT_IN"));
      return;
    }

    party.removePlayer(this.player);
    this.handlePartyAbandoned(party);

    this.sendToPlayer(leader, new Messages.Notify("CHAT", "PARTY_PLAYER_LEFT", [this.player.name]));

    if (this.player != leader)
      this.sendPlayer(new Messages.Notify("CHAT", "PARTY_YOU_LEFT", [leader.name]));

  },

  handlePartyAbandoned: function(party) {
    if (party.players.length == 1) {
      this.sendPlayer(new Messages.Notify("CHAT", "PARTY_ALL_LEFT"));
      this.sendPlayer(new Messages.Party([]));
      if (this.player !== party.players[0] && party.players[0] instanceof Player) {
        this.sendToPlayer(party.players[0], new Messages.Notify("CHAT", "PARTY_ALL_LEFT"));
        this.sendToPlayer(party.players[0], new Messages.Party([]));
      }
      this.server.removeParty(party);
    }
  },

  handleHarvest: function (msg) {
    var self = this;
    var x=msg[0], y=msg[1];
    this.player.onHarvest(x,y);
  },

  handleUseNode: function (msg) {
    var id=parseInt(msg[0]);
    var entity = this.entities.getEntityById(id);
    this.player.onHarvestEntity(entity);
  },

});
