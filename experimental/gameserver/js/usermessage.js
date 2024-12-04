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

UserMessages.SaveUserInfo = Message.extend({
    init: function (userName, data, hash) {
    	this.userName = userName;
      this.hash = hash;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.WU_SAVE_USER_INFO, this.userName, this.hash];
        return arr.concat(this.data);
    }
});

UserMessages.SavePlayerInfo = Message.extend({
    init: function (playerName, data) {
    	this.playerName = playerName;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.WU_SAVE_PLAYER_INFO, this.playerName];
        return arr.concat(this.data);
    }
});

UserMessages.SavePlayerQuests = Message.extend({
    init: function (playerName, data) {
    	this.playerName = playerName;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.WU_SAVE_PLAYER_QUESTS, this.playerName];
        return arr.concat(this.data);
    }
});

UserMessages.SavePlayerAchievements = Message.extend({
    init: function (playerName, data) {
    	this.playerName = playerName;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.WU_SAVE_PLAYER_ACHIEVEMENTS, this.playerName];
        return arr.concat(this.data);
    }
});

UserMessages.SavePlayerItems = Message.extend({
    init: function (playerName, type, data) {
    	this.playerName = playerName;
      this.type = type;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.WU_SAVE_PLAYER_ITEMS, this.playerName, this.type];
        return arr.concat(this.data);
    }
});
