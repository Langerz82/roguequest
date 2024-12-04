
/* global require, module, log, DBH */

var cls = require("./lib/class"),
    _ = require("underscore"),
    UserMessages = require("./usermessage"),
    Utils = require("./utils"),
    Types = require("../shared/js/gametypes"),
    AppearanceData = require("./data/appearancedata"),
    SkillData = require("./data/skilldata");
//    PacketHandler = require("./packethandler");

module.exports = WorldHandler = cls.Class.extend({
    init: function(main, connection, worldIndex) {
        var self = this;

        this.main = main;
        this.connection = connection;
        this.worldIndex = worldIndex;

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
          if (action == Types.UserMessages.WU_SAVE_PLAYER_AUCTIONS) {
              self.handleSavePlayerAuctions(message);
              return
          }
          if (action == Types.UserMessages.WU_SAVE_PLAYER_LOOKS) {
              self.handleSavePlayerLooks(message);
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

    handleSavePlayerAuctions: function (msg) {
      console.info("handleSavePlayerAuctions: "+JSON.stringify(msg));

      DBH.saveAuctions(this.worldIndex, msg);
      /*DBH.saveAuctions(this.worldIndex, msg, function () {
        self.send([Types.UserMessages.UW_SAVED_PLAYER_AUCTIONS]);
      });*/
    },

    handleSavePlayerLooks: function (msg) {
      var self = this;
      console.info("handleSavePlayerLooks: "+JSON.stringify(msg));

      DBH.saveLooks(this.worldIndex, msg);
      /*DBH.saveLooks(this.worldIndex, msg, function () {
        self.send([Types.UserMessages.UW_SAVED_PLAYER_LOOKS]);
      });*/
    },

    handleGameServerInfo: function (msg) {
      console.info("handleGameServerInfo: "+JSON.stringify(msg));
      var self = this;

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

      this.worldIndex = worlds.length;
      worlds.push(world);

      this.sendAuctionsToWorld(this.worldIndex);
      this.sendLooksToWorld(this.worldIndex);

      /*setTimeout(function () {
        self.sendAuctionsToWorld(self.worldIndex);
        self.sendLooksToWorld(self.worldIndex);
      }, 1000);*/
    },

    handleSaveUserInfo: function (msg) {
      console.info("handleSaveUserInfo: "+JSON.stringify(msg));
      var userName = msg.shift();

      DBH.savePlayerUserInfo(userName, msg);
    },

    handleSavePlayerInfo: function (msg) {
      console.info("handleSavePlayerInfo: "+JSON.stringify(msg));
      var playerName = msg.shift();

      DBH.savePlayerInfo(playerName, msg);
    },

    handleSavePlayerQuests: function (msg) {
      console.info("handleSavePlayerQuests: "+JSON.stringify(msg));
      var playerName = msg[0];

      DBH.saveQuests(playerName, msg[1]);
    },

    handleSavePlayerAchievements: function (msg) {
      console.info("handleSavePlayerAchievements: "+JSON.stringify(msg));
      var playerName = msg[0];

      DBH.saveAchievements(playerName, msg[1]);
    },

    handleSavePlayerItems: function (msg) {
      console.info("handleSavePlayerItems: "+JSON.stringify(msg));
      var playerName = msg[0],
          type = parseInt(msg[1]);

      DBH.saveItems(playerName, type, msg[2]);
    },

    handlePlayerLoaded: function (msg) {
        console.info("handlePlayerLoaded");
        var protocol = msg[0],
            address = msg[1],
            port = msg[2];

        this.sendClient(new UserMessages.WorldReady(this.user,
          protocol, address, port));
        this.block = false;
    },

    handleCreatePlayerInfo: function (playername) {
      console.info("handleCreatePlayerInfo");
      var data = [
        playername,                          // name
        "0,0,0,0",                           // map
        "2,2,2,2,2,0",                       // stats
        "0,0,0,0,0,0,0,0,0,0",               // exps
        "0,0",                               // gold
        "0,0,0,0,0",                         // skills
        "0,0",                               // pStats
        "77,0,151,50",                       // sprites
        "0,0",                               // colors
        "{}",                        // shortcuts
        "[]"                                   // completeQuests
      ];

      return data;
    },

    handleCreatePlayerQuests: function (playername) {
      console.info("handleCreatePlayerQuests");
      return "[]";
    },

    handleCreatePlayerAchievements: function (playername) {
      console.info("handleCreatePlayerAchievements");
      return "[]";
    },

    handleCreatePlayerItems: function (playername) {
      console.info("handleCreatePlayerItems");
      return "[]";
    },

    createPlayerToWorld: function(user, username, playername) {
      console.info("createPlayerToWorld");
      var self = this;

      this.block = true;
      this.user = user;

      console.info("SENDING USERNAME: "+username);
      console.info("SENDING PLAYER: "+playername);

      DBH.loadPlayerUserInfo(username, function (username, db_data) {
        self.sendMessage( new UserMessages.UserInfo(username, db_data, user.hash));

        var data = self.handleCreatePlayerInfo(playername);
        self.sendMessage( new UserMessages.PlayerInfo(playername, data));

        data = self.handleCreatePlayerQuests(playername);
        self.sendMessage( new UserMessages.PlayerQuests(playername, data));

        data = self.handleCreatePlayerAchievements(playername);
        self.sendMessage( new UserMessages.PlayerAchievements(playername, data));

        data = self.handleCreatePlayerItems(playername);
        self.sendMessage( new UserMessages.PlayerItems(playername, 0, data));

        data = self.handleCreatePlayerItems(playername);
        self.sendMessage( new UserMessages.PlayerItems(playername, 1, data));

        data = self.handleCreatePlayerItems(playername);
        self.sendMessage( new UserMessages.PlayerItems(playername, 2, data));
      });
    },

    sendAuctionsToWorld: function (worldindex) {
      var self = this;
      DBH.loadAuctions(worldindex, function (worldIndex, db_data) {
        console.info("sendAuctionsToWorld: "+JSON.stringify(db_data));
        self.sendMessage( new UserMessages.PlayerAuctions(db_data));
      });
    },



    sendLooksToWorld: function (worldindex) {
      var self = this;
      DBH.loadLooks(worldindex, function (worldIndex, db_data) {
        self.sendMessage( new UserMessages.PlayerLooks(db_data));
      });
    },

    sendAuctionsSavedToWorld: function () {
      this.send([UW_SAVED_PLAYER_AUCTIONS]);
    },

    sendLooksSavedToWorld: function () {
      this.send([UW_SAVED_PLAYER_LOOKS]);
    },

    sendPlayerToWorld: function (user, username, playername) {
      console.info("sendPlayerToWorld");
      var self = this;

      this.block = true;
      this.user = user;

      console.info("SENDING USERNAME: "+username);
      console.info("SENDING PLAYER: "+playername);

      DBH.loadPlayerUserInfo(username, function (username, db_data) {
        self.sendMessage( new UserMessages.UserInfo(username, db_data, user.hash));

        DBH.loadPlayerInfo(playername, function (playername, db_data) {
          self.sendMessage( new UserMessages.PlayerInfo(playername, db_data));

          DBH.loadQuests(playername, function (playername, db_data) {
            self.sendMessage( new UserMessages.PlayerQuests(playername, db_data));
          });
          DBH.loadAchievements(playername, function (playername, db_data) {
            self.sendMessage( new UserMessages.PlayerAchievements(playername, db_data));
          });
          // INVENTORY
          DBH.loadItems(playername, 0, function (playername, db_data) {
            self.sendMessage( new UserMessages.PlayerItems(playername, 0, db_data));
          });
          // BANK
          DBH.loadItems(playername, 1, function (playername, db_data) {
            self.sendMessage( new UserMessages.PlayerItems(playername, 1, db_data));
          });
          // EQUIPMENT
          DBH.loadItems(playername, 2, function (playername, db_data) {
            self.sendMessage( new UserMessages.PlayerItems(playername, 2, db_data));
          });
        });
      });
    },
});
