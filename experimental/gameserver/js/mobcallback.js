var Messages = require("./message"),
    _ = require("underscore"),
    Utils = require("./utils"),
    Formulas = require("./formulas"),
    ChestArea = require('./area/chestarea');

module.exports = MobCallback = Class.extend({

  init: function(ws, map){
      this.world = this.worldServer = ws;
      this.map = map;
      //this.mobsMoving = 0;
  },



  setCallbacks: function (entity) {
    var self = this;

    entity.onRespawn(function() {
        entity.setFreeze(2000);
        entity.isDead = false;
        entity.droppedItem = false;
        self.addMob(mob);

        if (entity.area && entity.area instanceof ChestArea)
            mob.area.addToArea(entity);
    });

    entity.onStep(function (x, y) {
  		  if (!entity)
  		  	  return;

        //entity.mobAI.checkReturn(entity,x,y);

  	});

		entity.onRequestPath(function(x, y) {
		    var ignored = [entity];

		    if (entity.target)
		    	ignored.push(entity.target);

		    var path = self.map.entities.findPath(entity, x, y, ignored);

        if (path && path.length == 1)
          console.error(entity.id + " " + JSON.stringify(path));

				if (path && path.length > 1)
				{
            //self.mobsMoving++;

				    /*var pos;
				    if (entity.followingMode && path.length >= 2)
				    {
				    	pos = path[path.length-2];
				    }
				    else
				    {
				    	pos = path[path.length-1];
				    }

            var path2 = path.slice();
            if (entity.followingMode)
            {
              path2.pop();
            }*/
            //entity.setPosition(x,y);
            entity.orientation = entity.getOrientationTo({x: path[1][0], y: path[1][1]});
				    var msg = new Messages.MovePath(entity, path);

				    self.map.entities.pushNeighbours(entity, msg);
            //entity.setFreeze(G_LATENCY);
            return path;
				}
        return null;
		});

		entity.onStopPathing(function(x, y) {
		  //console.info("mob.onStopPathing");
      //self.mobsMoving--;

	    //var oldGroup = entity.group;
		  //var newGroup = self.map.entities.handleEntityGroupMembership(entity);
		  //self.map.entities.entitygrid[y][x] = 1;
      //try { throw new Error(); }
      //catch (e) { console.info(e.stack); }
      /*if (entity.resetSpawn) {
        entity.returnedToSpawn();
        return;
      }*/

      if (!entity.hasTarget())
        entity.setAiState(mobState.IDLE);

      if (entity.aiState == mobState.CHASING)
        entity.mobAI.checkReturn(entity,x,y);


      //if (entity.aiState == mobState.RETURNING)
        //entity.setPosition(entity.spawnX, entity.spawnY);

      //entity.setFreeze(entity.data.reactionDelay);
		});

    entity.onStartPathing(function () {
    });

    entity.onAbortPathing(function () {
      msg = new Messages.Move(entity, entity.orientation, 2, entity.x, entity.y);
      self.map.entities.pushNeighbours(entity, msg);
      //entity.setFreeze(G_LATENCY);

      if (!entity.target)
        entity.setAiState(mobState.IDLE);
    });

  }
});
