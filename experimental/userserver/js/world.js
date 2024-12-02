
/* global require, module, log, DBH */

var cls = require("./lib/class"),
    _ = require("underscore"),
    Messages = require("./message"),
    Utils = require("./utils"),
    Types = require("../shared/js/gametypes"),
    AppearanceData = require("./data/appearancedata");
//    PacketHandler = require("./packethandler");

module.exports = World = cls.Class.extend({
    init: function(main, connection) {
        var self = this;

        this.main = main;
        this.connection = connection;
        this.black = false;
        this.listener = function(message) {
          console.info("recv[0]="+message);
          var action = parseInt(message[0]);
          message.shift();

          if (!this.block)
          {
            switch (action)
            {
              case Types.UserMessages.WU_GAMESERVER_INFO:
                self.handleGameServerInfo(message);
                return;
              case Types.UserMessages.WU_SAVE_USER_INFO:
                self.handleSaveUserInfo(message);
                return;
              case Types.UserMessages.WU_SAVE_PLAYER_INFO:
                self.handleSavePlayerInfo(message);
                return;
              case Types.UserMessages.WU_SAVE_PLAYER_QUESTS:
                self.handleSavePlayerQuests(message);
                return;
              case Types.UserMessages.WU_SAVE_PLAYER_ACHIEVEMENTS:
                self.handleSavePlayerAchievements(message);
                return;
              case Types.UserMessages.WU_SAVE_PLAYER_ITEMS:
                self.handleSavePlayerItems(message);
                return;
            }
          }
          if (action == Types.UserMessages.WU_PLAYER_LOADED) {
              self.handlePlayerLoaded(message);
              return;
          }
        };
        this.connection.listen(this.listener);

        this.connection.onClose(function() {
          console.info("onClose - called");
          self.onExit();
          this.close("onClose");
          self.onClose();
        });
    },

    onClose: function (save) {
    },

    onExit: function() {
    },

    send: function(message) {
      this.connection.send(message);
    },

    sendClient: function(message) {
      if (this.user)
        this.user.connection.send(message.serialize());
      else {
        console.warn("sendClient called without user set: "+JSON.stringify(message.serialize()))
      }
    },

    sendMessage: function(message) {
      this.connection.send(message.serialize());
    },

    handleGameServerInfo: function (msg) {
      console.info("handleGameServerInfo: "+JSON.stringify(msg));

      var world = {
        name: msg[0],
        count: parseInt(msg[1]),
        maxCount: parseInt(msg[2]),
        ipAddress: msg[3],
        port: parseInt(msg[4]),
        password: msg[5]
      };

      if (world.password == MainConfig.user_password) {
        this.game_server = true;
      }
      else {
        return;
      }

      for (var tworld of worlds)
      {
        if (world.ipAddress == tworld.ipAddress &&
            world.port == tworld.port)
          {
            tworld.name = world.name;
            tworld.count = world.count;
            tworld.maxCount = world.maxCount;
            return;
          }
      }

      worlds.push(world);
    },

    handleSaveUserInfo: function (msg) {
      var userName = msg.shift();

      DBH.savePlayerUserInfo(userName, msg);
    },

    handleSavePlayerInfo: function (msg) {
      var playerName = msg.shift();

      DBH.savePlayerInfo(playerName, msg);
    },

    handleSavePlayerQuests: function (msg) {
      var playerName = msg.shift();

      DBH.saveQuests(playerName, msg);
    },

    handleSavePlayerAchievements: function (msg) {
      var playerName = msg.shift();

      DBH.saveAchievements(playerName, msg);
    },

    handleSavePlayerItems: function (msg) {
      var playerName = msg.shift(),
          type = parseInt(msg.shift());

      DBH.saveItems(playerName, type, msg);
    },

    handlePlayerLoaded: function (msg) {
        console.info("handlePlayerLoaded");
        var protocol = msg[0],
            address = msg[1],
            port = msg[2];

        this.sendClient(new Messages.WorldReady(this.user,
          protocol, address, port));
        this.block = false;
    },

    sendPlayerToWorld: function (user, userName, playerName) {
      var self = this;

      this.block = true;
      this.user = user;

      console.info("SENDING USERNAME: "+userName);
      console.info("SENDING PLAYER: "+playerName);

      DBH.loadPlayerUserInfo(userName, function (userName, db_data) {
        self.sendMessage( new Messages.UserInfo(userName, db_data, user.hash));

        DBH.loadPlayerInfo(playerName, function (playerName, db_data) {
          self.sendMessage( new Messages.PlayerInfo(playerName, db_data));

          DBH.loadQuests(playerName, function (playerName, db_data) {
            self.sendMessage( new Messages.PlayerQuests(playerName, db_data));
          });
          DBH.loadAchievements(playerName, function (playerName, db_data) {
            self.sendMessage( new Messages.PlayerAchievements(playerName, db_data));
          });
          // INVENTORY
          DBH.loadItems(playerName, 0, function (playerName, db_data) {
            self.sendMessage( new Messages.PlayerItems(playerName, 0, db_data));
          });
          // BANK
          DBH.loadItems(playerName, 1, function (playerName, db_data) {
            self.sendMessage( new Messages.PlayerItems(playerName, 1, db_data));
          });
          // EQUIPMENT
          DBH.loadItems(playerName, 2, function (playerName, db_data) {
            self.sendMessage( new Messages.PlayerItems(playerName, 2, db_data));
          });
        });
      });
    },
});
