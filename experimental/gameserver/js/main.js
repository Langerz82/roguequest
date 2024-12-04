var fs = require('fs');
var crypto = require('crypto');
var BISON = require('bison');
var useBison = false;

var Metrics = require('./metrics');
var ProductionConfig = require('./productionconfig');
var UserHandler = require('./userhandler');
var WorldHandler = require('./worldhandler');
var Utils = require('./utils');
var UserMessages = require('./usermessage');
var GameTypes = require("../shared/js/gametypes");

//var RedisServer = require('redis-server');

var _ = require('underscore');
var readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

let packageName = "com.retrorpgonline2";

//let verifier = null;

let IO_STATES = {
	MSG_BUYPRODUCT: 1,
	MSG_ERRORPRODUCT: 2,
};

G_LATENCY = 75;
G_ROUNDTRIP = G_LATENCY * 2;

G_TILESIZE = 16;

G_FRAME_INTERVALS = 4;
G_FRAME_INTERVAL_EXACT = (1000/60);
G_FRAME_INTERVAL = ~~(G_FRAME_INTERVAL_EXACT);
G_UPDATE_INTERVAL = ~~(G_FRAME_INTERVAL*G_FRAME_INTERVALS);
//G_UPDATE_INTERVAL = (G_UPDATE_INTERVAL_EXACT);
G_INTERVAL =( G_UPDATE_INTERVAL * G_FRAME_INTERVALS);

G_SPATIAL_SIZE = 32;

G_SCREEN_WIDTH = 34;
G_SCREEN_HEIGHT = 18;

//G_ROUNDTRIP = G_LATENCY * 2 - G_UPDATE_INTERVAL;

ATTACK_INTERVAL = 1000;
ATTACK_MAX = 4000;

PLAYER_SAVE_INTERVAL = 1800000;

mobState = {
    IDLE: 1,
    ROAMING: 2,
    AGGRO: 3,
    CHASING: 4,
    FIRSTATTACK: 5,
    ATTACKING: 6,
    RETURNING: 7,
    STUCK: 8
};

SAVING_SERVER = false;
AUCTION_SAVED = false;
PLAYERS_SAVED = false;

//GDATE = new Date();

/* global log, Player, databaseHandler */

var worldHandler;
var userHandler;

worlds = [];
users = {};
players = [];
hashes = {};

Log = require('log');
var fs = require('fs');
var util = require('util');
var crypto = require('crypto');

var log_file = fs.createWriteStream(__dirname + '/../console.log', {flags : 'w'});
var log_stdout = process.stdout;

/*var get_connect_string = function () {
    if (MainConfig)
      return MainConfig.protocol+'://'+MainConfig.address+':'+MainConfig.port;
    return null;
}*/

function main(config) {

    /*switch(config.debug_level) {
        case "error":
        case "debug":
        case "info":
            log = new Log(Log.INFO || Log.DEBUG || Log.ERROR);
        break;
    }*/

    log = new Log(Log.INFO || Log.DEBUG || Log.ERROR);
    console.isEnabled = true;

    //console.log = console.info;
    Object.defineProperty(log, "log", {
      value: undefined,
      writable: true,
      enumerable: true
    });
    Object.defineProperty(log, "info", {
      value: undefined,
      writable: true,
      enumerable: true
    });
    Object.defineProperty(log, "warn", {
      value: undefined,
      writable: true,
      enumerable: true
    });
    Object.defineProperty(log, "error", {
      value: undefined,
      writable: true,
      enumerable: true
    });

    // redirect stdout / stderr
    log.log = function(d) { //
      var txt = "LOG: " + util.format(d) + '\n';
      //log_file.write(txt);
      //log_stdout.write(txt);
      console.info(txt);
    };
    log.info = function(d) { //
      var txt = "INFO: " + util.format(d) + '\n';
      //log_file.write(txt);
      //log_stdout.write(txt);
      console.info(txt);
    };
    log.warn = function(d) { //
      var txt = "WARN: " + util.format(d) + '\n';
      //log_file.write(txt);
      //log_stdout.write(txt);
      console.warn(txt);
    };
    log.error = function(d) { //
      var txt = "ERROR: " + util.format(d) + '\n';
      //log_file.write(txt);
      //log_stdout.write(txt);
      console.error(txt);
    };

    var production_config = new ProductionConfig(config);
    if(production_config.inProduction()) {
        _.extend(config, production_config.getProductionSettings());
    }
    var worldId = config.world_id;
    MainConfig = config;

    //verifyOptions.email = config.verify_email;
    //verifyOptions.key = config.verify_key;
    //verifier = new Verifier(verifyOptions);

    var ws = require("./ws");

    var WorldServer = require("./worldserver");

    var server = new ws.WebsocketServer(config);
    var metrics = config.metrics_enabled ? new Metrics(config) : null;
    var lastTotalPlayers = 0;
    var self = this;

    //while(true) {}
    console.info("Initializing RRO2 GameServer - World " + worldId);

    loadWorlds = function () {
      _.each(_.range(config.nb_worlds), function(i) {
          world = new WorldServer('world'+ i, config.nb_players_per_world, server);
          world.run();
          world.name = config.world_name[i];
      });
    }

    loadWorlds();

    server.onConnect(function(conn) {

        //var self = this;

        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        var hash = crypto.createHash('sha1').update(current_date + random).digest('hex');
        conn.hash = hash;
        console.warn("onConnect: hash="+hash);

      	console.info(JSON.stringify(config));
      	console.info("version sent");
        console.info(GameTypes.Messages.WC_VERSION);

      	conn.sendUTF8(GameTypes.Messages.WC_VERSION+","+config.version+","+conn.hash);

        //self.enterWorld(connection);
// TODO Not sure if commenting out is right.
        var worldHandler = new WorldHandler(self, conn, userHandler.connection);
    });

    server.userConn.onConnectUser(function (conn) {
      console.info("onConnectUser - Connected");
      this.send([GameTypes.UserMessages.WU_CONNECT_WORLD]);
      var msg = new UserMessages.ServerInfo(world.name, 0, config.nb_players_per_world, config.address, config.port, config.user_password);
      this.send(msg.serialize());

      console.info("server.enterWorld");
      //console.info(JSON.stringify(conn));
      userHandler = new UserHandler(self, conn, world);
      world.userHandler = userHandler;

      //world.hashChallenge = conn.hash;
      //world.world = world;
    });

    self.enterWorld = function (conn)
    {
        console.info("server.enterWorld");
        //console.info(JSON.stringify(conn));
        //var user = new User(self, conn);
        var user = {};
        user.hashChallenge = conn.hash;
        user.world = world;
        user.conn = conn;

        return user;
    };

    server.onError(function() {
        console.error(Array.prototype.join.call(arguments, ", "));

    });


    server.onRequestStatus(function() {
        return JSON.stringify(getWorldDistribution(worlds));
    });

    process.on('uncaughtException', function (e) {
        // Display the full error stack, to aid debugging
        console.info(JSON.stringify(e));

        console.error('uncaughtException: ' + e.stack);

    });

	server._ioServer.on('connection', (socket) => {
	  console.log('connected');
	  socket.on('disconnect', function(){
		console.log('disconnected');
	  });

	  server._ioServer.on('msg', (message) => {
		console.log("msg="+JSON.stringify(message));
		//io.emit('msg', message);
	  });
	});

  /*server._ioServer.connect(1342, "localhost", function () {
    console.info("connected");
  })*/

  var signalHandler = function () {
    closeServer();
    sleep(250);
    checkSaved();
    process.exit();
  };

  process.on('SIGINT', signalHandler)
  process.on('SIGTERM', signalHandler)
  process.on('SIGQUIT', signalHandler)

  var cmdPrompt = function () {

    if (process.platform === "win32") {
      readline.on("SIGINT", function () {
        process.emit("SIGINT");
      });
    }

    readline.question('Command:', function (line) {
      //console.info("line: " + line);
      getInput(line);

      //Utils.utilSleep(100);
      setTimeout(cmdPrompt, 100);
    });
  };
  /*var cmdStart = function () {
    cmdPrompt();
  };*/

  cmdPrompt();
  //setInterval(cmdPrompt, 1000);
  /*process.nextTick(function () {
    for (var w of worlds)
      worlds.update();
  });*/

}

