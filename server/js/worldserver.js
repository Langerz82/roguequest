/**
 * @type GameWorld Handler
 */
var cls = require("./lib/class"),
    _ = require("underscore"),
    Log = require('log'),
    Entity = require('./entity/entity'),
    EntitySpawn = require('./entityspawn'),
    Character = require('./entity/character'),
    NpcStatic = require('./entity/npcstatic'),
    NpcMove = require('./entity/npcmove'),
    Player = require('./entity/player'),
    Item = require('./entity/item'),
    Chest = require('./entity/chest'),
    Mob = require('./entity/mob'),
    Node = require('./entity/node'),

    Map = require('./map'),
    MapManager = require('./mapmanager'),
    MapEntities = require('./mapentities'),
    NpcData = require('./data/npcdata'),
    ItemData = require('./data/itemdata'),
    AppearanceData = require('./data/appearancedata'),
    Messages = require('./message'),
    MobData = require("./data/mobdata"),
    Utils = require("./utils"),
    Types = require("../shared/js/gametypes"),
    ItemTypes = require("../shared/js/itemtypes"),
    PlayerController = require("./playercontroller"),
    NpcMoveController = require("./npcmovecontroller"),
    SkillData = require("./data/skilldata"),
    util = require("util"),
    Pathfinder = require("./pathfinder"),
    NotifyData = require("./data/notificationdata.js"),
    Products = require("../shared/data/products.json"),
    Updater = require("./updater"),
    Auction = require("./auction"),
    Looks = require("./looks"),
    Party = require("./party"),
    TaskHandler = require("./taskhandler");


/**
 * Always use instanced self = this;
 * and follow conventions.
 */

