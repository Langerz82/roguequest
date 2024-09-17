
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
            log.debug("camera: w="+w+",h="+h);
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
            this.screenW = w; //~~(this.gridW*tsgs*zoom);
            this.screenH = h; //~~(this.gridH*tsgs*zoom);
            this.screenWE = ~~(this.gridWE*tsgs*zoom);
            this.screenHE = ~~(this.gridHE*tsgs*zoom);
            //this.screenW2 = w;
            //this.screenH2 = h;

            log.debug("camera: this.screenW="+this.screenW+",this.screenH="+this.screenH);
            //log.debug("camera: this.screenW2="+this.screenW2+",this.screenH2="+this.screenH2);

            //this.screenW = w - (this.border*2*tsgs); //this.gridW * ts;
            //this.screenH = h - (this.border*2*tsgs); //this.gridH * ts;
            this.screenX = ~~(this.screenW/gs);
            this.screenY = ~~(this.screenH/gs);
            this.tScreenW = this.gridWE * tsgs;
            this.tScreenH = this.gridHE * tsgs;


            this.wOffX = ~~((this.tScreenW - this.screenW)/(2*gs));
            this.wOffY = ~~((this.tScreenH - this.screenH)/(2*gs));
            //this.cOffX = (this.screenWE-w)/(gs*2);
            //this.cOffY = (this.screenHE-h)/(gs*2);
            log.debug("camera: this.wOffX="+this.wOffX+",this.wOffY="+this.wOffY);
            //log.debug("camera: this.cOffX="+this.cOffX+",this.cOffY="+this.cOffY);
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

          var hgw = ~~(this.screenX / 2);
          var hgh = ~~(this.screenY / 2);
          log.info("camera: hgw="+hgw+",hgh="+hgh);

          if (!fe)
            return;

          var x = this.x = fe.x - hgw;
          var y = this.y = fe.y - hgh;

          this.x = this.x.clamp(mc.gcsx, mc.gcex);
          this.y = this.y.clamp(mc.gcsy, mc.gcey);

          this.rx = x;
          this.ry = y;

          var gcsx = 0;
          var gcex = mc.gcex;
          var gcsy = 0;
          var gcey = mc.gcey;

          var tMinX=gcsx, tMaxX=gcex, tMinY=gcsy, tMaxY=gcey;

          tMinX+=this.wOffX;
          tMinY+=this.wOffY;
          tMaxX-=this.wOffX;
          tMaxY-=this.wOffY;

          this.scrollX = (x > tMinX && x <= tMaxX);
          this.scrollY = (y > tMinY && y <= tMaxY);

          this.sx = x.clamp(tMinX, tMaxX);
          this.sy = y.clamp(tMinY, tMaxY);

          this.gx = this.x >> 4;
          this.gy = this.y >> 4;
        },

        getGridPos: function (pos)
        {
          var ts = game.tilesize;
          var r = game.renderer;
          var mc = game.mapContainer;
          if (!mc) return;

          var x = pos[0];
              y = pos[1];

          var tw = -r.hOffX;
          var th = -r.hOffY;

          var tx = ((x-this.x) + tw) / ts;
          var ty = ((y-this.y) + th) / ts;

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
