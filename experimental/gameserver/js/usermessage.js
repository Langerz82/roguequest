var _ = require('underscore');
var cls = require('./lib/class');
var Types = require('../shared/js/gametypes');
var Utils = require('./utils');
//var Quest = require('./quest');

var UserMessages = {};
module.exports = UserMessages;

var Message = cls.Class.extend({

});

UserMessages.SavePlayerAuctions = Message.extend({
    init: function (data) {
      this.data = data;
    },
    serialize: function () {
        return [Types.UserMessages.WU_SAVE_PLAYER_AUCTIONS].concat(this.data);
    }
});

UserMessages.SavePlayerLooks = Message.extend({
    init: function (data) {
      this.data = data;
    },
    serialize: function () {
        return [Types.UserMessages.WU_SAVE_PLAYER_LOOKS].concat(this.data);
    }
});

UserMessages.ServerInfo = Message.extend({
    init: function (serverName, count, maxCount, serverIP, serverPort, password) {
    	this.serverName = serverName;
      this.count = count;
      this.maxCount = maxCount;
      this.serverIP = serverIP;
      this.serverPort = serverPort;
      this.password = password;
    },
    serialize: function () {
        return [Types.UserMessages.WU_GAMESERVER_INFO,
          this.serverName,
          this.count,
          this.maxCount,
          this.serverIP,
          this.serverPort,
          this.password];
    }
});

UserMessages.SavePlayersList = Message.extend({
    init: function (data) {
        this.data = data;
    },
    serialize: function () {
        return [Types.UserMessages.WU_SAVE_PLAYERS_LIST,this.data];
    }
});


UserMessages.playerLoggedIn = Message.extend({
    init: function (username, playerName) {
      this.username = username;
    	this.playerName = playerName;
    },
    serialize: function () {
        return [Types.UserMessages.WU_PLAYER_LOGGED_IN, this.username,
          this.playerName];
    }
});

UserMessages.SavePlayerData = Message.extend({
    init: function (playerName, playerData) {
    	this.playerName = playerName;
      this.playerData = playerData;
    },
    serialize: function () {
        return [Types.UserMessages.WU_SAVE_PLAYER_DATA, this.playerName,
          this.playerData];
    }
});
