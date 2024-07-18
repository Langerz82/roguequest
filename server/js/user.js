
/* global require, module, log, DBH */

var cls = require("./lib/class"),
    _ = require("underscore"),
    crypto = require('crypto'),
    Messages = require("./message"),
    Utils = require("./utils"),
    formatCheck = require("./format").check,
    Types = require("../shared/js/gametypes"),
    bcrypt = require('bcrypt'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    AppearanceData = require("./data/appearancedata"),
    PacketHandler = require("./packethandler");
var CryptoJS = require("crypto-js");

function PlayerSummary(index, db_player) {
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
}

module.exports = User = cls.Class.extend({
    init: function(main, connection) {
        var self = this;

        this.main = main;
        this.connection = connection;

        this.currentPlayer = null;
        this.players = [];

        this.loadedUser = false;
        this.loadedPlayer = false;

        this.formatChecker = new FormatChecker();

        this.looks = new Array(AppearanceData.Data.length);

        this.gems = 0;

        this.listener = function(message) {
          console.info("recv[0]="+message);
          var action = parseInt(message[0]);
          if(!formatCheck(message)) {
              self.connection.close("Invalid "+Types.getMessageTypeAsString(action)+" message format: "+message);
              return;
          }
          message.shift();

          if (action === Types.Messages.BI_SYNCTIME)
          {
            self.handleSyncTime(message);
            return;
          }

          if (action === Types.Messages.CS_CREATE_USER)
          {
            self.handleCreateUser(message);
            return;
          }
          else if (action === Types.Messages.CS_LOGIN_USER) {
            self.handleLoginUser(message);
            return;
          }

          if (!self.loadedUser) {
            console.info("Cannot Login User: " + message);
            return;
          }

          if (action === Types.Messages.CS_CREATE_PLAYER) {
            self.handleCreatePlayer(message);
            return;
          }
          else if (action === Types.Messages.CS_LOGIN_PLAYER) {
            self.handleLoginPlayer(message);
            return;
          }
          else if (action === Types.Messages.CS_REMOVE_USER) {
            self.handleRemoveUser(message);
            return;
          }

          if (!self.loadedPlayer) {
            console.info("Cannot Login: " + message);
            return;
          }
        };
        this.connection.listen(this.listener);

        this.connection.onClose(function() {
          console.info("onClose - called");
          clearTimeout(this.disconnectTimeout);
          self.onExit();
          this.close("onClose");
          self.onClose();
        });
    },

    onClose: function (save) {
      console.warn("User.onClose - called.")
      if (this.name) {
        console.warn("name:"+this.name);
        users[this.name] = 0;
      }
      save = save || false;

      var p = this.currentPlayer;
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

    handleSyncTime: function (message) {
      var clientTime = parseInt(message[0]);
      var world = worlds[0];
      this.connection.sendUTF8([Types.Messages.BI_SYNCTIME, clientTime, Date.now()].join(","));
    },

    handleCreateUser: function(message)
    {
      var self = this;
      var name = Utils.sanitize(message[0]);
      var hash = Utils.sanitize(message[1]);
      hash = Utils.btoa(hash);

      console.info("Starting Client/Server Handshake");

      self.name = name.substr(0, 16).trim().toLowerCase();
      console.info("self.user.name=" + self.name);

      var bytes = CryptoJS.AES.decrypt(hash, this.hashChallenge);
      var decrypt = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      var current_date = (new Date()).valueOf().toString();
      var random = Math.random().toString();
      var salt = crypto.createHash('sha1').update(current_date + random).digest('hex');
      hash = crypto.createHash('sha1').update(decrypt + salt).digest('hex');

      try {
        if (!Utils.checkInputName(self.name)) {
          self.connection.sendUTF8(Types.Messages.SC_ERROR+"invalidusername");
          return;
        }
        self.hash = hash;
        //self.hash = crypto.createHash('sha1').update(hash + salt).digest('hex');
        self.salt = salt;
        DBH.createUser(self);
      } catch (e) {
        console.info('message=' + e.message);
        console.info('stack=' + e.stack);
      }
    },

    handleLoginUser: function(message)
    {
      var self = this;
      var name = Utils.sanitize(message[0]);
      var hash = Utils.sanitize(message[1]);
      hash = Utils.btoa(hash);

      console.info("Starting Client/Server Handshake");

      self.name = name.substr(0, 16).trim().toLowerCase();

      console.info("self.name=" + self.name);
      try {
        // Validate the username
        if (!Utils.checkInputName(self.name)) {
          self.connection.sendUTF8(Types.Messages.SC_ERROR+",invalidname");
          return;
        }
        self.hash = hash;

        DBH.loadUser(self);
      } catch (e) {
        console.info('message=' + e.message);
        console.info('stack=' + e.stack);
      }
    },

    handleRemoveUser: function(message)
    {
      var self = this;
      //var name = Utils.sanitize(message[0]);
      var hash = Utils.sanitize(message[1]);
      hash = Utils.btoa(hash);

      //console.info("Starting Client/Server Handshake");

      //self.name = name.substr(0, 16).trim().toLowerCase();

      console.info("self.name=" + self.name);
      try {
        // Validate the username
        /*if (!Utils.checkInputName(self.name)) {
          self.connection.sendUTF8(Types.Messages.SC_ERROR+",invalidname");
          return;
        }*/
        self.hash = hash;

        DBH.removeUser(self);
      } catch (e) {
        console.info('message=' + e.message);
        console.info('stack=' + e.stack);
      }
    },

    checkUser: function (db_user, skip_logged_in)
    {
      skip_logged_in = skip_logged_in || false;

      var curTime = Date.now();
      var banTime = db_user.banTime + db_user.banDuration;
      if (banTime > curTime) {
        this.connection.sendUTF8(Types.Messages.SC_ERROR+",ban");
        this.connection.close("Closing connection to: " + player.name);
        return false;
      }

      if (db_user.membershipTime > curTime) {
        user.membership = true;
      }

      // Check Password
      //console.info("db_user.hash=" + db_user.hash);
      //console.info("user.hash=" + user.hash);

      var bytes = CryptoJS.AES.decrypt(this.hash, this.hashChallenge);
      var decrypt = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      var hash = crypto.createHash('sha1').update(decrypt+db_user.salt).digest('hex');
      console.info("checkUser: "+hash+" != "+db_user.hash);
      if (hash != db_user.hash) {
        this.connection.sendUTF8(Types.Messages.SC_ERROR+",invalidlogin");
        if (++this.passwordTries > 3)
          this.connection.close("Wrong Password: " + this.name);
        return false;
      }

      console.warn(JSON.stringify(users));
      console.info("LOGIN: " + this.name);
      if (!skip_logged_in && users.hasOwnProperty(this.name) && users[this.name] == 1) {
        this.connection.sendUTF8(Types.Messages.SC_ERROR+",loggedin");
        return false;
      }

      users[this.name] = 1;
      this.hasLoggedIn = true;

      var d = new Date();
      var lastLoginTimeDate = new Date(db_user.lastLoginTime);

      return true;
    },

    sendPlayers: function(db_players)
    {
      this.loadedUser = true;
      if (!Array.isArray(db_players))
      {
        this.connection.sendUTF8(Types.Messages.SC_PLAYER_SUM+",0");
        return;
      }


      var sendMsg = [Types.Messages.SC_PLAYER_SUM, db_players.length];
      for (var i=0; i < db_players.length; ++i)
      {
        var dbp = db_players[i];

        var playerSum = new PlayerSummary(i, dbp);
        this.players.push(playerSum);
        sendMsg = sendMsg.concat(playerSum.toArray());
      }
      this.connection.sendUTF8(sendMsg.join(","));
    },

    handleCreatePlayer: function(message)
    {
      var self = this;

      var worldIndex = parseInt(message[0]);
      var name = Utils.sanitize(message[1]);
      //var pClass = parseInt(message[2]);

      var tmpPlayer = {
        name: name,
        //pClass: pClass
      };

      /**
       * Implement RSA Authorization
       */

      console.info("Starting Client/Server Handshake");

      // Always ensure that the name is not longer than a maximum length.
      // (also enforced by the maxlength attribute of the name input element).
      // After that, you capitalize the first letter.
      tmpPlayer.name = tmpPlayer.name.substr(0, 16).trim();

      // Validate the username
      if (!Utils.checkInputName(tmpPlayer.name)) {
        user.connection.sendUTF8(Types.Messages.SC_ERROR+",invalidname");
        return;
      }

      var db_player = {
        name: tmpPlayer.name,
        map: 0, // MapIndex.
        //pClass: tmpPlayer.pClass,
        exp: 0, // Base XP.
        colors: [0,0],
        sprites: [0,0]
      };

      var playerSummary = new PlayerSummary(this.players.length, db_player);
      this.players.push(playerSummary);

      console.info("self.player.name=" + db_player.name);
      try {
        var callback = function (db_player) {

          if (self.loginPlayer(worldIndex, playerSummary))
          {
            var p = self.currentPlayer;
            p.name = db_player.name;

            players.push(p);
            p.sendPlayer(db_player);
          }
        };
        DBH.createPlayer(this, db_player, callback);
      } catch (e) {
        console.info('message=' + e.message);
        console.info('stack=' + e.stack);
      }
    },

    handleLoginPlayer: function(message)
    {
      var worldIndex = parseInt(message[0]);
      var playerIndex = parseInt(message[1]);

      if (playerIndex < 0 && playerIndex >= this.players.length)
        return false;

      if (this.loginPlayer(worldIndex, this.players[playerIndex]))
        DBH.loadPlayer(this.currentPlayer);
    },

    loginPlayer: function (worldIndex, playerSummary)
    {
      if (worldIndex < 0 && worldIndex >= worlds.length)
        return false;
      //playerIndex = playerIndex || this.players.length-1;

      /*if (worldIndex < 0 && worldIndex >= worlds.length)
        return false;
      if (playerIndex < 0 && playerIndex >= this.players.length)
        return false;*/

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

    modifyGems: function(diff) {
      diff = parseInt(diff);
      if ((this.gems - diff) < 0)
      {
        this.connection.send((new Messages.Notify("SHOP", "SHOP_NOGEMS")).serialize());
        return false;
      }
      this.gems += diff;
      this.connection.send((new Messages.Gold(this.currentPlayer)).serialize());
      return true;
    }
});
