/* global Types, log, client */


var crypto = require('crypto');
var fs = require('fs');
var redis = require("redis");
var bcrypt = require("bcrypt");

var Utils = require('./utils');
var cls = require("./lib/class"),
    SkillData = require('./data/skilldata'),
    AppearanceData = require('./data/appearancedata'),
    Auction = ('./auction');

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

var getStoreType = function(type)
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
};

var getStoreTypeNew = function(type) {
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
};

var getItemsStoreCount = function (type) {
  if (type == 1) return 96;
  if (type == 2) return 5;
  return 48;
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
        user.connection.send([Types.UserMessages.UC_ERROR,"userexists"]);
        user.connection.close("Username not available: " + user.name);
      } else {
        data = [
          user.hash,
          user.salt,
          0,
          '',
          curTime,
          0,
          '',
          user.gems,
          Utils.BinToHex(user.looks),
          user.connection._connection.remoteAddress];

        self.saveUserInfo(user.name, data, function (username, data) {
          user.hasLoggedIn = true;
          users[user.name] = 1;

          self.sendPlayers(user);
        });
      }
    });
  },

  savePlayerUserInfo: function (username, playername, data, callback) {
    var uKey = "u:" + username;
    client.multi()
      .sadd("usr", username)
      .hset(uKey, "gems", data[7])
      .hset(uKey, "looks", data[8])
      .exec(function(err, replies) {
        if (callback)
          callback(username, playername, data);
      });
  },

  saveUserInfo: function(username, data, callback) {
    var uKey = "u:" + username;

      client.multi()
        .sadd("usr", username)
        .hset(uKey, "username", username)
        .hset(uKey, "hash", data[0])
        .hset(uKey, "salt", data[1])
        .hset(uKey, "banTime", data[2])
        .hset(uKey, "banDuration", data[3])
        .hset(uKey, "lastLoginTime", data[4])
        .hset(uKey, "membership", data[5])
        .hset(uKey, "players", data[6])
        .hset(uKey, "gems", data[7])
        .hset(uKey, "looks", data[8])
        .hset(uKey, "ipAddresses", data[9])
        .exec(function(err, replies) {
          if (callback)
            callback(username, data);
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
        var playernames = data.players.split(",");
        for(var i=0; i < playernames.length; ++i)
        {
          var pKey = "p:"+playernames[i];
          client.del(pKey);
        }
        client.del(uKey);
        client.srem("usr", user.name);
        user.connection.send([Types.UserMessages.UC_ERROR,"removed_user_ok"]);
        user.connection.close();
        return;
      }
      user.connection.send([Types.UserMessages.UC_ERROR,"removed_user_fail"]);
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
        user.connection.send([Types.UserMessages.UC_ERROR,"invalidlogin"]);
        return false;
      }

      client.hgetall(uKey, function(err, data) {
        console.info("replies: "+data);
        console.info(JSON.stringify(data));
        if (data === null || !(typeof data === 'object'))
          return false;
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
          return true;
        }
      });
      return false;
    });
  },

  createPlayerNameInUser: function (username, playername, callback) {
    var uKey = "u:" + username;
    // Create Player Name in User account.
    client.hget(uKey, "players", function (err, reply) {
      var db_players = [];
      if (reply)
        db_players = reply.split(",");
      db_players.push(playername);
      client.hset(uKey, "players", db_players.join(","));

      if (callback)
        callback();
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
      var playernames = reply.split(",");
      var db_players = [];
      var count = 0;
      for(var i=0; i < playernames.length; ++i)
      {
        var pKey = "p:"+playernames[i];
        hgetarray(pKey, ["name","map","exps","colors","sprites"], function(err, reply) {
          if (err || !reply[0]) {
            console.info("redis - sendPlayers, err:"+JSON.stringify(err));
            ++count;
            return;
          }

          //console.info("err:"+JSON.stringify(err));
          console.info("reply:"+JSON.stringify(reply));
          var db_player = {
            "name": reply[0],
            "map": reply[1].split(",")[0], // MapIndex.
//            "pClass": reply[2] || 0,
            "exp": reply[2].split(",")[0], // Base XP.
            "colors": reply[3].split(","),
            "sprites": reply[4].split(",")
          };
          db_players.push(db_player);
          if (++count == playernames.length)
            user.sendPlayers(db_players);
        });
      }
    });
  },

