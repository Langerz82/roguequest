var
    Messages = require("./message"),
    _ = require("underscore"),
    Utils = require("./utils"),
    ItemTypes = require('../shared/js/itemtypes'),
    Formulas = require("./formulas");

module.exports = NpcController = Class.extend({

		init: function(ws, map){
		    this.world = this.worldServer = ws;
		    this.map = map;
		},

	NpcOnStep: function (entity, x, y) {
		  //if (!entity || entity.nextGridX === undefined || entity.nextGridY === undefined && entity.nextGridX < 0 || entity.nextGridY < 0)
		  //	  return;
		  //entity.setPosition(x, y);
		  //this.worldServer.handleEntityGroupMembership(entity);

	},

	onNpcMoveCallback: function (npc) {

	},

        setEntityStep: function () {
            var self = this;
            var npc = null;

			for(var npcId in self.map.entities.npcplayers)
			{
				npc = self.map.entities.npcplayers[npcId];
						//npc.onMove(self.NpcOnStep);

			    npc.onStartPathing(function(x, y) {
			    		var entity = this;
			    		//entity.setPosition(x, y);
			    		//self.map.entities.handleEntityGroupMembership(entity);
			    });

				npc.onRequestPath(function(x, y) {
					//console.info("self.findPath(entity, x, y)="+this+","+x+","+y);
					var entity = this;
					if (entity.x == x && entity.y == y)
							return null;
					//if (entity.target && entity.isAdjacentNonDiagonal(entity.target))
					//		return null;
					// Only need to move 1 space

					var ignored = [];

					/*self.map.forEachAdjacentGroup(entity.group, function(id) {
					var group = self.worldServer.groups[id];
						_.each(group, function(entityId) {
							var entity2 = self.worldServer.getEntityById(entityId);
							if (entity === entity2 || (entity.target && entity.target == entity2) || entity2 instanceof NpcPlayer || entity2 instanceof Player || entity2 instanceof Mob && entity2.isDead)
								null;
							else
								ignored.push(entity2);
						});
					});*/

					var path = self.map.entities.findPath(entity, x, y, ignored);
					if (path)
					{
							self.map.entities.pushBroadcast(entity.getLastMove(entity));
							//console.info("Movement sent: "+entity.id);
					}
					return path;
				});

				npc.onStopPathing(function(x, y) {
				  var entity = this;
				  //entity.setPosition(x, y);
				  //self.map.entities.handleEntityGroupMembership(entity);
				});

				npc.onDeath(function() {
					console.info("npc.onDeath - Resssed YeahhH!!!!");
					var entity = this;
					setTimeout(function () {
						entity.isDead = false;
						//var pos = self.map.getRandomStartingPosition();
						var pos = self.map.enterCallback(entity);
						entity.x = pos.x;
						entity.y = pos.y;
						entity.removeTarget();
						entity.forceStop();
						entity.state = Types.PlayerState.Roaming;
						entity.stats.hp = entity.stats.hpMax;
						entity.attackers = {};
						//entity.resetManaPoints(0);
						self.map.entities.pushBroadcast(new Messages.Spawn(entity));
					}, 10000);
				});
			}
        },

        checkDebug: function() {
	    var self = this;
            for(var npcId in self.map.entities.npcplayers)
            {
	    	var npc = self.map.entities.npcplayers[npcId];

				console.info("npc-name:"+npc.name);
				console.info("npc-state:"+npc.state);
				//console.info("npc-target:"+(npc.target ? npc.target.id : 0));
				//console.info("npc-target-isDead:"+(npc.target ? npc.target.isDead : false));
				//console.info("npc-isMoving:"+npc.isMoving());
				//console.info("npc-hasNextStep:"+npc.hasNextStep());
				//console.info("npc-path-length:"+ (npc.path ? npc.path.length : 0));
				//console.info("npc-step:"+npc.step);
				//console.info("npc-path:"+ (npc.path ? JSON.stringify(npc.path) : 0));
				//console.info("==============================");

            }
        },

        checkAggro: function() {
            var self = this;
			for(var npcId in self.map.entities.npcplayers)
			{
				var npc = self.map.entities.npcplayers[npcId];
				if (npc.isDead || npc.isStunned || npc.target || npc.isMoving())
					continue;

				if (npc.party && npc.party.leader.target && npc.state == Types.PlayerState.Moving)
				{
					self.followAndAggro(npc, npc.party.leader.target);
					continue;
				}
				if (npc.state == Types.PlayerState.Moving)
				{
					//self.map.entities.pushBroadcast(self.getLastMove(npc));
					var aggro = false;

					var enemies = self.map.entities.getCharactersAround(npc, 10);
					for(var enemyId in enemies)
					{

						var enemy = enemies[enemyId];
						if ((enemy instanceof Mob && !enemy.isDead && (enemy.level-5) <= npc.level) ||
							(enemy instanceof Player && npc.influence[enemy.id] && npc.influence[enemy.id] < 0 &&
								enemy.level <= npc.level && npc.level >= 20 && self.map.index != 0))
						{
							aggro = true;
							self.followAndAggro(npc, enemy);
							break;
						}
					}
					if (!aggro && !npc.isMoving())
					{
						//self.map.entities.pushBroadcast(self.getLastMove(npc));
						//console.info("REVERTED BACK TO ROAMING");
						npc.forceStop();
						npc.state = Types.PlayerState.Roaming;
					}
				}
			}
        },

        followAndAggro: function (npc, mob)
        {
        	var self = this;
			npc.forceStop();
        	self.aggroEntity(npc, mob);
			npc.engage(mob);
			npc.follow(mob);
			if (!npc.path) {
				npc.removeTarget();
				//console.info("REVERTED BACK TO ROAMING 2");
				npc.state = Types.PlayerState.Roaming;
				return;
			}

			//self.map.entities.pushToAdjacentGroups(entity.group, new Messages.Aggro(npc, mob, npc.path[npc.path.length-1][0], npc.path[npc.path.length-1][1]));
			if (npc.state == Types.PlayerState.Moving)
			{
				//if (npc.path)
					//console.info("npc.path.length="+npc.path.length);
				var pathDelay = (npc.path) ? npc.path.length : 1;

				npc.followingTimer = new Timer(pathDelay * 400, Date.now());

				npc.state = Types.PlayerState.Aggro;
			}
			//self.worldServer.pushBroadcast(self.getLastMove(npc));
        },

        aggroEntity: function (source, entity)
        {
        	this.world.createAttackLink(source, entity);
        	source.engage(entity);
        	source.follow(entity);
        },

        checkHit: function() {
            var time = new Date().getTime();
            var ws = this.worldServer;
            var self = this;

			for(var npcId in self.map.entities.npcplayers)
			{
				var npc = self.map.entities.npcplayers[npcId];
				if (npc.isDead || npc.isStunned || !npc.hasTarget() || npc.target.isDead || npc.hasNextStep())
					continue;

				if  (npc.state == Types.PlayerState.Hurting)
				{
					if (npc.canAttack(time) && npc.isAdjacentNonDiagonal(npc.target))
					{
						self.handleHurt(npc);
					}
				}
			}
        },

        checkStep: function() {
            var self = this;
            var time = Date.now();
            var npc;
			for(var npcId in self.map.entities.npcplayers)
			{
				npc = self.map.entities.npcplayers[npcId];
				if (npc.isDead)
					continue;

				if (npc.canMove(time)) {
					//console.info("TRYING - STEP");
					if ((!npc.nextStep()) &&
						npc.state == Types.PlayerState.Moving)
					{
						//console.info("STEP FAILED!!!!!!!!!!!!!!!!!!!!");
						////npc.forceStop();
						//console.info("REVERTED BACK TO ROAMING 3");
						npc.state = Types.PlayerState.Roaming;
						//continue;
					}
					var door = self.map.getDoor(npc);
					//console.info("npc.x="+npc.x+",npc.y="+npc.y);

					if (door && door.map)
					{
						if (door.minLevel && npc.level >= door.minLevel && door.maxLevel && npc.level < door.maxLevel)
						{
							//console.info("I HAVE ENTERED THE PORTAL MUTHA FUCKAAA!!!!");
							npc.map.entities.removeNpcPlayer(npc);
							npc.map = self.world.maps[door.map];
							//console.info("door.map="+door.map);
							npc.map.entities.addNpcPlayer(npc);
							var pos = self.map.enterCallback(npc);
							npc.setPosition(pos.x, pos.y);
							npc.map.npcController.setEntityStep();
						}
					}
				}

				if (npc.isAttacked())
				{
					for (var id in npc.attackers)
					{
						var attacker = npc.attackers[id];
						if (!npc.influence[attacker.id])
							npc.influence[attacker.id] = -1;
						else
							npc.influence[attacker.id]--;
						self.aggroEntity(npc,attacker);
						npc.state = Types.PlayerState.Following;
						if (npc.isAdjacentNonDiagonal(attacker))
						{
							//self.aggroEntity(npc,attacker);
							npc.state = Types.PlayerState.Hurting;
						}
						continue;
					}
				}
				//if (npc.party && !npc.isMoving())
				//	npc.state = Types.PlayerState.Roaming;
			}
        },

        checkMove: function() {
            var self = this;
            var time = Date.now();
			for(var npcId in self.map.entities.npcplayers)
			{
				var npc = self.map.entities.npcplayers[npcId];
				if (npc.isMoving())
					continue;

				//console.info("npc.state:"+npc.state);
				if (npc.isDead)
				{
					continue;
				}

				if (npc.target && npc.target.isDead)
				{
					//console.info("Roaming--");
					npc.removeTarget();
					npc.forceStop();
					//console.info("REVERTED BACK TO ROAMING 4");
					npc.state = Types.PlayerState.Roaming;
					continue;
				}

				if (npc.state == Types.PlayerState.Aggro)
				{
					if (npc.followingTimer) {
						//var lastTime = npc.followingTimer.lastTime;
						//console.info("time="+ (time-lastTime));
						if (npc.followingTimer.isOver(time))
						{
							//console.info("BOT STATE - HURTING");
							npc.state = Types.PlayerState.Hurting;
						}
					}
					continue;
				}
				if ((npc.state == Types.PlayerState.Follow || npc.state == Types.PlayerState.Aggro) && npc.target)
				{
					//npc.forceStop();
					self.followAndAggro(npc, npc.target);
				}
			}
        },

    handleHurt: function(npc){ // 9
        var self = this;
        var ws = this.worldServer;

        if(npc.state == Types.PlayerState.Hurting) {
		    if(npc.target === null || npc.target.isDead === true) {
		    	    //console.info("npc.name"+npc.name);
		    	    //console.info("HurtingToRoaming");
		    		self.HurtingToRoaming(npc, false, x, y);
		    	    return;
		    }
            if (npc.target && npc.isAdjacentNonDiagonal(npc.target) && !npc.target.isDead && !npc.isMoving() && !npc.target.isMoving())
            {
				var dmg = Formulas.dmg(npc, npc.target);
				if (npc.criticalHit) {
					dmg *= 2;
					npc.criticalHit = false;
				}
				npc.target.stats.hp -= dmg;

				//console.info("ws.handleHurtEntity");
				if (npc.target.stats.hp <= 0)
					npc.target.isDead = true;
				var x=npc.target.x, y=npc.target.y;
				if (npc.target instanceof Mob)
					ws.handleMobHate(npc.target, npc, dmg);
				ws.handleHurtEntity(npc.target, npc, dmg, npc.criticalHit);
				if(!npc.target || npc.target.isDead === true) {
						//console.info("npc.name"+npc.name);
						//console.info("HurtingToRoaming");
						self.HurtingToRoaming(npc, true, x, y);
						return;
				}

		    }
		    else
				self.followAndAggro(npc, npc.target);
        }

    },

    HurtingToRoaming: function(npc, getItem, x, y)
    {
    	var self = this;

    	if (npc.target)
    	{
			npc.target.forEachAttacker(function(attacker) {
				attacker.removeTarget()
				if (attacker != npc) {
					attacker.forceStop();
					attacker.state = Types.PlayerState.Roaming;
				}
			});
		}

		if (getItem)
		{
			npc.state = Types.PlayerState.GettingItems;
			npc.go(x, y);
			setTimeout(function() {
					self.handleLoot(self, npc);
			},1500);
			setTimeout(function() {
				//console.info("Timeout - Roaming");
				npc.state = Types.PlayerState.Roaming;
			},3000);
		}
		else
			npc.state = Types.PlayerState.Roaming;
    },

    Roaming: function() {
        var self = this;
            var npc;
	    for(var npcId in self.map.entities.npcplayers)
	    {
	    	npc = self.map.entities.npcplayers[npcId];
			// Follow Leader
			// Hack to move towards Leader a bit slower
			if (npc.party && npc.state == Types.PlayerState.Roaming && npc.party.leader.isMoving())
			{
				//npc.forceStop();
				//console.info("party leader x:"+npc.party.leader.x+",y:"+npc.party.leader.y);
				npc.follow(npc.party.leader);
				if (npc.path)
				{
					npc.state = Types.PlayerState.Moving;
					continue;
				}
			}

			if(npc.state == Types.PlayerState.Roaming && !npc.isMoving() && npc.canRoam(Date.now())) {
				count = 0;
				while(count++ < 5)
				{
					var pos = self.map.entities.getRandomPosition(npc, 5);
					if (pos)
					{
						npc.go(pos.x, pos.y);
						if (npc.path && npc.path.length <= 10)
						{
							//console.info("x="+(pos.x-npc.x)+",y="+(pos.y-npc.y));
							//self.world.pushBroadcast(self.getLastMove(npc));

							npc.setRoamRate(npc.path.length * 700);
							npc.state = Types.PlayerState.Moving;
							break;
						}
					}
				}
			}

	    }
    },

    handleLoot: function(self, npc){
        //var self = this;
        var entities = self.map.entities.getEntitiesByPosition(npc.x, npc.y);

		var entity;
		var removeEntities = [];
        for (var id in entities)
        {
        	entity = entities[id];
        	//console.info("entity-id: " + entity.id);
			//console.info("entity dropped: " + entity.kind);
			if (ItemTypes.isItem(entity.kind))
			{
				var item = entity;
				//console.info("item:"+item.kind+","+item.count+","+item.skillKind+","+item.skillLevel);
				var id = npc.inventory.putItem(item);

				if(id >= 0)
				{
					//console.info("self.world.pushBroadcast(item.despawn());");
					npc.checkItemEquip(id);
					//removeEntities.push(entity);
				}
				else
					console.info("CANT GET ITEM");
				self.map.entities.itemDespawn(entity);
			}
        }

		/*
        var count = removeEntities.length-1;
		for (var i=count; i >= 0; --i)
		{
			var entity = removeEntities[i];
			//console.info("removing item: "+item.id+", "+item.kind);
			//this.worldServer.pushBroadcast(new Messages.Despawn(entity.id), false);
			self.worldServer.itemDespawn(entity);
			entity = null;
		}
        */
    },

    partyInvite: function(npc, player) {
    	//console.info("NPC - PartyInvite")
		//if (!npc.influence[player.id])
		//	npc.influence[player.id] = Utils.randomRangeInt(-10,10);

		// Accept Party Request.
		if (npc.influence[player.id] >= 0)
			player.packetHandler.handlePartyInvite([null,npc.id, 1]);

		else // Reject Party Request.
			player.packetHandler.handlePartyInvite([null,npc.id, 2]);
    }
});
