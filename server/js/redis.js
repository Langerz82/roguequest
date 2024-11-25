/* global Types, log, client */


var crypto = require('crypto');
var fs = require('fs');
var redis = require("redis");
var bcrypt = require("bcrypt");

var Utils = require('./utils');
var cls = require("./lib/class"),
  Player = require('./entity/player'),
  Messages = require("./message"),
  ItemTypes = require("./../shared/js/itemtypes"),
  Quest = require('./quest'),
  inventory = require("./inventory"),
  SkillData = require('./data/skilldata'),
  AppearanceData = require('./data/appearancedata'),
  Auction = ('./auction'),
  TaskHandler = ('./taskhandler'),
  ItemData = require('./data/itemdata');

var client;

var hgetarray = function (hash, key, callback)
{
  if (Array.isArray(key))
  {
    var m = client.multi();
    for (var i = 0; i < key.length; ++i)
      m.hget(hash, key[i])
    m.exec(callback);
  }
  else {
    client.hget(hash, key, callback);
  }
};

// TODO Array parseInt where appropriate.

module.exports = DatabaseHandler = cls.Class.extend({
  init: function(config) {
    var self = this;
    // You may now connect a client to the Redis
    // server bound to port 6379.
    client = redis.createClient(config.redis_port, config.redis_host, {
      socket_nodelay: true
    });
    client.auth(config.redis_password);
    client.on('error', function(err) {
     console.error('Redis error: ' + err);
    });
    // client.connect(); // v4

    client.hgetarray = hgetarray;
    self.ready = true;
    //self.removeLegacyItems();
    //self.removeAchievements();
  },

  removeAchievements: function () {
    var self = this;

    client.keys('*', function (err, keys) {
      if (err) return console.log(err);

      for(var i = 0, len = keys.length; i < len; i++) {
        var key = keys[i];

        if (key.startsWith("p:"))
        {
          client.hdel(key, "achievements");
        }
      }
    });
  },

  removeLegacyItems: function () {
    var self = this;

    client.keys('*', function (err, keys) {
      if (err) return console.log(err);

      for(var i = 0, len = keys.length; i < len; i++) {
        var key = keys[i];
        if (key.startsWith("u:")) {
          var username = key.substr(2);
          //console.info("username:"+username);
          //self.modifyGems(username, 2000);
        }

        if (!key.startsWith("p:"))
          continue;

        //var name = key.substr(2);
        //console.info("name:"+name);

        client.hgetall(key, function (err, value) {
          if (err) return console.log(err);

          var name = value.name;
          //console.info("name:"+name);
          //console.info(JSON.stringify(value));
          var it=0;

          var totalGold = 0;
          var funcGold = function (gold) {
            totalGold += gold;
            if (++it == 3)
            {
              if (totalGold > 0) {
                self.modifyGold(name, totalGold);
              }
            }
          };

          for (var j=0; j < 3; ++j)
          {
            var func = function (items, type) {
              var gold = 0;
              //console.info("old_items: "+JSON.stringify(items));
              var k = items.length;
              while (k--) {
                item = items[k];
                //console.info(JSON.stringify(item));
                if (ItemTypes.isLootItem(item.itemKind))
                  continue;

                var data = ItemData.Kinds[item.itemKind];
                if (!data) {
                  items.splice(items.indexOf(item), 1);
                  continue;
                }

                if (data && data.legacy == 1)
                {
                  //console.info("legacy item found!!!!!!!!!");
                  var itemNumber = item.itemNumber;
                  var tmpItem = Object.assign({}, item);
                  for (var l=1; l < itemNumber; ++l) {
                    tmpItem.itemNumber = l;
                    //console.info("getEnchantPrice:"+ItemTypes.getEnchantPrice(tmpItem));
                    gold += ItemTypes.getEnchantPrice(tmpItem);
                  }
                  tmpItem.itemNumber = 1;
                  //console.info("getBuyPrice:"+ItemTypes.getBuyPrice(tmpItem.itemKind));
                  gold += ItemTypes.getBuyPrice(tmpItem.itemKind);
                  //console.info("indexOf="+items.indexOf(item));
                  items.splice(items.indexOf(item), 1);
                }
              }
              //console.info("gold: "+gold);
              self.saveItems({name: name}, type, items);
              funcGold(gold);
            };


            self.getItems({name: name}, j, func);
          }
        });
      }
    })
  },

  createUser: function(user) {
    var self = this;
    var uKey = "u:" + user.name;
    var curTime = new Date().getTime();

    var lenLooks = AppearanceData.Data.length;
    user.looks = new Uint8Array(lenLooks);
    for(var i=0; i < lenLooks; ++i)
      user.looks[i] = 0;

    user.looks[0] = 1;
    user.looks[50] = 1;
    user.looks[77] = 1;
    user.looks[151] = 1;

    user.gems = 2000;

    // Check if username is taken
    client.sismember('usr', user.name, function(err, reply) {
      if (reply === 1) {
        user.connection.sendUTF8(Types.Messages.SC_ERROR+",userexists");
        user.connection.close("Username not available: " + user.name);
      } else {
        var looksHex = Utils.BinToHex(user.looks);
        client.multi()
          .sadd("usr", user.name)
          .hset(uKey, "username", user.name)
          .hset(uKey, "hash", user.hash)
          .hset(uKey, "salt", user.salt)
          .hset(uKey, "banTime", 0)
          .hset(uKey, "banDuration", '')
          .hset(uKey, "lastLoginTime", curTime)
          .hset(uKey, "membership", 0)
          .hset(uKey, "players", '')
          .hset(uKey, "gems", user.gems)
          .hset(uKey, "looks", looksHex)
          .hset(uKey, "ipAddresses", user.connection._connection.remoteAddress) //9

          .exec(function(err, replies) {
            user.hasLoggedIn = true;
            users[user.name] = 1;

            self.sendPlayers(user);
          });
      }
    });
  },

  savePassword: function(username, hash) {
    var uKey = "u:" + username;
    client.hset(uKey, "hash", hash);
  },

  removeUser: function (user) {
    var self = this;
    var uKey = "u:" + user.name;

    //console.error("uKey:"+uKey);
    client.hgetall(uKey, function(err, data) {
      console.info("replies: "+data);
      console.info(JSON.stringify(data));
      if (data === null || !(typeof data === 'object'))
        return;

      var db_user = {
        "hash": data.hash,
        "salt": data.salt
      };

      console.info(JSON.stringify(db_user));
      console.error("USER CHECK USER");
      if(user.checkUser(db_user, true)) {
        console.error("USER CHECK USER SUCCESS");
        var playerNames = data.players.split(",");
        for(var i=0; i < playerNames.length; ++i)
        {
          var pKey = "p:"+playerNames[i];
          client.del(pKey);
        }
        client.del(uKey);
        client.srem("usr", user.name);
        user.connection.sendUTF8(Types.Messages.SC_ERROR+",removed_user_ok");
        user.connection.close();
        return;
      }
      user.connection.sendUTF8(Types.Messages.SC_ERROR+",removed_user_fail");
      user.connection.close();
    });
  },

// TODO load created Player summaries too.
  loadUser: function(user) {
    var self = this;
    var uKey = "u:" + user.name;
    var curTime = new Date().getTime();
    client.sismember("usr", user.name, function(err, reply) {
      //console.info("reply: "+reply);
      if (reply !== 1)
      {
        user.connection.sendUTF8(Types.Messages.SC_ERROR+",invalidlogin");
        return;
      }

      client.hgetall(uKey, function(err, data) {
        console.info("replies: "+data);
        console.info(JSON.stringify(data));
        if (data === null || !(typeof data === 'object'))
          return;
        //console.info(replies.toString());

        var db_user = {
          "hash": data.hash,
          "salt": data.salt,
          "banTime": data.banTime,
          "banDuration": data.banDuration,
          "lastLoginTime": data.lastLoginTime,
          "membership": data.membership,
          "players": data.players,
          "ipAddresses": data.ipAddresses,
          "gems": data.gems
        };

        if (!data.gems)
          db_user.gems = 1000;
        else
          db_user.gems = parseInt(data.gems);

        if (!data.looks || parseInt(data.looks, 16) === 0 || data.looks.toLowerCase().includes("nan")) {
          var len = AppearanceData.Data.length;
          db_user.looks = new Uint8Array(len);
          for(var i=0; i < len; ++i)
            db_user.looks[i] = 0;
        }
        else {
          db_user.looks = Utils.HexToBin(data.looks);
        }

        // [77,0,151,50] - Beginner Looks values.
        db_user.looks[0] = 1;
        db_user.looks[50] = 1;
        db_user.looks[77] = 1;
        db_user.looks[151] = 1;

        console.info(JSON.stringify(db_user));

        user.looks = db_user.looks.slice();
        user.gems = db_user.gems;

        if(user.checkUser(db_user)) {
          var ipAddress = user.connection._connection.remoteAddress;
          if (!data.ipAddesses)
            client.hset(uKey, "ipAddresses", ipAddress);
          else {
            if (!toString(data.ipAddesses).includes(ipAddress))
              client.hset(uKey, "ipAddresses", db_user.ipAddresses + "," + ipAddress);
          }
          client.hset(uKey, "lastLoginTime", new Date().getTime());

          self.sendPlayers(user);
        }
      });
      //user.connection.sendUTF8(Types.Messages.SC_ERROR+",invalidlogin");
      return false;
    });
  },

  sendPlayers: function (user) {
    var uKey = "u:" + user.name;
    client.hget(uKey, "players", function (err, reply) {
      console.info("players_reply:"+reply);
      if (reply == null || reply === "")
      {
        user.sendPlayers();
        return;
      }
      var playerNames = reply.split(",");
      var db_players = [];
      var count = 0;
      for(var i=0; i < playerNames.length; ++i)
      {
        var pKey = "p:"+playerNames[i];
        hgetarray(pKey, ["name","map","exps","colors","sprites"], function(err, reply) {
          //console.info("err:"+JSON.stringify(err));
          //console.info("reply:"+JSON.stringify(reply));
          var db_player = {
            "name": reply[0],
            "map": reply[1].split(",")[0], // MapIndex.
//            "pClass": reply[2] || 0,
            "exp": reply[2].split(",")[0], // Base XP.
            "colors": reply[3].split(","),
            "sprites": reply[4].split(",")
          };
          db_players.push(db_player);
          if (++count == playerNames.length)
            user.sendPlayers(db_players);
        });
      }
    });
  },

  loadPlayer: function(player) {
    var self = this;
    var pKey = "p:" + player.name;
    var curTime = new Date().getTime();
    console.info("player.name: "+player.name);

    client.hdel(pKey, "skillSlots");
    client.multi()
      .hget(pKey, "map")
      .hget(pKey, "exps")
      .hget(pKey, "colors")
      .hget(pKey, "pStats")
      .hget(pKey, "gold")
      .hget(pKey, "sprites")
      .hget(pKey, "stats")
      .hget(pKey, "skills")
      .hget(pKey, "completeQuests")

      .exec(function(err, replies) {

        console.info(replies.toString());
        var db_player = {
            "name": player.name,
            "map": replies[0].split(","),
            "exps": replies[1].split(","),
            "colors": replies[2].split(","),
            "pStats": replies[3].split(","),
            "gold": replies[4].split(","),
            "sprites": replies[5].split(","),
            "stats": replies[6].split(","),
            "skills": replies[7].split(","),
            "completeQuests": replies[8],
          };

        if (db_player.skills.length == 1) {
          for(var i =0; i < SkillData.Skills.length; ++i)
            db_player.skills[i] = 0;
        }

        if (db_player.sprites.length == 2) {
          db_player.sprites[2] = 151;
          db_player.sprites[3] = 50;
        }

        if (db_player.completeQuests) {
          db_player.completeQuests = JSON.parse(db_player.completeQuests);
        }

        player.hasLoggedIn = true;
        player.packetHandler.loadedPlayer = true;
        //players[player.name] = 1;
        players.push(player);

        db_player.shortcuts = {};
        client.hget(pKey, "shortcuts", function (err, reply) {
          if (reply) {
            db_player.shortcuts = JSON.parse(reply);
          }
          player.sendPlayer(db_player);
        });
        //player.sendPlayer(db_player);
      });

    return true;
  },

  createPlayer: function(user, player, callback) {
    var uKey = "u:" + user.name;
    var pKey = "p:" + player.name;
    var curTime = new Date().getTime();
    //var player = player;

// TODO - Make Unique.
    // Check if playername is taken
    client.hget(pKey, "name", function(err, reply) {
      if (reply) {
        user.connection.sendUTF8(Types.Messages.SC_ERROR+",playerexists");
        return;
      }
      console.info("CREATING PLAYER");

      var db_player = {
        "name": player.name,
        "map": [0,0,0,0],
        //"pClass": player.pClass,
        "exps": [0,0,0,0,0,0,0,0,0,0],
        "colors": [0,0],
        "pStats": [0,0],
        "gold": [0,0],
        "sprites": [77,0,151,50],
        "stats": [2,2,2,2,2,0],
        "skills": [],
        "shortcuts": []
      };

      // Create skills exps
      for(var i =0; i < SkillData.Skills.length; ++i)
        db_player.skills[i] = 0;

      client.multi()
        .hset(pKey, "name", db_player.name)
        .hset(pKey, "map", db_player.map.join(","))
//        .hset(pKey, "pClass", db_player.pClass)
        .hset(pKey, "exps", db_player.exps.join(","))
        .hset(pKey, "colors", db_player.colors.join(","))
        .hset(pKey, "pStats", db_player.pStats.join(","))
        .hset(pKey, "gold", db_player.gold.join(","))
        .hset(pKey, "sprites", db_player.sprites.join(","))
        .hset(pKey, "stats", db_player.stats.join(","))
        .hset(pKey, "skills", db_player.skills.join(","))
        .hset(pKey, "shortcuts", db_player.shortcuts.join(","))
        .exec(function(err, replies) {
          console.info(err);
          console.info(JSON.stringify(replies));

          console.info("New User: " + player.name);

          user.loadedPlayer = true;

          // Create Player Name in User account.
          client.hget(uKey, "players", function (err, reply) {
            var db_players = [];
            if (reply)
              db_players = reply.split(",");
            db_players.push(player.name);
            client.hset(uKey, "players", db_players.join(","));

            callback(db_player);
          });
      });
    });
  },


    savePlayer: function(player) {
      var pKey = "p:" + player.name;
      var uKey = "u:" + player.user.name;

      var stats = [
        player.stats.attack,
        player.stats.defense,
        player.stats.health,
        player.stats.energy,
        player.stats.luck,
        player.stats.free];

      var exps = [
        Utils.NaN2Zero(player.exp.base),
        Utils.NaN2Zero(player.exp.attack),
        Utils.NaN2Zero(player.exp.defense),
        Utils.NaN2Zero(player.exp.move),
        Utils.NaN2Zero(player.exp.sword),
        Utils.NaN2Zero(player.exp.bow),
        Utils.NaN2Zero(player.exp.hammer),
        Utils.NaN2Zero(player.exp.axe),
        Utils.NaN2Zero(player.exp.logging),
        Utils.NaN2Zero(player.exp.mining),
      ];

      var map = [
        player.map.index,
        player.x,
        player.y,
        player.orientation];

      var skillexps = [];
      for (var i =0 ; i < player.skills.length; ++i)
        skillexps[i] = player.skills[i].skillXP;

      var completeQuests = (Object.keys(player.completeQuests).length > 0) ? JSON.stringify(player.completeQuests) : 0;

      var hexLooks = Utils.BinToHex(player.user.looks);
      client.multi()
        .hset(pKey, "map", map.join(","))
        .hset(pKey, "stats", stats.join(","))
        .hset(pKey, "exps", exps.join(","))
        .hset(pKey, "gold", player.gold.join(","))
        .hset(pKey, "skills", skillexps.join(","))
        .hset(pKey, "shortcuts", JSON.stringify(player.shortcuts))
        .hset(pKey, "pStats", player.pStats.join(","))
        .hset(pKey, "sprites", player.sprites.join(","))
        .hset(pKey, "colors", player.colors.join(","))
        .hset(pKey, "completeQuests", completeQuests)
        .hset(uKey, "looks", hexLooks)
        .hset(uKey, "gems", player.user.gems)
        .exec(function(err, replies) {
          player.saveSection();
        });
    },

  modifyGold: function(playerName, golddiff, type) {
    var type = type || 0;
    var golddiff = parseInt(golddiff);
    var pKey = "p:" + playerName;
    //console.info(pKey+","+golddiff+","+type);
    client.hget(pKey, "gold", function (err, data)
    {
      console.info("modifyGold.gold: "+JSON.stringify(data));
      if (!data) {
        console.error("redis.modifyGold - no gold record for player '"+playerName+"' found.");
        return;
      }

      var gold = data.split(",");
      gold[type] = parseInt(gold[type])+golddiff;
      client.hset(pKey, "gold", gold.join(","));
    });
  },

  modifyGems: function(userName, diff) {
    var uKey = "u:" + userName;
    var diff = parseInt(diff);

    client.hget(uKey, "gems", function (err, data)
    {
      var gems = parseInt(data);
      gems += diff;
      client.hset(uKey, "gems", gems);
    });
  },

// ITEMS - BEGIN. New item store functions.

  getStoreType: function(type)
  {
    var sType;
    switch (type)
    {
        case 0: // Inventory Item
          sType = "iItem_";
          break;
        case 1: // Bank Item
          sType = "bItem_";
          break;
        case 2: // Equipped Item
          sType = "eItem_";
          break;
    }
    return sType;
  },

  getStoreTypeNew: function(type)
  {
    var sType;
    switch (type)
    {
        case 0: // Inventory Item
          sType = "inventory";
          break;
        case 1: // Bank Item
          sType = "bank";
          break;
        case 2: // Equipped Item
          sType = "equipment";
          break;
    }
    return sType;
  },

  getItemsStoreCount: function (type) {
    if (type == 1) return 96;
    if (type == 2) return 5;
    return 48;
  },

  getItems:function (player, type, callback) {
    var self = this;
    var pKey = "p:" + player.name;

    var maxNumber = this.getItemsStoreCount(type);
    var sType = this.getStoreTypeNew(type);

    client.hget(pKey, sType, function (err, data) {
        if (err || !data) {
          self.getItemsOld(player, type, callback);
          return;
        }

        if (data == "") {
          self.getItemsOld(player, type, callback);
          return;
        }

        var items = [];
        console.info(pKey);
        console.info("getItems - data="+data);
        dataJSON = JSON.parse(data);
        for (var i = 0; i < dataJSON.length; i++) {
          var itemData = dataJSON[i];
          if (itemData) {
            var item = new ItemRoom(
              parseInt(itemData[1]),
              parseInt(itemData[2]),
              parseInt(itemData[3]),
              parseInt(itemData[4]),
              parseInt(itemData[5]));
            item.slot = parseInt(itemData[0]);
            items.push(item);
          }
        }
        callback(items, type);
    });
  },

  getItemsOld: function(player, type, callback) {
    var pKey = "p:" + player.name;

    var maxNumber = 48;
    if (type == 2) maxNumber = 5;

    var sType = this.getStoreType(type);
    var multi = client.multi();
    var keys = [];

    var items = [];
    client.hgetall(pKey, function(err,data) {
        if (data === null)
        {
          callback([], type);
          return;
        }

        //console.info("client.hgetall="+JSON.stringify(data));
        for (var id in data) {
          var val = data[id];
          if (id.startsWith(sType)) {
            var slot = id.substr(6);
            var rec = val.split(',');
            var item = new ItemRoom(
              parseInt(rec[0]),
              parseInt(rec[1]),
              parseInt(rec[2]),
              parseInt(rec[3]),
              parseInt(rec[4]));
            item.slot = slot;
            items.push(item);
          }
        }
        callback(items, type);
    });

    /*for (var i = 0; i < maxNumber; i++) {
      multi.hget(pKey, sType + i);
    }
    multi.exec(function(err, data) {
      if (data === null || !Array.isArray(data))
      {
        callback([], type);
        return;
      }
      var items = [];
      for (var i = 0; i < maxNumber; i++) {
        var itemData = data[i];
        if (itemData) {
          var itemRec = itemData.split(',');
          var item = new ItemRoom(
            parseInt(itemRec[0]),
            parseInt(itemRec[1]),
            parseInt(itemRec[2]),
            parseInt(itemRec[3]),
            parseInt(itemRec[4]));
          item.slot = i;
          items.push(item);
        }
      }
      callback(items, type);
    });*/
  },

  saveItems: function(player, type, items)
  {
    var pKey = "p:" + player.name;

    var maxNumber = this.getItemsStoreCount(type);
    var sType = this.getStoreType(type);
    var sTypeNew = this.getStoreTypeNew(type);
    var multi = client.multi();
    for (var i = 0; i < maxNumber; i++) {
      multi.hdel(pKey, sType + i);
    }
    multi.exec(function(err, replies) {
      if (err)
        console.error(err);
    });
    var store = player.inventory;
    if (type == 1)
      store = player.bank;
    if (type == 2)
      store = player.equipment;

    if (!store)
      return;

    client.hset(pKey, sTypeNew, store.toStringJSON(),
      function(err, replies) {
        player.saveSection();
    });
},

// ITEMS - END. End of Item Functions.

// QUESTS - BEGIN. - TODO - Check quests variables (repeat needs to be removed.)
// TODO - Just do new save rather than appending to key "quests".

  // example {id: id, type: 2, npcId: this.id, objectId: topEntity.kind, count: mobCount, repeat: repeat}
  saveQuests: function(player, quests) {
    var pKey = "p:" + player.name;
    var quest = null;

    var questKey = [];
    var questString = "[";
    var hasQuests = false;
    for (var i=0; i < quests.length; ++i)
    {
      quest = quests[i];
      if (!quest || quest.status == QuestStatus.COMPLETE  || _.isEmpty(quest))
        continue;

      questKey.push(quest.id);
      //client.hset(pKey, "q_" + quest.id, quest.toString());
      questString += "["+quest.toString()+"],";
      hasQuests = true;
    }
    questString = questString.slice(0, -1);
    questString += "]";
    if (!hasQuests) questString = "[]";

    //client.hset(pKey, "quests2", questKey.join(","));
    client.hset(pKey, "newquests2", questString,
      function(err, replies) {
            player.saveSection();
    });

    this.deleteOldQuests(player);
  },

  deleteOldQuests: function(player) {
    console.info("deleteOldQuests");
    var pKey = "p:" + player.name;
    var indexes;

    client.hgetall(pKey, function(err,data) {
        if (data === null)
        {
          return;
        }

        console.info("client.hgetall="+JSON.stringify(data));
        for (var id in data) {
          var val = data[id];
          if (id.startsWith("q_"))
            client.hdel(pKey, id);
        }
        client.hdel(pKey, "quests");
        client.hdel(pKey, "quests2");
        client.hdel(pKey, "newquests");
    });
  },

  loadQuests: function(player, callback) {
    var self = this;
    console.info("loadQuest");
    var pKey = "p:" + player.name;
    var multi = client.multi();
    var indexes;

    client.hget(pKey, "newquests2", function (err, data) {
        if (err || !data) {
          //self.loadQuestsOld(player, callback);
          callback(player);
          return;
        }

        if (data == "") {
          //self.loadQuestsOld(player, callback);
          callback(player);
          return;
        }

        var quests = [];
        console.info(pKey);
        console.info("getItems - data="+data);
        dataJSON = JSON.parse(data);
        for (var i = 0; i < dataJSON.length; i++) {
          var questData = dataJSON[i];
          if (questData) {
            console.info(JSON.stringify(questData));
            var quest = new Quest(questData.splice(0,7));
            if (questData.length > 0)
              quest.object = getQuestObject(questData.splice(0,6));
            if (questData.length > 0)
              quest.object2 = getQuestObject(questData.splice(0,6));
            player.quests.push(quest);
          }
        }
        callback(player);
    });
  },
// QUESTS - END.


// ACHIEVEMENTS - START.
saveAchievements: function(player) {
  console.info("saveAchievement");
  var pKey = "p:" + player.name;
  var data = "";
  for (var achievement of player.achievements)
  {
      data += achievement.toRedis(achievement).join(',') + ",";
  }
  client.hset(pKey, "achievements", data,
    function(err, replies) {
      player.saveSection();
  });
},

loadAchievements: function(player, callback) {
  console.info("loadAchievement");
  var pKey = "p:" + player.name;
  client.hget(pKey, "achievements", function (err, data) {
      var achievements = getInitAchievements();
      if (err || !data) {
        //var taskHandler = new TaskHandler();
        player.achievements = achievements;
        callback(player);
        return;
      }

      var rec = data.split(',');
      var len = ~~(rec.length / 3);
      for (var i=0; i < len; ++i)
      {
        //console.info(JSON.stringify(val2[j]));
        var achievement = getSavedAchievement(rec.splice(0,3));
        player.achievements.push(achievement);
      }
      for (var i=len; i < achievements.length; ++i)
      {
        player.achievements.push(achievements[i]);
      }

      callback(player);
  });
},
// ACHIEVEMENTS - END.


// AUCTION DATABASE CALLS.
  loadAuctions: function(self, callback) {
    client.hgetall('s:auction', function(err, data) {
      var auctions = {};

      if (data === null || !(typeof data === 'object'))
      {
        console.warn("loadAuctions - err: "+JSON.stringify(err));
        console.warn("loadAuctions - data: "+JSON.stringify(data));
        callback(self, {});
        return;
      }
      for (var i = 0; i < Object.keys(data).length; ++i) {
        var rec = data[i];
        var sData = rec.split(",");
        var record = new AuctionRecord(sData[0],
          parseInt(sData[1]),
          new ItemRoom(parseInt(sData[2]),
             parseInt(sData[3]),
             parseInt(sData[4]),
             parseInt(sData[5]),
             parseInt(sData[6]))
          );
        auctions[i] = record;
      }
      callback(self, auctions);
      return;
    });
  },

  saveAuctions: function(auctions) {
    client.del('s:auction');
    var j = 0;
    var multi = client.multi();
    for (var i = 0; i < Object.keys(auctions).length; ++i) {
      if (auctions[i])
        multi.hset('s:auction', j++, auctions[i].save(i));
    }
    multi.exec(function(err, replies) {
      if (err)
        console.error("saveAuctions: "+JSON.stringify(err));
      AUCTION_SAVED = true;
    });
  },

  loadLooks: function (looks) {
    client.hget("l:looks", "prices", function (err, data)
    {
      if (data)
        looks = data.split(",");
    });
  },

  saveLooks: function (looks) {
    client.hset('l:looks', 'prices', looks.join(','));
  },

// END AUCTION DB CALLS.


});
