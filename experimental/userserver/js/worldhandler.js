
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
    init: function(main, connection) {
        var self = this;

        this.main = main;
        this.connection = connection;

        this.SAVED_AUCTIONS = false;
        this.SAVED_LOOKS = false;
        this.SAVED_PLAYERS = false;
        this.savePlayers = [];
        this.playerLoadData = {};

        this.block = false;
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
              case Types.UserMessages.WU_SAVE_PLAYER_DATA:
                self.handleSavePlayerData(message);
                return;
            }
          }
          if (action == Types.UserMessages.WU_SAVE_PLAYERS_LIST) {
              self.handleSavePlayersList(message);
              return;
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

    handleSavePlayersList: function (msg) {
      console.info("handleSavePlayersList: "+JSON.stringify(msg));
      this.SAVED_PLAYERS = false;
      this.savePlayers = {};
      for (var rec of msg)
      {
        this.savePlayers[rec] = 0;
      }
      if (Object.keys(this.savePlayers).length == 0)
        this.SAVED_PLAYERS = true;
    },

    handleSavePlayerAuctions: function (msg) {
      console.info("handleSavePlayerAuctions: "+JSON.stringify(msg));
      var self = this;
      DBH.saveAuctions(this.worldIndex, msg, function (player) {
        self.SAVED_AUCTIONS = true;
      });
    },

    handleSavePlayerLooks: function (msg) {
      console.info("handleSavePlayerLooks: "/*+JSON.stringify(msg)*/);
      var self = this;
      DBH.saveLooks(this.worldIndex, msg, function () {
        self.SAVED_LOOKS = true;
      });
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

      var index = 0
      for (var tworld of worlds)
      {
        if (world.ipAddress == tworld.ipAddress &&
            world.port == tworld.port)
        {
          tworld.name = world.name;
          tworld.count = world.count;
          tworld.maxCount = world.maxCount;
          break;
          //return;
        }
        index++;
      }

      this.worldIndex = index;
      if (index == worlds.length)
        worlds.push(world);
      this.world = world;

      this.sendAuctionsToWorld(this.worldIndex);
      this.sendLooksToWorld(this.worldIndex);
    },

// TODO FIX - Add playername in packet.

    handleSavePlayerData: function (msg) {
      console.info("handleSavePlayerData: "+JSON.stringify(msg));

      var self = this;
      var playerName = msg[0];

      var data = msg[1];

      this.savePlayers[playerName] = 0;

      var checkPlayerSaved = function (playerName) {
          self.savePlayers[playerName]++;
          if (self.savePlayers[playerName] == 7)
          delete self.savePlayers[playerName];
          if (Object.keys(self.savePlayers).length == 0)
            self.SAVED_PLAYERS = true;
      };

      // NOTE - Remove the userame and hash from the data.
      var username = data[0].shift();
      var hash = data[0].shift();

      DBH.savePlayerUserInfo(username, playerName, data[0], function (username, playerName, data) {
        checkPlayerSaved(playerName);
      });

      DBH.savePlayerInfo(playerName, data[1], function (playerName) {
        checkPlayerSaved(playerName);
      });

      DBH.saveQuests(playerName, data[2], function (playerName) {
        checkPlayerSaved(playerName);
      });

      DBH.saveAchievements(playerName, data[3], function (playerName) {
        checkPlayerSaved(playerName);
      });

      DBH.saveItems(playerName, 0, data[4], function (playerName) {
        checkPlayerSaved(playerName);
      });

      DBH.saveItems(playerName, 1, data[5], function (playerName) {
        checkPlayerSaved(playerName);
      });

      DBH.saveItems(playerName, 2, data[6], function (playerName) {
        checkPlayerSaved(playerName);
      });

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

    sendWorldSave: function () {
      console.info("worldHandler - sendForceSaveAndCloseToWorld.");
      this.send([Types.UserMessages.UW_WORLD_SAVE]);
    },

    sendWorldClose: function () {
      console.info("worldHandler - sendForceSaveAndCloseToWorld.");
      this.send([Types.UserMessages.UW_WORLD_CLOSE]);
    },

    savedWorldState: function () {
      return this.SAVED_PLAYERS && this.SAVED_LOOKS && this.SAVED_AUCTIONS;
    },

    sendPlayerToWorld: function (user, username, playername) {
      console.info("sendPlayerToWorld");
      var self = this;

      this.user = user;

      console.info("SENDING USERNAME: "+username);
      console.info("SENDING PLAYER: "+playername);

      var checkLoadDataFull = function (playername, index, db_data) {
        var objData = self.playerLoadData[playername];
        objData.count++;
        objData.data[index] = db_data;
        if (objData.count == 7)
        {
          self.sendMessage( new UserMessages.SendLoadPlayerData(playername, objData.data));
          delete self.playerLoadData[playername];
        }
        else {
          self.playerLoadData[playername] = objData;
        }
      };

      DBH.loadPlayerUserInfo(username, function (username, db_data) {
        var objData = {};
        objData.data = new Array(7);
        objData.count = 0;
        //objData.username = username;

        self.playerLoadData[playername] = objData;

        // Little bit of a workaround to marshal user data across.
        db_data.unshift(self.user.hash);
        db_data.unshift(username);
        checkLoadDataFull(playername, 0, db_data);

        DBH.loadPlayerInfo(playername, function (playername, db_data) {
          checkLoadDataFull(playername, 1, db_data);
        });
        DBH.loadQuests(playername, function (playername, db_data) {
          checkLoadDataFull(playername, 2, db_data);
        });
        DBH.loadAchievements(playername, function (playername, db_data) {
          checkLoadDataFull(playername, 3, db_data);
        });
        // INVENTORY
        DBH.loadItems(playername, 0, function (playername, db_data) {
          checkLoadDataFull(playername, 4, db_data);
        });
        // BANK
        DBH.loadItems(playername, 1, function (playername, db_data) {
          checkLoadDataFull(playername, 5, db_data);
        });
        // EQUIPMENT
        DBH.loadItems(playername, 2, function (playername, db_data) {
          checkLoadDataFull(playername, 6, db_data);
        });
      });
    },
});
