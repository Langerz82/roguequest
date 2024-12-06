var _ = require('underscore');
var cls = require('./lib/class');
var Types = require('../shared/js/gametypes');
var Utils = require('./utils');
//var Quest = require('./quest');

var UserMessages = {};
module.exports = UserMessages;

var Message = cls.Class.extend({

});

UserMessages.WorldReady = Message.extend({
    init: function (user, protocol, address, port) {
    	this.user = user;
      this.protocol = protocol;
      this.address = address;
      this.port = port;
    },
    serialize: function () {
        return [Types.UserMessages.UC_WORLD_READY,
          this.user.name,
          this.user.playerName,
          this.user.hash,
          this.protocol,
          this.address,
          this.port];
    }
});

UserMessages.PlayerAuctions = Message.extend({
    init: function (data) {
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.UW_LOAD_PLAYER_AUCTIONS];
        return arr.concat(this.data);
    }
});

UserMessages.PlayerLooks = Message.extend({
    init: function (data) {
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.UW_LOAD_PLAYER_LOOKS];
        return arr.concat(this.data);
    }
});

UserMessages.SendLoadPlayerData = Message.extend({
    init: function (playerName, playerData) {
    	this.playerName = playerName;
      this.playerData = playerData;
    },
    serialize: function () {
        return [Types.UserMessages.UW_LOAD_PLAYER_DATA, this.playerName,
          this.playerData];
    }
});

/*
UserMessages.UserInfo = Message.extend({
    init: function (userName, data, hash) {
    	this.userName = userName;
      this.hash = hash;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.UW_LOAD_USER_INFO, this.userName, this.hash];
        return arr.concat(this.data);
    }
});


UserMessages.PlayerInfo = Message.extend({
    init: function (playerName, data) {
    	this.playerName = playerName;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.UW_LOAD_PLAYER_INFO, this.playerName];
        return arr.concat(this.data);
    }
});

UserMessages.PlayerQuests = Message.extend({
    init: function (playerName, data) {
    	this.playerName = playerName;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.UW_LOAD_PLAYER_QUESTS, this.playerName];
        return arr.concat(this.data);
    }
});

UserMessages.PlayerAchievements = Message.extend({
    init: function (playerName, data) {
    	this.playerName = playerName;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.UW_LOAD_PLAYER_ACHIEVEMENTS, this.playerName];
        return arr.concat(this.data);
    }
});

UserMessages.PlayerItems = Message.extend({
    init: function (playerName, type, data) {
    	this.playerName = playerName;
      this.type = type;
      this.data = data;
    },
    serialize: function () {
        var arr = [Types.UserMessages.UW_LOAD_PLAYER_ITEMS, this.playerName, this.type];
        return arr.concat(this.data);
    }
});
*/
