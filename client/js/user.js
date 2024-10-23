
function PlayerSummary(index, db_player) {
  this.index = index;
  this.name = db_player.name;
  //this.pClass = db_player.pClass;
  this.exp = db_player.exp || 0;
  this.colors = db_player.colors || [0,0];
  this.sprites = db_player.sprites || [0,0];
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

define(['userclient', 'entity/player', 'data/appearancedata', 'lib/sha1'],

// TODO - Make a thin user client that process User related packets back and forth.
function(UserClient, Player, AppearanceData) {

  var User = Class.extend({
      init: function(userclient, username, password) {
        this.client = userclient;
        this.username = username.toLowerCase();
        this.password = password;

        this.playerSum = [];

        var hashObj = new jsSHA(this.username+this.password, "ASCII").getHash("SHA-1","HEX");
        this.regHash = hashObj;
        //var hashChallenge = new jsSHA(this.client.hashChallenge, "ASCII");
        log.info("User init: hash="+hash);
        log.info("User init: hashChallenge="+this.client.hashChallenge);
        //var hash = new jsSHA(hashObj+this.client.hashChallenge, "ASCII");
        var hash = CryptoJS.AES.encrypt(JSON.stringify(hashObj), this.client.hashChallenge).toString();
        //log.info("hash="+hash.getHash("SHA-1","HEX"));
        //log.info("hashChallenge="+hashChallenge.getHash("SHA-1","HEX"));
        this.hash = this.hash || btoa(hash);

      },

      setPlayerSummary: function (data)
      {
        var count = parseInt(data.shift());
        for (var i=0; i < count; ++i)
        {
          j = (7 * i);

          var ps = new PlayerSummary(parseInt(data[j]), {
            name: data[j+1],
            //pClass: parseInt(data[j+2]),
            exp: parseInt(data[j+2]),
            colors: [data[j+3], data[j+4]],
            sprites: [data[j+5], data[j+6]]
          });
          this.playerSum.push(ps);
        }
      },

      createPlayer: function (ps)
      {
        this.playerSum[ps.index] = ps;
        var player = new Player(0, 1, 0, 0, ps.name);
        player.user = this;
        player.keyMove = false;

        player.setItems();

        player.forceStop = function () {
          if (this.keyMove && this.key_move_callback)
          {
            this.key_move_callback(false);
          }
          this.keyMove = false;
          this.freeze = false;
          //clearTimeout(this.moveTimeout);
          this._forceStop();

          this.idle();
          this.fsm = "IDLE";
        };

        player.canAttack = function(time) {
            if(this.isDead == false && this.attackCooldown.isOver(time)) {
                return true;
            }
            return false;
        };

        player.lookAtEntity = function (entity) {
          if (this.isMoving())
            this.forceStop();

          this._lookAtEntity(entity);
        };

        // Note - freeze might be needed disable for now.
        player.hit = function(orientation) {
          orientation = orientation || this.orientation;
          var self = this;

          if (this.fsm == "MOVEPATH") {
            return;
          }

          this.harvestOff();
          this.setOrientation(orientation || 0);

          this.forceStop();
          this.fsm = "ATTACK";
          this.animate("atk", this.atkSpeed, 1, function () {
            self.idle(self.orientation);
            self.forceStop();
          });
          return true;
        };

        player.sendMove = function (state) {
          if (state || this.sentMove != state) {
            game.client.sendMoveEntity(this, state);
            this.sentMove = state;
          }
        };

        player.moveTo_ = function(x, y, callback) {
          var self = this;

          if (this.fsm == "MOVEPATH") {
            return;
          }

          if (this.fsm == "ATTACK") {
            return;
          }

          this.forceStop();
          this.harvestOff();

          log.info("background - free delay =" + G_LATENCY);

          //this.freeze = true;

          //this.idle();
          //clearTimeout(this.moveTimeout);
          this.fsm = "MOVEPATH";
          /*this.moveTimeout = setTimeout(function() {
            //self.freeze = false;
            //self.walk();
            //self.fsm = "MOVEPATH";

          }, G_LATENCY);*/
          this.walk();
          return this._moveTo(x, y, callback);
        };


        // TODO - FIX BUG Player sometimes jams and moves across with the wrong orientation.
        player.move = function (orientation, state) {
          var self = this;

          if (this.isDying || this.isDead)
            return;

          if (this.fsm == "ATTACK") {
            return;
          }

          if (this.fsm == "MOVEPATH") {
            return;
          }

          if (state && orientation != Types.Orientations.NONE)
          {
            if (this.keyMove && orientation == this.orientation) {
                return;
            }

            this.setOrientation(orientation);
            this.harvestOff();
            this.forceStop();

            this.fsm = "MOVING";

            this.walk();

            this.keyMove = true;
          }
          if (!state)
          {
            if (orientation != this.orientation && this.isMoving()) {
              return;
            }
            this.forceStop();
          }
          if (this.key_move_callback)
          {
            this.key_move_callback(state);
          }
        };

        player.setArmorSprite = function (sprite) {
          if (!sprite)
          {
            var id = this.sprites[0];
            sprite = game.sprites[AppearanceData[id].sprite];
          }
          this._setArmorSprite(sprite);
        };

        player.setWeaponSprite = function (sprite) {
          if (!sprite)
          {
            var id = this.sprites[1];
            sprite = game.sprites[AppearanceData[id].sprite];
          }
          this._setWeaponSprite(sprite);
        };

        game.addPlayerCallbacks(player);

        return player;
      },
  });

  return User;

});