module.exports = World = cls.Class.extend(
{
    init: function(id, maxPlayers, socket, database)
    {
        var self = this;

        self.id = id;
        self.maxPlayers = maxPlayers;
        self.socket = socket;
        self.database = database;

        //self.updater = new Updater(self);
		    //self.database.deleteEmptyPlayers();
/*        self.database.createLeaderBoard();
        setInterval(function()
        {
            self.database.createLeaderBoard();
        }, 300000);
*/

        //self.database.deleteAllItems();
        //self.database.deleteAllQuests();
		//self.database.deleteAllStats();
		//self.database.deleteEmptyPlayers();

        // New Several Maps per World Server.
        self.mapManager = new MapManager(self);
        self.taskHandler = new TaskHandler();

        self.maps = self.mapManager.maps;

        self.party = [];

        self.itemCount = 0;

        self.uselessDebugging = false;

        self.expMultiplier = 0.0;

        //self.pvpManager = new PVPManager(self);

        self.mapManager.onMapsReady(function ()
        {
             console.info("ALL MAPS LOADED BITCHES!");
             //self.Wheather = new Wheather(self);
             self.maps = self.mapManager.maps;
             for (mapId in self.maps)
             {
               var map = self.maps[mapId];
               map.updater = new Updater(self, map);

             }
        });

        self.bets = [];

        self.products = JSON.parse(JSON.stringify(Products));

        self.auction = new Auction();
        self.looks = new Looks();

        self.lastUpdateTime = Date.now();

        /**
         * Handlers
         */
        self.onPlayerConnect(function(player)
        {
            player.map = self.maps[1];

            //var pos = player.map.enterCallback(player);
            //player.setPosition(pos.x, pos.y);
        });

        self.onPlayerEnter(function(player)
        {
            console.info("Player: " + player.name + " has entered the " + player.map.name + " map.");

            player.map.entities.pushBroadcast(new Messages.Notify("MAP", "MAP_ENTERED", [player.name, player.map.name]), true);

            player.onDeath(function()
            {
                player.forEachAttacker(function (c) {
                  c.removeAttacker(player);
                  if (c instanceof Mob)
                    c.forgetPlayer(player.id);
                });
                //player.map.entities.pushBroadcast(new Messages.ChangePoints(player, 0, 0), player);
            });

            //console.info(JSON.stringify(player.map));
            //player.map.entities.pushRelevantEntityListTo(player);

            var move_callback = function(p)
            {
                //console.info("move_callback");
                //if (self.uselessDebugging)
                    //console.info("Player: " + player.name + " position set to: " + x + " " + y);

                //player.flagPVP(self.map.isPVP(x, y));

                /*player.forEachAttacker(function(mob)
                {
                    if (mob.target == null)
                        player.removeAttacker(mob);

                    if (mob.target)
                        var target = mob.map.entities.getEntityById(mob.target.id);
                    if (target && target instanceof Mob)
                    {
                        //console.info("id=" + mob.id + ",x=" + x + ",y=" + y);
                        console.info("aggroRange=" + mob.aggroRange);
                        self.moveEntity(mob, pos.x, pos.y);

                    }
                });*/
                //player.map.entities.pushBroadcast(new Messages.Spawn(player), player.id);
                //zone_callback(player);
            };


            player.packetHandler.onMove(move_callback.bind(player));

            //player.packetHandler.onZone(zone_callback);


            player.packetHandler.onBroadcast(function(message, ignoreSelf)
            {
                //console.info("onBroadcast");
                player.map.entities.pushBroadcast(message, ignoreSelf ? player.id : null);
            });

            /*player.packetHandler.onBroadcastToZone(function(message, ignoreSelf)
            {
                //console.info("onBroadcastToZone");
                player.map.entities.pushToGroup(player.group, message, ignoreSelf ? player.id : null);
            });*/

            player.packetHandler.onExit(function()
            {
                console.info("Player: " + player.name + " has exited the world.");

                player.map.entities.removePlayer(player);

                if (player.party)
                {
                    var party = player.party;
                    party.removePlayer(player);
                    player.packetHandler.handlePartyAbandoned(party);
                }

                if (self.removed_callback)
                    self.removed_callback();
            });

            //player.map.entities.handleEntityGroupMembership(player);
            //player.map.entities.pushRelevantEntitySpawnTo(player);

            if (self.added_callback)
                self.added_callback();

        });

        self.onEntityAttack(function(attacker)
        {
            if (!attacker.target)
                return;

            //var target = attacker.map.entities.getEntityById(attacker.target.id);
            /*if (target && attacker.type == "mob") {
                var pos = self.findPositionNextTo(attacker, target);
                //attacker.follow(target);
                self.moveEntity(attacker, pos.x, pos.y);
            }*/
            //if (attacker instanceof Pet)
            //    attacker.hit();
        });


        self.onRegenTick(function()
        {
            for (mapId in self.maps)
            {
                var map = self.maps[mapId];
                if (map && map.isLoaded && map.entities)
                {
                    map.entities.forEachPlayer(function(character)
                    {
                        if (character instanceof Player)
                        {
                            if (!character.isDead && !character.hasFullHealth() && !character.isAttacked())
                            {
                                var packet = character.modHealthBy(Math.floor(character.stats.hpMax / 8));
                                //character.map.entities.pushNeighbours(character, packet);
                            }
                        }
                    });
                    map.entities.forEachMob(function(character)
                    {
                        if (character instanceof Mob)
                        {
                            if (!character.isDead && !character.hasFullHealth() && !character.isAttacked() &&
                                character.x == character.spawnX && character.y == character.spawnY)
                            {
                                //console.info("stats="+JSON.stringify(character.stats));
                                var packet = character.modHealthBy(Math.floor(character.stats.hpMax / 8));
                                //character.map.entities.pushNeighbours(character, packet);
                            }
                        }
                    });
                }
            }
        });

        // Notifications.
        self.notify = NotifyData.Notifications;
        for (var id in self.notify)
        {
            self.notify[id].lastTime = Date.now() - this._idleStart;
        }
        setInterval(function()
        {
            for (var id in self.notify)
            {
                var notify = self.notify[id];
                if (Date.now() - notify.lastTime >= notify.interval * 60000)
                {
                    self.pushWorld(new Messages.Notify("NOTICE", notify.textid));
                    notify.lastTime = Date.now();
                }
            }
        }, 60000);

    },

    stop: function ()
    {
      /*for (mapId in self.maps)
      {
          var map = self.maps[mapId];
          if (map && map.entities && map.entities.players &&
              Object.keys(map.entities.players).length > 0)
          {
            for (pId in map.entities.players)
            {
              var p = map.entities.players[pId];
              p.save();
            }
          }
      }*/
      this.save();
    },

    save: function ()
    {
      for (mapId in this.maps)
      {
          var map = this.maps[mapId];
          if (map && map.isLoaded && map.entities)
          {
              var savedPlayers = 0;
              map.entities.forEachPlayer(function(p)
              {
                  p.save();
                  if (p.isSaved)
                    savedPlayers++;
              });
              if (map.entities.players.length == savedPlayers)
                PLAYERS_SAVED = true;
          }
      }
      this.auction.save();
      this.looks.save();
    },

    update: function () {
      var self = this;

      /*if ((Date.now() - this.lastUpdateTime) < ~~(G_UPDATE_INTERVAL)) {
        //self.update();
        console.info("world update skipped. "+(Date.now() - this.lastUpdateTime));
        setImmediate(self.update.bind(self));
        //setTimeout(self.update.bind(self));
        return;
      }*/

      this.lastUpdateTime = Date.now();
      //console.info("world update called.");
      for (mapId in self.maps)
      {
          var map = self.maps[mapId];
          if (map && map.ready && map.entities && map.updater &&
              Object.keys(map.entities.players).length > 0)
          {
              //map.entities.processPackets();
              map.updater.update();
          }
      }

      //self.update();
      //setTimeout(function () { self.update(self) }, G_UPDATE_INTERVAL - (Date.now() - this.lastUpdateTime));
      //setImmediate(self.update.bind(self));
    },

    run: function()
    {
        var self = this;

        //self.update();
        //process.nextTick(function () { self.update.bind(self); });
        setInterval(function () {
          self.update();
        }, G_UPDATE_INTERVAL);

        var processPackets = function () {
          var maps = self.maps;
          var mapId;
          for (mapId in maps)
          {
              var map = maps[mapId];
              if (map && map.ready && map.entities && map.updater &&
                  Object.keys(map.entities.players).length > 0)
              {
                  map.entities.processPackets();
              }
          };
        };

        setInterval(processPackets, 16);


        //self.update();
        /*setInterval(function ()
        {
          for (mapId in self.maps)
          {
              var map = self.maps[mapId];
              if (map && map.ready && map.entities && map.updater &&
                  Object.keys(map.entities.players).length > 0)
              {
                  map.entities.processPackets();
                  map.updater.update();
              }
          }
        }, G_UPDATE_INTERVAL);*/

        setInterval(function()
        {
            for (mapId in self.maps)
            {
                var map = self.maps[mapId];
                if (map && map.ready && map.entities &&
                    Object.keys(map.entities.players).length > 0)
                {
                  map.entities.mobAI.update();
                }
            }
        }, 256);

        setInterval(function()
        {
            for (mapId in self.maps)
            {
                var map = self.maps[mapId];
                if (map && map.ready && map.entities.players &&
                    Object.keys(map.entities.players).length > 0)
                {
                  for (var id in map.entities.players)
                  {
                      var player = map.entities.players[id];
                      if ((Date.now() - player.user.lastPacketTime) >= 300000)
                      {
                          player.connection.close("idle timeout");
                      }
                  }
                }
            }
        }, 60000);

        /*setInterval(function()
        {
            for (mapId in self.maps)
            {
                var map = self.maps[mapId];
                if (map && map.ready && map.entities &&
                    Object.keys(map.entities.npcplayers).length > 0)
                {
					          for (npcId in map.entities.npcplayers)
                    {
                        var npc = map.entities.npcplayers[npcId];
                        //console.info("npc="+JSON.stringify(npc));
                        //console.info("npc.controller"+npc.activeController);
                        if (npc instanceof NpcStatic)
                        {
                          npc.activeController.randomMove();
                          npc.activeController.checkMove(Date.now());
                        }
                    }

                }
            }
        }, 64);*/

        setInterval(function()
        {
            if (self.regen_callback)
            {
                self.regen_callback();
            }
        }, 10000);

        setInterval(function()
        {
            if (self.exp_callback)
            {
                self.exp_callback();
            }
        }, 60000);

        setInterval(function()
        {
            if (self.pvp_regen_callback)
            {
                self.pvp_regen_callback();
            }
        }, 300000);

        setInterval(function()
        {
            for (mapId in self.maps)
            {
                var map = self.maps[mapId];
                var players = map.entities.players;
                if (map && map.ready && map.mobArea &&
                    Object.keys(players).length > 0)
                {
                  var player;
                  var pid;
                  for (pid in players) {
                    player = players[pid];
                    if (player)
                      map.entities.mobAI.Roaming(player);
                  }
                }
            }
        }, 1000);

        setInterval(function()
        {
            for (mapId in self.maps)
            {
                var map = self.maps[mapId];
                if (map && map.ready)
                {
                    for (id in map.players)
                    {
                        var player = map.players[id];
                        if (player.idleTimer.isOver());
                          player.packetHandler.exit_callback();
                    }
                }
            }
        }, 300000);

        setInterval(function()
        {
            self.save();
        }, 1800000);
    },

    addParty: function(player1, player2)
    {
        var party = new Party(player1, player2);
        this.party.push(party);
        return party;
    },

    removeParty: function(party)
    {
        this.party = _.reject(this.party, function(el)
        {
            return el === party;
        });
        delete party;
    },

    loggedInPlayer: function(name)
    {
        var self = this;

        for (mapId in self.maps)
        {
            var map = self.maps[mapId];
            if (map.ready && map.entities)
            {
                for (var id in map.entities.players)
                {
                    if (map.entities.players.hasOwnProperty(id))
                    {
                        if (map.entities.players[id].name == name)
                        {
                            if (!map.entities.players[id].isDead)
                            {
                                console.info("loggedInPlayer: true");
                                return true;
                            }
                        }
                    }
                }
            }
        }
        console.info("loggedInPlayer: false");
        return false;
    },

    getPlayerByName: function(name)
    {
        var self = this;

        for (mapId in self.maps)
        {
            var map = self.maps[mapId];
            if (map.ready && map.entities)
            {
                for (var id in map.entities.players)
                {
                    if (map.entities.players.hasOwnProperty(id))
                    {
                        if (map.entities.players[id].name == name)
                        {
                            return map.entities.players[id];
                        }
                    }
                }
            }
        }
        return null;
    },

    handlePlayerVanish: function(player)
    {
        var self = this;

        player.forEachAttacker(function(mob)
        {
            if (mob instanceof Mob)
            {
              player.removeAttacker(mob);
              mob.clearTarget();
              mob.forgetPlayer(player.id, 1000);
            }
        });
    },

    handleMobHate: function(sEntity, tEntity, hatePoints)
    {
        console.info("handleMobHate");
        if (sEntity && tEntity &&
            tEntity instanceof Player &&
            sEntity instanceof Mob)
        {
            sEntity.increaseHateFor(tEntity, hatePoints);

            if (sEntity.stats.hp > 0)
            {
              var hEntity = sEntity.getMostHated();
              if (hEntity)
                this.createAttackLink(sEntity, hEntity);
            }
        }
    },

    handleDropItem: function (entity, attacker)
    {
      var itemLoot = this.getLootItem(attacker, entity, 0);
      if (itemLoot && itemLoot instanceof Item)
      {
          console.info("LOOT ITEM SENT!")
          itemLoot.x = entity.x;
          itemLoot.y = entity.y;
          this.handleItemDespawn(itemLoot);
          return;
      }

      var item = this.getDroppedOrStolenItem(attacker, entity, 0);
      if (item && item instanceof Item)
      {
          item.x = entity.x;
          item.y = entity.y;
          this.handleItemDespawn(item);
          return;
      }
    },

    handleDamage: function(entity, attacker, damage, crit)
    {
      if (entity.effects) {
        console.info("entity.effects: "+JSON.stringify(entity.effects));
        var effects = [];
        for (let [k,v] of Object.entries(entity.effects))
        {
          if (v == 1)
            effects.push(parseInt(k));
        }
      }

      var hpMod = -damage;
      var epMod = 0;
      //var ep= entity.stats.ep || 0;
      //var epMax= entity.stats.epMax || 0;

      console.info("effects: "+JSON.stringify(effects));
      console.info("DAMAGE: "+damage);
      console.info("CRIT: "+crit);

      //attacker, hpMod, epMod, crit, effects
      entity.onDamage(attacker, hpMod, epMod, crit, effects);
    },

    handleEntityDeath: function (entity, attacker)
    {
      if (attacker instanceof Player) {
        attacker.skillHandler.setXPs();
        this.taskHandler.processEvent(attacker, PlayerEvent(EventType.KILLMOB, entity, 1));
      }

      this.handleDropItem(entity, attacker);

      if (entity instanceof Player)
      {
          entity.forEachAttacker(function (c) {
            c.returnToSpawn();
          });

          this.handlePlayerVanish(entity);
      }

    },

    handleHurtEntity: function(entity, attacker)
    {
        var self = this;

        if (!entity || !attacker)
            return;

        if (entity.stats.hp <= 0)
        {


          if (entity instanceof Mob) {
              entity.onKilled(function (attacker, damage) {
                if (attacker instanceof Player) {
                  self.taskHandler.processEvent(attacker, PlayerEvent(EventType.DAMAGE, entity, damage));
                }
              });
          }

          _.each(entity.attackers, function(e) {
            if (e instanceof Player)
              delete e.knownIds[entity.id];
          });

          //this.handleDropItem(entity, attacker);
          this.handleEntityDeath(entity, attacker);
          entity.die(attacker);
        }
    },


    handlePickpocket: function(source, target)
    {
        //console.info("handlePickpocket");
        var item = this.getDroppedOrStolenItem(source, target, 1);
        if (item instanceof ItemRoom && source.inventory.hasRoom())
        {
            //console.info("item stolen");
            //console.info("item id: "+item.id);
            //console.info(JSON.stringify(item));
            source.inventory.putItem(item);
        }
    },

    handleItemDespawn: function(item)
    {
        if (item)
        {
            item.handleDespawn(
            {
                beforeBlinkDelay: 20000,
                blinkCallback: function()
                {
                    //item.map.entities.pushToAdjacentGroups(item.group, new Messages.Blink(item));
                },
                blinkingDuration: 8000,
                despawnCallback: function()
                {
                    item.map.entities.itemDespawn(item);
                }
            });
        }
    },

    getLootItem: function(source, target, stolen)
    {
      var self = this;
      var itemId2 = null;

      if ( !target instanceof Mob || !target instanceof Chest)
        return;

      var v = Utils.randomRangeInt(0,1000);
      var itemId2;
      var drops = target.questDrops;

      for (var d in drops) {
        var count = drops[d];
        if (v >= 0 && v < count) {
          itemId2 = d;
          break;
        }
        v -= count;
      }

      if (itemId2) {
        //console.info("itemName: "+itemName);
        //var kind = ItemTypes.getKindFromString(itemName);
        var itemRoom = new ItemRoom(parseInt(itemId2), 1, 0, 0, 0);
        var lootItem = target.map.entities.createItem(itemRoom, target.x, target.y, 1);
        lootItem.count = 1;
        lootItem.experience = 0;

        target.map.entities.pushNeighbours(target, lootItem.spawn());
        return target.map.entities.addItem(lootItem);
      }
      return null;
    },

    getPlayerDrop: function(source, target, stolen) {
      var itemIndex = target.inventory.getRandomItemNumber();
      if (itemIndex == -1)
        return;
      item = target.inventory.rooms[itemIndex];
      var count = 1;
      if (ItemTypes.isConsumableItem(item.itemKind)) {
        count = Math.floor((Math.random() * target.level + 2) / 2);
        if (count > item.itemNumber)
          count = item.itemNumber;
      }
      var item2;
      if (stolen) {
        item2 = Object.assign(new ItemRoom(), item);
        item2.itemNumber = count;
        source.map.entities.pushToPlayer(source, new Messages.Notify("CHAT", "ITEM_ADDED", [ItemData.Kinds[item.itemKind].name]));
      }
      else {
        item2 = target.map.entities.addItem(target.map.entities.createItem(type, item, target.x, target.y, count));
      }
      target.inventory.takeOutItems(itemIndex, count);
      return item2;
    },

    getDrop: function(source, target, stolen) {
      //console.info("getDroppedItem");
      if (target.droppedItem == true)
        return;

      target.droppedItem = true;

      var drops = target.drops;
      var v = Utils.random(1000);
      var itemId2;

      for (var itemId in drops) {
        var count = drops[itemId];
        if (v >= 0 && v < count) {
          itemId2 = itemId;
          break;
        }
        v -= count;
      }

// TODO CHECK CODE AS ITEM IS NOT PROVIDING ITEM KIND.
      if (!itemId2)
        return null;

      //console.info("itemName: "+itemName);
      //var kind = ItemTypes.getKindFromString(itemName);
      var itemRoom;
      if (ItemTypes.isEquippable(itemId2))
      {
        var count = Utils.setEquipmentBonus(itemId2)
        itemRoom = new ItemRoom(itemId2, count, 0, 0, 900, 900, 0);
        itemRoom.itemExperience = ItemTypes.itemExpForLevel[count - 1];
      }
      else {
        itemRoom = new ItemRoom(itemId2, 1, 0, 0, 0, 0, 0);
      }
      var item = target.map.entities.createItem(itemRoom, target.x, target.y, 1);

      if (stolen)
      {
        if (source instanceof Player)
          source.map.entities.pushToPlayer(source, new Messages.Notify("CHAT", "ITEM_ADDED", [ItemData.Kinds[item.itemKind].name]));
        return itemRoom;
      }
      else
      {
        if (target.data && target.data.dropBonus)
          item.count += target.data.dropBonus;

        target.map.entities.pushNeighbours(target, item.spawn());
        item.enemyDrop = true;
        return target.map.entities.addItem(item);
      }
    },

    getGoldDrop: function(source, target, stolen) {
      // No item drop gold.
      var count = target.dropGold();

      if (source instanceof Player) {
        source.modifyGold(count);
      }
    },

    getDroppedOrStolenItem: function(source, target, stolen) {
      var self = this;
      var item = null;
      if (source instanceof Player && target instanceof Player) {
        this.getGoldDrop(source, target, stolen);
        return this.getPlayerDrop(source, target, stolen);
      } else if (target instanceof Mob || target instanceof Chest) {
        this.getGoldDrop(source, target, stolen);
        return this.getDrop(source, target, stolen);
      }
      /*else if (target instanceof Gather) {
        return this.getDrop(source, target, stolen);
      }*/
      return null;
    },

    moveEntity: function(entity, x, y)
    {
        var self = this;
        if (entity)
        {
            entity.setPosition(x, y);
            //entity.map.entities.handleEntityGroupMembership(entity);
        }
    },

    onInit: function(callback)
    {
        this.init_callback = callback;
    },

    onPlayerConnect: function(callback)
    {
        this.connect_callback = callback;
    },

    onPlayerEnter: function(callback)
    {
        this.enter_callback = callback;
    },

    onPlayerAdded: function(callback)
    {
        this.added_callback = callback;
    },

    onPlayerRemoved: function(callback)
    {
        this.removed_callback = callback;
    },

    onRegenTick: function(callback)
    {
        this.regen_callback = callback;
    },

    onPvpRegenTick: function(callback)
    {
        this.pvp_regen_callback = callback;
    },

    onExpTick: function(callback)
    {
        this.exp_callback = callback;
    },

    onEntityAttack: function(callback)
    {
        this.attack_callback = callback;
    },

    onMobMoveCallback: function(mob)
    {
        var self = this;
        //mob.map.entities.handleEntityGroupMembership(mob);
        //mob.map.entities.pushBroadcast(mob.getLastMove());
    },

    pushWorld: function(message)
    {
        var self = this;
        for (var mapId in self.maps)
        {
            var map = self.maps[mapId];
            if (map.entities && Object.keys(map.entities.packets).length > 0)
            {
                for (var id in map.entities.packets)
                {
                    map.entities.packets[id].push(message.serialize());
                }
            }
        }
    },

    getPopulation: function()
    {
      var self = this;
      var count = 0;
      for (var id in self.maps)
      {
          var map = self.maps[id];
          /*if (map.entities) {
            for(var p in map.entities.players) {
                if (p)
                  count++;
            }
          }*/
          count += Object.keys(map.entities.players).length;
      }
      return count;
    },

    createAttackLink: function(attacker, target)
    {
        if (attacker.hasTarget())
        {
            attacker.removeTarget();
        }
        attacker.setTarget(target);

        target.addAttacker(attacker);
        attacker.addAttacker(target);
    },

    addParty: function(player1, player2)
    {
        var party = new Party(player1, player2);
        this.party.push(party);
        return party;
    },

    removeParty: function(party)
    {
        this.party = _.reject(this.party, function(el)
        {
            return el === party;
        });
        delete party;
    },

    getEntityByName: function (name) {
      for (var player of players) {
        if (player.name.toLowerCase() === name.toLowerCase())
          return player;
      }
      return null;
    },

});
