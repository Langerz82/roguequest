define(['detect', 'mapworker'], function(Detect, worker) {

  var Map = Class.extend({
    init: function(game, mapContainer, mapSubIndex) {
      var self = this;

      this.game = game;
      this.mapContainer = mapContainer;
      this.isLoaded = false;
      this.tilesetsLoaded = false;
      this.mapLoaded = false;
      this.mapSubIndex = mapSubIndex;
      this.mapName = mapContainer.mapName;
      this.focusOffset = {x1: -1, x2: -1, y1: -1, y2: -1};
      this.gridUpdated = false;
      this.dimensions = this.game.mapContainer.getSubMapIndexDimensions(this.mapSubIndex);

      var mc = this.mapContainer;
      try {
        var name = mc.mapName + "_"+this.mapSubIndex+".json";
        mc.zip.file(name).async("string").then(function(data) {
          self.loadMapData(JSON.parse(data));
        });
      }
      catch (err) {
        console.error(JSON.stringify(err));
      }
    },

    loadMapData: function(data) {
      this.isLoaded = false;
      this.data = data;
      this._initMap(this.data);
      this._generate();
      this.mapLoaded = true;
      this._isReady();
      this._initTilesets();
    },

    _isReady: function() {
      var self = this;
      this.isLoaded = true;
      if (this.ready_func) {
        this.ready_func(self);
      }
    },

    _generate: function() {
      var self = this;

      self._generateCollisionGrid();
      self._generateTileGrid();
    },

    /*_loadMap: function(useWorker) {
      var self = this,
        filepath = "./maps/"+this.mapContainer.mapName+ "_"+this.mapSubIndex+".json";

      if (useWorker) {
        log.info("Loading map with web worker.");
        var worker = new Worker('js/mapworker.js');
        worker.postMessage("loadMap");

        worker.onmessage = function(event) {
          var map = event.data;
          self._initMap(map);
          self._generate();
          self.mapLoaded = true;
          self._checkReady();
        };
      } else {
        log.info("Loading map via Ajax.");

        var jqxhr = $.getJSON(filepath, function(data) {
          self.data = data;
          self._initMap(self.data);
          self._generate();
          self.mapLoaded = true;
          self._isReady();
        });
      }
    },*/

    _initTilesets: function() {
      var tileset;

      this.tilesetCount = 1;
      this._loadTilesets();

    },

    _initMap: function(map) {
      this.width = map.width;
      this.height = map.height;
      //this.widthX = (map.width-1)*this.game.tilesize;
      //this.heightY = (map.height-1)*this.game.tilesize;
      this.tileData = map.data;
      this.collisionData = map.collision;

    },

    // TODO
    _loadTilesets: function() {
      this.tilesets = game.renderer.tilesets;
      this.tilesetsLoaded = true;
    },

    ready: function(f) {
      this.ready_func = f;
    },

    tileIndexToGridPosition: function(tileNum) {
      var x = 0,
        y = 0;

      var getX = function(num, w) {
        if (num == 0) {
          return 0;
        }
        return (num % w == 0) ? w - 1 : (num % w) - 1;
      };

      tileNum -= 1;
      x = getX(tileNum+1, this.width);
      y = Math.floor((tileNum) / this.width);

      return {
        x: x * TILESIZE,
        y: y * TILESIZE
      };
    },

    GridPositionToTileIndex: function(x, y) {
      return (y * this.width) + x;
    },

    _generateCollisionGrid: function() {
      //log.debug(JSON.stringify(this.collision));
      this.collision = new Array(this.height);
      for (var j, i = 0; i < this.height; i++) {
        this.collision[i] = new Array(this.width).fill(false);
        for (j = 0; j < this.width; j++) {
          this.collision[i][j] = (this.collisionData[i * this.width + j] == 1 ? true : false);
        }
      }
      log.debug("Collision grid generated.");
    },

    _generateTileGrid: function() {
      this.tile = new Array(this.height);
      for (var i = 0; i < this.height; i++) {
        this.tile[i] = this.tileData.slice(i*this.width, (i+1)*this.width);
      }
      log.debug("tile grid generated.");
    },

    isColliding: function(gx, gy) {
      return (this.collision[gy][gx] === true);
    },

  });

  return Map;
});
