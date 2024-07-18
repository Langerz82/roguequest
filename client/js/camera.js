
define(['entity/entity'], function(Entity) {

    var Camera = Class.extend({
        init: function(game, renderer) {
            this.game = game;
            this.renderer = renderer;

            this.x = 0;
            this.y = 0;

            this.tilesize = this.renderer.tilesize;

            this.rescale();

            this.entities = {};
            this.outEntities = {};

            this.scrollX = true;
            this.scrollY = true;
        },

        rescale: function(gridW, gridH) {
            var gs = this.renderer.gameScale;
            var w = this.renderer.innerWidth;
            var h = this.renderer.innerHeight;
            var ts = this.tilesize;
            var tsgs = (ts * gs);
            this.gridW = Math.ceil(w / tsgs);
            this.gridH = Math.ceil(h / tsgs);
            this.gridW += this.gridW % 2 ? 1 : 0;
            this.gridH += this.gridH % 2 ? 1 : 0;
            //this.border = 0;
            //this.gridW -= this.border*2;
            //this.gridH -= this.border*2;

            this.gridWE = this.gridW+2;
            this.gridHE = this.gridH+2;

            //var zoom = 1/this.renderer.resolution;
            var zoom = 1; //this.renderer.gameZoom;
            this.screenW = ~~(this.gridW*tsgs*zoom);
            this.screenH = ~~(this.gridH*tsgs*zoom);

            //this.screenW = w - (this.border*2*tsgs); //this.gridW * ts;
            //this.screenH = h - (this.border*2*tsgs); //this.gridH * ts;
            this.screenX = ~~(this.screenW/gs);
            this.screenY = ~~(this.screenH/gs);
            this.tScreenW = this.gridWE * tsgs;
            this.tScreenH = this.gridHE * tsgs;


            this.wOffX = ~~((this.tScreenW - this.screenW)/(2*gs));
            this.wOffY = ~~((this.tScreenH - this.screenH)/(2*gs));
            this.eOffX = this.wOffX-ts;
            this.eOffY = this.wOffY-ts;

            log.debug("---------");
            log.debug("W:"+this.gridW + " H:" + this.gridH);
            //alert("W:"+this.gridW + " H:" + this.gridH);
            var mc = game.mapContainer;
            if (mc) {
              mc._initGrids();
              mc.moveGrid(true);
            }
        },

        setRealCoords: function() {
          var ts = this.tilesize;
          var mc = game.mapContainer;
          var fe = this.focusEntity;
          var gs = this.renderer.gameScale;
          //var r = game.renderer;
          var gw = this.gridW;
          var gh = this.gridH;

          var hgw = ~~(this.screenW / (2*gs));
          var hgh = ~~(this.screenH / (2*gs));

          if (!fe)
            return;

          var x = this.x = fe.x - hgw;
          var y = this.y = fe.y - hgh;

          this.rx = x;
          this.ry = y;

          var mw = mc.width;
          var mh = mc.height;

          this.x = this.x.clamp(mc.gcsx, mc.gcex);
          this.y = this.y.clamp(mc.gcsy, mc.gcey);

          var gcsx = 0;
          var gcex = ((mw-1)*ts)-(this.screenW/gs);
          var gcsy = 0;
          var gcey = ((mh-1)*ts)-(this.screenH/gs);

          this.scrollX = true;
          this.scrollY = true;

          var tMinX=gcsx, tMaxX=gcex, tMinY=gcsy, tMaxY=gcey;
          if (x <= tMinX || x >= tMaxX)
          {
            this.x = this.x.clamp(tMinX, tMaxX);
          }
          if (y <= tMinY || y >= tMaxY)
          {
            this.y = this.y.clamp(tMinY, tMaxY);
          }

          tMinX+=this.wOffX;
          tMinY+=this.wOffY;
          tMaxX-=this.wOffX;
          tMaxY-=this.wOffY;

          this.sx = this.rx;
          this.sy = this.ry;

          if (x <= tMinX || x > tMaxX)
          {
            this.scrollX = false;
            this.sx = this.rx.clamp(tMinX, tMaxX);
          } else {
            this.scrollX = true;
          }
          if (y <= tMinY || y > tMaxY)
          {
            this.scrollY = false;
            this.sy = this.sy.clamp(tMinY, tMaxY);
          } else {
            this.scrollY = true;
          }

          this.gx = this.x >> 4;
          this.gy = this.y >> 4;
        },

        getGridPos: function (pos)
        {
          var c = game.camera;
          var ts = game.tilesize;
          var r = game.renderer;
          var mc = game.mapContainer;
          var gs = r.gameScale;
          if (!mc) return;

          var mtw = (mc.width-1) * ts;
          var mth = (mc.height-1) * ts;

          var x = pos[0];
              y = pos[1];

          var tw = -r.hOffX;
          var th = -r.hOffY;

          var tx = ((x-c.x) + tw) / ts;
          var ty = ((y-c.y) + th) / ts;

          return [tx,ty];
        },

        forEachVisibleValidPosition: function(callback) {
            if (!this.gridWE || !this.gridHE)
              return;
            //var mc = game.mapContainer;

            var h = this.gridHE;
            var w = this.gridWE;
            var j=0, k=0;
            for(var y=0; y < h; ++y) {
                for(var x=0; x < w; ++x) {
                    //if (y < mc.tileGrid[0].length && x < mc.tileGrid.length)
                    callback(x, y);
                }
            }
        },

        isVisible: function(entity, extra) {
            extra = extra || 0;
            //log.info("isVisible: " + entity.mapIndex + "!==" + this.game.map.index);
            if (entity.mapIndex != game.mapIndex) return false;
            if (!entity) return false;
            return this.isVisiblePosition(entity.x, entity.y, extra);
        },

        isVisiblePosition: function(x, y, extra) {
            extra = extra*this.tilesize || 0;
            var minX = Math.max(0,this.x-extra);
      		  var minY = Math.max(0,this.y-extra);
      		  var maxX = Math.min(game.mapContainer.widthX, this.x+this.screenX+extra);
      		  var maxY = Math.min(game.mapContainer.heightY, this.y+this.screenY+extra);

            if(y.between(minY,maxY) && x.between(minX,maxX))
            {
                return true;
            } else {
                return false;
            }
        },

        forEachInScreenArray: function (entity) {
          var self = this;
          var entities = [];
          var entity = entity || this.focusEntity;

          var tsh = G_TILESIZE >> 1;
          var x = (self.gridW-1) * tsh;
          var y = (self.gridH-1) * tsh;

          this.forEachInScreen(function (entity2) {
            if (entity2 == entity)
              return;
            if (Math.abs(entity.x-entity2.x) < x &&
                Math.abs(entity.y-entity2.y) < y)
              entities.push(entity2);
          });
          return entities;
        },

        forEachInScreen: function(callback)
        {
          for(var id in this.entities) {
            var entity = this.entities[id];
            if (entity && entity instanceof Entity) {
              callback(entity,id);
            }
          }
        },

        forEachInOuterScreen: function(callback)
        {
          for(var id in this.entities) {
            var entity = this.outEntities[id];
            if (entity && entity instanceof Entity) {
              callback(entity,id);
            }
          }
        }
    });

    return Camera;
});