// TODO SOME WACKKK SHIT
  createPlayer: function(playername, callback) {
    var self = this;
    var pKey = "p:" + playername;
    var curTime = new Date().getTime();

    // Check if playername is taken
    client.hget(pKey, "name", function(err, reply) {
      if (reply) {
        if (callback)
          callback(playername, false);
        return;
      }
      console.info("CREATING PLAYER");
      if (callback)
        callback(playername, true);
    });
  },

  loadUserInfo: function(username, callback) {
    var uKey = "u:" + username;

    client.hgetall(uKey, function(err, data) {
      console.info("replies: "+data);
      console.info(JSON.stringify(data));
      if (data === null || !(typeof data === 'object'))
        return;

      if (callback)
        callback(username, data);
    });
  },

  loadPlayerUserInfo: function(username, callback) {
    var uKey = "u:" + username;

    client.multi()
      .hget(uKey, "gems")
      .hget(uKey, "looks")

      .exec(function(err, data) {
        if (data === null || !(typeof data === 'object'))
          return;

        if (callback)
          callback(username, data);
      });
  },

  loadPlayerInfo: function(playername, callback) {
    var pKey = "p:" + playername;

    client.hdel(pKey, "skillSlots");
    client.multi()
      .hget(pKey, "name")
      .hget(pKey, "map")
      .hget(pKey, "stats")
      .hget(pKey, "exps")
      .hget(pKey, "gold")
      .hget(pKey, "skills")
      .hget(pKey, "pStats")
      .hget(pKey, "sprites")
      .hget(pKey, "colors")
      .hget(pKey, "shortcuts")
      .hget(pKey, "completeQuests")

      .exec(function(err, data) {
        if (data === null || !(typeof data === 'object'))
          return;

        if (callback)
          callback(playername, data);
      });
  },

  savePlayerInfo: function(playername, data, callback) {
    var pKey = "p:" + playername;

    client.multi()
      .hset(pKey, "name", data[0])
      .hset(pKey, "map", data[1])
      .hset(pKey, "stats", data[2])
      .hset(pKey, "exps", data[3])
      .hset(pKey, "gold", data[4])
      .hset(pKey, "skills", data[5])
      .hset(pKey, "pStats", data[6])
      .hset(pKey, "sprites", data[7])
      .hset(pKey, "colors", data[8])
      .hset(pKey, "shortcuts", data[9])
      .hset(pKey, "completeQuests", data[10])

      .exec(function(err, replies) {
        if (err) {
          console.warn(err);
          console.warn(JSON.stringify(replies));
          return;
        }

        if (callback)
          callback(playername);
      });
  },


  modifyGold: function(playername, golddiff, type) {
    var type = type || 0;
    var golddiff = parseInt(golddiff);
    var pKey = "p:" + playername;
    //console.info(pKey+","+golddiff+","+type);
    client.hget(pKey, "gold", function (err, data)
    {
      console.info("modifyGold.gold: "+JSON.stringify(data));
      if (!data) {
        console.error("redis.modifyGold - no gold record for player '"+playername+"' found.");
        return;
      }
      if (err || !data || data == "") {
        console.warn(err);
        console.warn(JSON.stringify(data));
        return;
      }

      var gold = data.split(",");
      gold[type] = parseInt(gold[type])+golddiff;
      client.hset(pKey, "gold", gold.join(","));
    });
  },

  modifyGems: function(username, diff) {
    var uKey = "u:" + username;
    var diff = parseInt(diff);

    client.hget(uKey, "gems", function (err, data)
    {
      var gems = parseInt(data);
      gems += diff;
      client.hset(uKey, "gems", gems);
    });
  },

// ITEMS - BEGIN. New item store functions.


  loadItems: function (playername, type, callback) {
    var self = this;
    var pKey = "p:" + playername;

    var maxNumber = getItemsStoreCount(type);
    var sType = getStoreTypeNew(type);

    client.hget(pKey, sType, function (err, data) {
        if (err || !data || data == "") {
          console.warn(err);
          console.warn(JSON.stringify(data));
          return;
        }
        if (callback)
          callback(playername, data);
    });
  },

