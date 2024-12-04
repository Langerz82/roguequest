
/* global require, module, log, DBH */

var cls = require("./lib/class"),
    _ = require("underscore"),
    Utils = require("./utils"),
    Types = require("../shared/js/gametypes");
//    Main = require("./main"),
    UserMessages = require("./usermessage");
//    TaskHandler = require("./taskhandler");

module.exports = WorldHandler = cls.Class.extend({
    init: function(main, connection, userConnection) {
        var self = this;

        this.main = main;
        this.connection = connection;
        this.userConnection = userConnection;


        this.currentPlayer = null;

        this.connection.listen(function(message) {
          console.info("recv="+JSON.stringify(message));
          var action = parseInt(message[0]);
          message.shift();

          if (action == Types.Messages.CW_LOGIN_PLAYER) {
            self.handleLoginPlayer(message);
            return;
          }

        });
    },

    onExit: function() {
    },

    sendPlayer: function(message) {
      this.connection.send(message);
    },

    handleLoginPlayer: function (msg) {
      console.info("handleLoginPlayer: "+JSON.stringify(msg));
      var playername = msg[0],
        playerhash = msg[1];

      var player = hashes[playerhash];

      if (!player)
        return;

      player.start(this, this.connection);
    },

    loadPlayerDataUserInfo: function (player, callback) {
      var user = player.user;
      var data = [
        user.gems,
        Utils.BinToHex(user.looks)];

      if (callback)
        callback(user.name, data);
    },

    loadPlayerDataInfo: function (player, callback) {
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

      //var completeQuests = (Object.keys(player.completeQuests).length > 0) ? JSON.stringify(player.completeQuests) : 0;

      var hexLooks = Utils.BinToHex(player.user.looks);

      var data = [
        player.name,
        map.join(","),
        stats.join(","),
        exps.join(","),
        player.gold.join(","),
        skillexps.join(","),
        player.pStats.join(","),
        player.sprites.join(","),
        player.colors.join(","),
        JSON.stringify(player.shortcuts),
        JSON.stringify(player.completeQuests)];

      if (callback)
        callback(player.name, data);
    },

    loadPlayerDataQuests: function (player, callback) {
      var quests = [];
      if (!player.quests)
        player.quests = [];
      for (var quest of player.quests)
      {
        if (!quest || quest.status == QuestStatus.COMPLETE  || _.isEmpty(quest))
          continue;
        quests.push(quest.toString().split(","));
      }

      if (callback)
        callback(player.name, JSON.stringify(quests));
    },

    loadPlayerDataAchievements: function (player, callback) {
      var data = "";
      for (var achievement of player.achievements)
      {
          data += achievement.toRedis(achievement).join(',') + ",";
      }
      data = data.slice(0,-1);

      if (callback)
        callback(player.name, data);
    },

    loadPlayerDataItems: function (player, type, callback) {
      if (callback)
        callback(player.name, type, player.itemStore[type].toStringJSON());
    },

    sendToUserServer: function (msg) {
      if (this.userConnection)
        this.userConnection.send(msg.serialize());
      else
        console.info("worldHandler: sendToUserServer called without userConnection being set: "+JSON.stringify(msg.serialize()));
    },

    savePlayer: function (player) {
      var self = this;

      console.info("SAVING PLAYER: "+player.name);
      //try { throw new Error(); } catch(err) { console.info(err.stack); }
      var userName = player.user.name;
      var playerName = player.name;


  // // TODO:
      this.loadPlayerDataUserInfo(player, function (userName, db_data) {
        self.sendToUserServer( new UserMessages.SaveUserInfo(userName, db_data, ''));

        self.loadPlayerDataInfo(player, function (playerName, db_data) {
          self.sendToUserServer( new UserMessages.SavePlayerInfo(playerName, db_data));
        });

        self.loadPlayerDataQuests(player, function (playerName, db_data) {
          self.sendToUserServer( new UserMessages.SavePlayerQuests(playerName, db_data));
        });
        self.loadPlayerDataAchievements(player, function (playerName, db_data) {
          self.sendToUserServer( new UserMessages.SavePlayerAchievements(playerName, db_data));
        });

        self.loadPlayerDataItems(player, 0, function (playerName, type, db_data) {
          self.sendToUserServer( new UserMessages.SavePlayerItems(playerName, type, db_data));
        });
        self.loadPlayerDataItems(player, 1, function (playerName, type, db_data) {
          self.sendToUserServer( new UserMessages.SavePlayerItems(playerName, type, db_data));
        });
        self.loadPlayerDataItems(player, 2, function (playerName, type, db_data) {
          self.sendToUserServer( new UserMessages.SavePlayerItems(playerName, type, db_data));
        });

      });
    },

});
