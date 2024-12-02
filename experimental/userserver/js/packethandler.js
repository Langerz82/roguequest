var cls = require("./lib/class"),
  _ = require("underscore"),
  Messages = require("./message"),
  Utils = require("./utils"),
  Types = require("../shared/js/gametypes"),
  ItemTypes = require("../shared/js/itemtypes"),
  bcrypt = require('bcrypt'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express();

module.exports = PacketHandler = Class.extend({
  init: function(user, main, connection) {
    this.user = user;
    this.main = main;
    this.connection = connection;

    var self = this;

    //this.connection.off('msg', this.player.user.listener);
    this.connection.listen(function(message) {
      console.info("recv="+JSON.stringify(message));
      var action = parseInt(message[0]);

      message.shift();

      switch (action) {
        case Types.UserMessages.WU_GAMESERVER_INFO:
          self.handleGameServerInfo(message);
          break;
        case Types.UserMessages.WU_SAVE_USER_INFO:
          self.handleSaveUserInfo(message);
          break;
        case Types.UserMessages.WU_SAVE_PLAYER_INFO:
          self.handleSavePlayerInfo(message);
          break;
        case Types.UserMessages.WU_SAVE_PLAYER_QUESTS:
          self.handleSavePlayerQuests(message);
          break;
        case Types.UserMessages.WU_SAVE_PLAYER_ACHIEVEMENTS:
          self.handleSavePlayerAchievements(message);
          break;
        case Types.UserMessages.WU_SAVE_PLAYER_ITEMS:
          self.handleSavePlayerItems(message);
          break;
      }
    });

    this.connection.onClose(function() {
      self.user.onClose(true);

      console.info("onClose - called");
      clearTimeout(this.disconnectTimeout);
      if (this.exit_callback) {
        this.exit_callback();
      }
      this.close("onClose");

    });

  },

  timeout: function() {
    this.connection.sendUTF8("timeout");
    this.connection.close("Player was idle for too long");
  },

  onExit: function(callback) {
    this.exit_callback = callback;
    /*try {
    throw new Error()
    }
    catch (e) { console.info(e.stack); }*/
  },

  onMessage: function(callback) {
    this.message_callback = callback;
  },

  sendToPlayer: function (player, message) {
    this.map.entities.pushToPlayer(player, message);
  },

  send: function(message) {
    this.connection.send(message);
  },



});