// TODO - FN NOT WORKING PROPERLY.
  saveItems: function(playername, type, data, callback)
  {
    var pKey = "p:" + playername;
    var sType = getStoreTypeNew(type);
    console.info("saveItems: "+data);
    console.info("pKey: "+pKey);
    console.info("sType: "+sType);
    client.hset(pKey, sType, data,
      function(err, replies) {
        if (err || !data || data == "") {
          console.warn(err);
          console.warn(JSON.stringify(replies));
          console.warn(JSON.stringify(data));
          return;
        }
        if (callback)
          callback(playername);
    });
  },

// ITEMS - END. End of Item Functions.

// QUESTS - BEGIN. - TODO - Check quests variables (repeat needs to be removed.)
// TODO - Just do new save rather than appending to key "quests".

  // example {id: id, type: 2, npcId: this.id, objectId: topEntity.kind, count: mobCount, repeat: repeat}
  saveQuests: function(playername, data, callback) {
    var pKey = "p:" + playername;

    client.hset(pKey, "newquests2", data,
      function(err, replies) {
        if (err || !data || data == "") {
          console.warn(err);
          console.warn(JSON.stringify(replies));
          console.warn(JSON.stringify(data));
          return;
        }
        if (callback)
          callback(playername);
    });
  },

  loadQuests: function(playername, callback) {
    var self = this;
    console.info("loadQuest");
    var pKey = "p:" + playername;
    var multi = client.multi();
    var indexes;

    client.hget(pKey, "newquests2", function (err, data) {
        if (err || !data || data == "") {
          console.warn(err);
          console.warn(JSON.stringify(replies));
          console.warn(JSON.stringify(data));
          return;
        }
        console.info(pKey);
        console.info("getItems - data="+data);
        if (callback)
          callback(playername, data);
    });
  },
// QUESTS - END.


// ACHIEVEMENTS - START.
saveAchievements: function(playername, data, callback) {
  console.info("saveAchievement");
  var pKey = "p:" + playername;
  client.hset(pKey, "achievements", data,
    function(err, replies) {
      if (err) {
        console.warn(err);
        console.warn(JSON.stringify(replies));
        console.warn(JSON.stringify(data));
        return;
      }
      if (callback)
        callback(playername);
  });
},

loadAchievements: function(playername, callback) {
  console.info("loadAchievement");
  var pKey = "p:" + playername;
  client.hget(pKey, "achievements", function (err, data) {
      if (err || !data || data == "") {
        console.warn(err);
        console.warn(JSON.stringify(data));
        return;
      }
      if (callback)
        callback(playername, data);
  });
},
// ACHIEVEMENTS - END.

// AUCTION DATABASE CALLS.
  loadAuctions: function(worldIndex, callback) {
    client.hgetall('s:auction'+worldIndex, function(err, data) {
      var auctions = {};

      if (data === null || !(typeof data === 'object'))
      {
        console.warn("loadAuctions - err: "+JSON.stringify(err));
        console.warn("loadAuctions - data: "+JSON.stringify(data));
        return;
      }
      if (callback)
        callback(worldIndex, data);
      return;
    });
  },

  saveAuctions: function(worldIndex, data, callback) {
    console.info("redis - saveAuctions: "/*+JSON.stringify(data)*/);
    client.del('s:auction');
    client.del('s:auction'+worldIndex);
    var multi = client.multi();
    for (var i = 0; i < data.length; ++i) {
        multi.hset('s:auction'+worldIndex, i, data[i]);
    }
    multi.exec(function(err, data) {
      if (err) {
        console.error("redis - saveAuctions: "+JSON.stringify(err));
        return;
      }
      if (callback)
        callback();
    });
  },
// END AUCTION DB CALLS.

// START LOOKS DB CALLS.
  loadLooks: function (worldIndex, callback) {
    client.hget("l:looks"+worldIndex, "prices", function (err, data)
    {
      if (err || !data || data == "") {
        console.warn(err);
        console.warn(JSON.stringify(data));
        return;
      }
      if (data) {
        data = data.split(",");
        if (callback)
          callback(worldIndex, data);
      }
    });
  },

  saveLooks: function (worldIndex, looks, callback) {
    console.info("redis - saveLooks: "/*+JSON.stringify(looks)*/);
    client.del('l:looks');
    client.del('l:looks'+worldIndex);
    client.hset('l:looks'+worldIndex, 'prices', looks.join(","), function(err, data) {
      if (err) {
        console.error("redis - saveLooks:" + JSON.stringify(err));
        return;
      }
      if (callback)
        callback();
    });
  },
// END LOOKS DB CALLS.


});
