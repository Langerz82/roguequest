
/* global require, module, log, DBH */

var cls = require("./lib/class"),
    _ = require("underscore"),
    Utils = require("./utils"),
    Types = require("../shared/js/gametypes"),
//    Main = require("./main"),
//    Messages = require("./message"),
    AppearanceData = require("./data/appearancedata");
//    TaskHandler = require("./taskhandler");

/*function PlayerSummary(index, db_player) {
  this.index = index;
  this.name = db_player.name;
  //this.pClass = db_player.pClass;
  this.exp = db_player.exp;
  this.colors = db_player.colors;
  this.sprites = db_player.sprites;
  return this;
}

PlayerSummary.prototype.toArray = function () {
  return [this.index,
    this.name,
    //this.pClass,
    this.exp,
    this.colors[0],
    this.colors[1],
    this.sprites[0],
    this.sprites[1]];
}

PlayerSummary.prototype.toString = function () {
    return this.toArray().join(",");
}*/

module.exports = UserHandler = cls.Class.extend({
    init: function(main, connection, server) {
        var self = this;

        this.server = server;
        this.main = main;
        this.connection = connection;

        this.currentPlayer = null;

        this.connection.listen(function(message) {
          console.info("recv="+JSON.stringify(message));
          var action = parseInt(message[0]);
          message.shift();

          //if (isWorld) {
            switch (action) {
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
              case Types.UserMessages.UW_LOAD_PLAYER_AUCTIONS:
                self.handleLoadPlayerAuctions(message);
                return;
              case Types.UserMessages.UW_LOAD_PLAYER_LOOKS:
                self.handleLoadPlayerLooks(message);
                return;

            }
          //}
          /*if (action == Types.UserMessages.CW_LOGIN_PLAYER) {
            self.handleLoginPlayer(message);
            return;
          }*/

        });

        this.loadedUser = false;
        this.loadedPlayer = false;

        this.looks = new Array(AppearanceData.Data.length);

        this.gems = 0;

        this.lastPacketTime = Date.now();
    },

    onClose: function (save) {
      console.warn("User.onClose - called.")
      if (this.name) {
        console.warn("name:"+this.name);
        users[this.name] = 0;
      }
      save = save || false;

      var p = this.player;
      if (save && p)
      {
        if (this.loadedPlayer)
          p.save();
        players.splice(players.indexOf(p),1);
        //console.warn(JSON.stringify(players));
        delete this.currentPlayer;
      }
      delete users[this.name];
      console.warn(JSON.stringify(users));
      this.connection.close("closing connection");
      delete this;
    },

    onExit: function() {
    },

    send: function(message) {
      this.connection.send(message);
    },

    loginPlayer: function (worldIndex, playerSummary)
    {
      if (worldIndex < 0 && worldIndex >= worlds.length)
        return false;

      console.info("worldIndex: "+worldIndex);
      var world = worlds[worldIndex];
      //console.info(JSON.stringify(world));

      var player = new Player(this, this.main, this.connection, world);
      player.name = playerSummary.name;
      player.hasLoggedIn = true;
      player.packetHandler.loadedPlayer = true;

      world.connect_callback(player);
      this.currentPlayer = player;

      this.loadedPlayer = true;
      return true;
    },

    /*modifyGems: function(diff) {
      diff = parseInt(diff);
      if ((this.gems - diff) < 0)
      {
        this.connection.send((new Messages.Notify("SHOP", "SHOP_NOGEMS")).serialize());
        return false;
      }
      this.gems += diff;
      this.connection.send((new Messages.Gold(this.currentPlayer)).serialize());
      return true;
    },*/

    handleLoadPlayerAuctions: function (msg) {
      console.info("handleLoadPlayerAuctions: "+JSON.stringify(msg));

      if (!msg)
        return;

      this.server.auctions.load(msg);
    },

    handleLoadPlayerLooks: function (msg) {
      console.info("handleLoadPlayerLooks: "+JSON.stringify(msg));

      if (!msg)
        return;

      this.server.looks.load(msg);
    },

    handleLoadUserInfo: function (msg) {
      console.info("handleLoadUserInfo: "+JSON.stringify(msg));

      var username = msg[0],
          hash = msg[1],
          gems = parseInt(msg[2]),
          looks = msg[3];

      var user = this.main.enterWorld(this.connection);
      //var user = {gems: gems,
        //looks: Utils.HexToBin(looks)};
      user.gems = gems;
      user.looks = Utils.HexToBin(looks);
      user.name = username;
      user.world = this;

      var player = new Player(user, user.main, this.connection, world);
      //player.name = playerSummary.name;
      //player.hasLoggedIn = true;
      player.hash = hash;
      player.loaded = 0;
      player.world = this;
      this.player = player;


      world.connect_callback(player);
      //this.currentPlayer = player;

      this.loadedPlayer = true;
    },

    handleLoadPlayerInfo: function (msg) {
      console.info("handleLoadPlayerInfo: "+JSON.stringify(msg));
      var player = this.player;
      player.name = msg.shift();

      //console.info(msg.toString());
      var db_player = {
          "name": msg[0],
          "map": msg[1].split(","),
          "stats": msg[2].split(","),
          "exps": msg[3].split(","),
          "gold": msg[4].split(","),
          "skills": msg[5].split(","),
          "pStats": msg[6].split(","),
          "sprites": msg[7].split(","),
          "colors": msg[8].split(","),
          "shortcuts": msg[9],
          "completeQuests": msg[10]
  // TODO - ADD IN REDIS
        };

      console.info("shortcuts: "+JSON.stringify(db_player.shortcuts));
      console.info("completeQuests: "+JSON.stringify(db_player.completeQuests));

      if (db_player.shortcuts) {
        db_player.shortcuts = JSON.parse(db_player.shortcuts);
      }

      if (db_player.completeQuests) {
        db_player.completeQuests = JSON.parse(db_player.completeQuests);
      }

      player.fillPlayerInfo(db_player);
      //player.hasLoggedIn = true;
      //player.packetHandler.loadedPlayer = true;

      this.handlePlayerLoaded();
    },

    handleLoadPlayerQuests: function (msg) {
      console.info("handleLoadPlayerQuests: "+JSON.stringify(msg));
      var player = this.player;
      var playerName = msg.shift();

      var quests = [];
      console.info("msg="+msg);
      dataJSON = JSON.parse(msg);
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
      this.handlePlayerLoaded();
    },

    handleLoadPlayerAchievements: function (msg) {
      console.info("handleLoadPlayerAchievements: "+JSON.stringify(msg));
      var player = this.player;
      var playerName = msg.shift();

      var achievements = getInitAchievements();
      var rec = msg.shift().split(',');
      var len = ~~(rec.length / 3);
      for (var i=0; i < len; ++i)
      {
        var achievement = getSavedAchievement(rec.splice(0,3));
        player.achievements.push(achievement);
      }
      for (var i=len; i < achievements.length; ++i)
      {
        player.achievements.push(achievements[i]);
      }
      this.handlePlayerLoaded();
    },

    handleLoadPlayerItems: function (msg) {
      console.info("handleLoadPlayerItems: "+JSON.stringify(msg));
      var player = this.player;
      var playerName = msg.shift();

      var type = msg.shift();

      var items = [];
      //console.info(pKey);
      console.info("getItems - data="+msg);
      dataJSON = JSON.parse(msg);
      for (var itemData of dataJSON) {
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
      var storeType = null;
      if (type == 0){
        player.inventory = new Inventory(player, 48, items);
        storeType = player.inventory;
      }
      else if (type == 1){
        player.bank = new Bank(player, 96, items);
        storeType = player.bank;
      }
      else if (type == 2){
        player.equipment = new Equipment(player, 5, items);
        storeType = player.equipment;
        player.equipment.setItem = function (index, item) {
          player.equipment._setItem(index, item);
          player.setRange();
        };
      }
      player.itemStore[type] = storeType;
      this.handlePlayerLoaded();
    },

    handlePlayerLoaded: function () {
        var player = this.player;
        player.loaded++;
        if (player.loaded == 6) {
          //this.main.send([500, "Hello"]);
          //player.initPacketHandler();
          //player.sendPlayerToClient();
          players.push(player);
          //player.sendPlayer(db_player);
          console.info("player hash: "+player.hash);
          hashes[player.hash] = player;
          this.send([Types.UserMessages.WU_PLAYER_LOADED,
            MainConfig.protocol,MainConfig.address,MainConfig.port]);
        }
    },

    sendToUserServer: function (msg) {
      if (this.connection)
        this.connection.send(msg.serialize());
      else
        console.info("userHandler: sendToUserServer called without connection being set: "+JSON.stringify(msg.serialize()));
    },

    sendAuctionsData: function (data) {
      this.sendToUserServer( new UserMessages.SavePlayerAuctions(data));
    },

    sendLooksData: function (data) {
      this.sendToUserServer( new UserMessages.SavePlayerLooks(data));
    },

    /*handleLoginPlayer: function (msg) {
      console.info("handleLoginPlayer: "+JSON.stringify(msg));
      var playername = msg[0],
        playerhash = msg[1];

      var player = hashes[playerhash];

      if (!player)
        return;

      player.start(this.connection);
    },*/

});