function modgems (args) {
  var world = worlds[0];
  var playerName = args[0];
  var gems = args[1];

  var player = world.getPlayerByName(playerName);
  if (player && player.user)
    player.user.modifyGems(gems);
  else
    databaseHandler.modifyGems(playerName, gems);
}

function modgold (args) {
  var world = worlds[0];
  var playerName = args[0];
  var gold = args[1];

  var player = world.getPlayerByName(playerName);
  if (player)
    player.modifyGold(gold);
  else
    databaseHandler.modifyGold(playerName, gold);
}

function changePassword (args) {
  var world = worlds[0];
  var username = args[0];
  var password = args[1];

  var hash = crypto.createHash('sha1').update(username+password).digest('hex');
  DBH.savePassword(username, hash);
}

function getInput(cmd) {
    args = cmd.split(" ");
    cmdarg = args[0];
    args.shift();
    console.info("cmd: " + cmd);

    switch (cmdarg)
    {
      case "modgems":
        modgems(args);
        break;
      case "modgold":
        modgold(args);
        break;
      case "setpass":
        changePassword(args);
        break;
      case "exit":
      case "quit":
      case 'q':
      case 'x':
        closeServer();
        process.exit(1);
        break;
      case "s":
      case "save":
        saveServer();
        break;
      case "forcequit":
        process.exit(1);
        break;
      case "reloadauction":
        reloadAuction();
        break;
      default:
        console.info("Unknown command.")
    }
}

function reloadAuction() {
  _.each(worlds, function(world) {
			world.auction.load();
	});
}

function checkSaved() {
  var allSaved = setInterval(function () {
    if (PLAYERS_SAVED && AUCTION_SAVED)
    {
      clearInterval(allSaved);
      process.exit(1);
    }
  }, 500);

}
var serverClosed = false;
function closeServer() {
  if (serverClosed)
    return;
  serverClosed = true;
  readline.close();
  saveServer();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function saveServer() {
  console.log("saving server!")
  SAVING_SERVER = true;
  world.save();
}

function getWorldDistribution(worlds) {
    var distribution = [];

    _.each(worlds, function(world) {
        distribution.push(world.playerCount);
    });
    return distribution;
}

function getConfigFile(path, callback) {
    fs.readFile(path, 'utf8', function(err, json_string) {
        if(err) {
            //console.info("This server can be customized by creating a configuration file named: " + err.path);
            callback(null);
        } else {
            callback(JSON.parse(json_string));
        }
    });
}

var defaultConfigPath = './config.json';
var customConfigPath = './config_local.json';

process.argv.forEach(function (val, index, array) {
    if(index === 2) {
        customConfigPath = val;
    }
});

getConfigFile(defaultConfigPath, function(defaultConfig) {
    getConfigFile(customConfigPath, function(localConfig) {
        if(localConfig) {
            main(localConfig);
        } else if(defaultConfig) {
            main(defaultConfig);
        } else {
            console.error("Server cannot start without any configuration file.");
            process.exit(1);
        }
    });
});
