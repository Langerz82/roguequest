
define(['gameclient', 'skillhandler', 'quest', 'config', 'achievement'], function(GameClient, SkillHandler, Quest, config, Achievement) {
  var UserClient = Class.extend({
      init: function(config, useServer) {
        var self = this;

        this.connection = null;
        this.config = config;

        this.handlers = {};
        this.handlers[Types.Messages.BI_SYNCTIME] = this.onSyncTime;
        this.handlers[Types.Messages.SC_ERROR] = this.onError;
        this.handlers[Types.Messages.SC_VERSION] = this.onVersion;
        this.handlers[Types.Messages.SC_PLAYER] = this.onPlayer;
        this.handlers[Types.Messages.SC_PLAYER_SUM] = this.onPlayerSummary;
        this.handlers[Types.Messages.SC_WORLDS] = this.onWorlds;

        this.useBison = false;
        this.versionChecked = false;

        this.useServer = useServer;
        this.enable();

        this.connect();
      },

      enable: function() {
          this.isListening = true;
      },

      disable: function() {
          this.isListening = false;
      },

      connect: function() {
          var self = this;
          var url = this.config.protocol + "://"+ this.config.host +":"+ this.config.port +"/";

          log.info("Trying to connect to server : "+url);
          app.$loginInfo.text("Connecting to RRO2 server...");

          var self = this;
          /*$.get('./rro2.pem', function(data) {
              //alert(data);
              certLoaded(self, data);
          });*/

          //var certLoaded = function(self, data) {
            self.connection = io(url, {
              forceNew: true,
              reconnection: false,
              timeout: 10000,
              //secure: true,
              //transports: ['websocket','polling'],
              transports: ['websocket'],
              //rejectUnauthorized: false,
              //ca: data
            });

            self.connection.on('connect', function() {
              log.info("Connected to server "+self.config.host+":"+self.config.port);
              self.onConnected();
            });

            self.connection.on('connect_error', function(e) {
              self._onError(["There has been an error connecting to RSO server try again soon."]);
              log.error(e, true);
            });

            self.onMessage = function(e) {
              console.warn("recv: "+e);
              var data = e.split(",");
              self.receiveAction(data);
            }
            self.connection.on('message', this.onMessage);

            self.connection.on('error', function(e) {
              self._onError(["There has been an error connecting to RSO server try again soon."]);
              log.error(e, true);
            });

            self.connection.on('disconnect', function() {
                log.debug("Connection closed");
                if(self.disconnected_callback) {
                    if(self.isTimeout) {
                        self._onError(["You have been disconnected for being inactive for too long"]);
                    } else {
                        self._onError(["The connection to RRO2 has been lost."]);
                    }
                }
            });
          //};
      },

      receiveAction: function(data) {
          var action = data.shift();
          if(this.handlers[action] && _.isFunction(this.handlers[action])) {
              this.handlers[action].call(this, data);
          }
          else {
              log.error("Unknown action : " + action);
          }
      },

      sendMessage: function(json) {
          var data;
          if(this.connection.connected === true) {
            console.warn("sent=" + JSON.stringify(json));
            if(this.useBison) {
              data = BISON.encode(json);
            } else {
              data = JSON.stringify(json);
            }
          try {
              this.connection.send("1"+data);
          } catch (err) {
            console.log(err);
          }
        }
      },

      onConnected: function() {
        log.info("Starting client/server handshake");

        this.sendSyncTime();

        /*switch (this.initialAction)
        {
        case 1: // login user.
          log.info("sendLogin");
          client.sendLoginUser();
          break;
        case 2: // create user.
          client.sendCreateUser();
          break;
        }*/
      },

      onPlayerSummary: function (data) {
        user.setPlayerSummary(data);

        var count = user.playerSum.length;
        for (var i=0; i < count; ++i)
        {
          var ps = user.playerSum[i];
          var option = ps.name + " Lv" + Types.getLevel(ps.exp);

          var o = new Option(option, i);
          $('#player_select').append(o);
        }

        app.loadWindow('user_window', 'player_window');
        $('#player_select').focus();

        if (count > 0) {
          $('#player_select option[value="'+(count-1)+'"]').attr("selected",true);
          app.showPlayerLoad();
          //$('#player_create').show();
          //$('#player_load').show();
          //$('#player_select').show();
          //$('#lbl_player_select').show();
        }


        if (count == 0)
        {
          app.showPlayerCreate();
          //$('#player_create_form').show();
          //$('#player_select').hide();
          //$('#lbl_player_select').hide();
        }
        else
        {
          $('#player_create_form').hide();
        }
      },

      onWorlds: function (data) {
        for (var i = 0; i < data.length; i += 4)
        {
          $("#player_server").append("<option value="+data[i]+">"+
            data[i+1]+" "+data[i+2]+"/"+data[i+3]+"</option");
        }
        $('#user_create').removeClass('loading');
        $('#user_load').removeClass('loading');
        app.$loginInfo.text("Connected.");
      },

      _onError: function (data) {
          var message = data[0];
          /*if (message == 'playerexists') {
            app.addValidationError(null, 'The playername you entered is not available.');
            return;
          }*/

          $('#container').addClass('error');
          $('#errorwindow .errordetails').html("<p>"+message+"</p>");
          app.loadWindow('loginwindow','errorwindow');
      },

      onVersion: function(data) {
        //var self;
        this.versionChecked = true;
        var version = data[0];
        var hash = data[1];
        this.hashChallenge = hash;
        log.info("onVersion: hash="+hash);

        log.info("config.build.version="+config.build.version);
        if (version != config.build.version)
        {
          $('#container').addClass('error');
          var errmsg = "Please download the new version of RRO2.<br/>";

          if (game.renderer.isMobile) {
            errmsg += "<br/>For mobile see: " + config.build.updatepage;
          } else {
            errmsg += "<br/>For most browsers press Ctrl+F5 to reload the game cache files.";
          }
          game.clienterror_callback(errmsg);
          if (this.tablet || this.mobile)
            window.location.replace(config.build.updatepage);
        }
      },

      onSyncTime: function (data) {
        setWorldTime(parseInt(data[0]), parseInt(data[1]))
      },

      onError: function (data) {
        var error = data[0];

        switch(error) {
          case 'full':
          case 'invalidlogin':
          case 'userexists':
          case 'playerexists':
          case 'loggedin':
          case 'invalidusername':
          case 'ban':
          case 'passwordChanged':
          case 'timeout':
            app.info_callback(data);
            return;
          case 'timeout':
            app.info_callback(data);
            self.isTimeout = true;
            return;
        }
        this._onError(data);
      },

      onPlayer: function(data) {
          //setWorldTime(data[0], data[1]);
          data.shift();
          data.shift();

          var p = game.player;

          p.id = parseInt(data.shift());
          p.name = data.shift();
          p.mapIndex = parseInt(data.shift());
          p.orientation = Types.Orientations.DOWN;
          p.x = parseInt(data.shift()), p.y = parseInt(data.shift());
          p.setPositionSpawn(p.x, p.y);

          p.setMaxHP(parseInt(data.shift()));
          p.setMaxEP(parseInt(data.shift()));
          //p.setClass(parseInt(data.shift()));

          p.exp = {
            base: parseInt(data.shift()),
            attack: parseInt(data.shift()),
            defense: parseInt(data.shift()),
            move: parseInt(data.shift()),
            sword: parseInt(data.shift()),
            bow: parseInt(data.shift()),
            hammer: parseInt(data.shift()),
            axe: parseInt(data.shift()),
            logging: parseInt(data.shift()),
            mining: parseInt(data.shift())
          };

          p.level = {
            base: Types.getLevel(p.exp.base),
            attack: Types.getAttackLevel(p.exp.attack),
            defense: Types.getDefenseLevel(p.exp.defense),
            move: Types.getMoveLevel(p.exp.move),
            sword: Types.getWeaponLevel(p.exp.sword),
            bow: Types.getWeaponLevel(p.exp.bow),
            hammer: Types.getWeaponLevel(p.exp.hammer),
            axe: Types.getWeaponLevel(p.exp.axe),
          }
          p.colors = [];
          p.colors[0] = parseInt(data.shift());
          p.colors[1] = parseInt(data.shift());

          p.gold = [];
          p.gold[0] = parseInt(data.shift()); // inventory gold.
          p.gold[1] = parseInt(data.shift()); // bank gold.
          p.gems = parseInt(data.shift());

          game.inventoryHandler.setCurrency(p.gold[0], p.gems);
          game.bankHandler.setGold(p.gold[1]);

          p.setMoveRate(500-p.level.move)

          p.stats.attack = parseInt(data.shift());
          p.stats.defense = parseInt(data.shift());
          p.stats.health = parseInt(data.shift());
          p.stats.energy = parseInt(data.shift());
          p.stats.luck = parseInt(data.shift());
          p.stats.free = parseInt(data.shift());

          // TODO fix item inits, and skill functions.
          var itemCount = parseInt(data.shift());
          if (itemCount > 0)
          {
            var items = [];
            var itemArray = data.splice(0,(itemCount*6)).parseInt();
            for(var i=0; i < itemCount; ++i)
            {
              var index = i*6;
              var itemRoom = new ItemRoom(
                itemArray[index+0],
                itemArray[index+1],
                itemArray[index+2],
                itemArray[index+3],
                itemArray[index+4],
                itemArray[index+5],
              );
              items.push(itemRoom);
            }
            game.equipmentHandler.setEquipment(items);
          }

          p.sprites = [];
          p.sprites[0] = parseInt(data.shift());
          p.sprites[1] = parseInt(data.shift());

          p.setWeaponSprite();
          p.setArmorSprite();
          p.setRange();

          var itemCount = parseInt(data.shift());
          if (itemCount > 0)
          {
            var items = [];
            var itemArray = data.splice(0,(itemCount*6)).parseInt();
            for(var i=0; i < itemCount; ++i)
            {
              var index = i*6;
              var itemRoom = new ItemRoom(
                itemArray[index+0],
                itemArray[index+1],
                itemArray[index+2],
                itemArray[index+3],
                itemArray[index+4],
                itemArray[index+5],
              );
              items.push(itemRoom);
            }
            game.inventoryHandler.initInventory(items);
          }

          var itemCount = parseInt(data.shift());
          if (itemCount > 0)
          {
            var items = [];
            var itemArray = data.splice(0,(itemCount*6)).parseInt();
            for(var i=0; i < itemCount; ++i)
            {
                var index = i*6;
                var itemRoom = new ItemRoom(
                  itemArray[index+0],
                  itemArray[index+1],
                  itemArray[index+2],
                  itemArray[index+3],
                  itemArray[index+4],
                  itemArray[index+5],
                );
                items.push(itemRoom);
            }
            game.bankHandler.initBank(items);
          }

          p.quests = {};
          var questCount = parseInt(data.shift());
          if (questCount > 0)
          {
            var questArray = data.splice(0,(questCount*13));
            questArray.parseInt();
            for(var i=0; i < questCount; ++i)
            {
              var index = i*13;
              p.quests[questArray[index]] = new Quest(questArray.slice(index,index+13));
            }
          }

          p.achievements = [];
          var achieveCount = parseInt(data.shift());
          if (achieveCount > 0)
          {
            var achieveArray = data.splice(0,(achieveCount*7));
            achieveArray.parseInt();
            var achievement = null;
            for(var i=0; i < achieveCount; ++i)
            {
              var index = i*7;
              achievement = new Achievement(achieveArray.slice(index,index+7));
              p.achievements.push(achievement);
            }
            game.achievementHandler.achievementReloadLog();
          }

          p.skillHandler = new SkillHandler(self);

          var skillCount = parseInt(data.shift());
          var skillExps = data.splice(0,skillCount);
          skillExps.parseInt();
          p.setSkills(skillExps);
          game.skillDialog.page.setSkills(skillExps);


          var shortcutCount = parseInt(data.shift());
          if (shortcutCount > 0)
          {
            var shortcutArray = data.splice(0,(shortcutCount*3));
            shortcutArray.parseInt();
            var shortcuts = [];
            for(var i=0; i < shortcutCount; ++i)
            {
              var index = i*3;
              shortcuts.push(shortcutArray.slice(index,index+3));
            }
            game.shortcuts.installAll(shortcuts);
          }

          game.onPlayerLoad(p);
      },

      sendSyncTime: function() {
          log.info("sendSyncTime");
          this.sendMessage([Types.Messages.BI_SYNCTIME,Date.now()]);
      },

      sendLoginUser: function (user) {
        this.sendMessage([Types.Messages.CS_LOGIN_USER,
                          user.username,
                          user.hash]);
      },

      sendCreateUser: function (user) {
        this.sendMessage([Types.Messages.CS_CREATE_USER,
                          user.username,
                          user.hash]);
      },

      sendRemoveUser: function (user) {
        this.sendMessage([Types.Messages.CS_REMOVE_USER,
                          user.username,
                          user.hash]);
      },

      sendLoginPlayer: function (worldIndex, playerIndex) {
        this.sendMessage([Types.Messages.CS_LOGIN_PLAYER,
                          worldIndex,
                          playerIndex]);
      },

      sendCreatePlayer: function (worldIndex, playerName) {
        this.sendMessage([Types.Messages.CS_CREATE_PLAYER,
          worldIndex,
          playerName]);
      }

  });

  return UserClient;

});
