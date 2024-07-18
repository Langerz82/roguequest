var fs = require('fs');
var crypto = require('crypto');
var Metrics = require('./metrics');
var ProductionConfig = require('./productionconfig');
var User = require('./user');
var Utils = require('./utils');
var redis = require('./redis');

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

worlds = [];
users = {};
players = [];

Log = require('log');
var fs = require('fs');
var util = require('util');
var crypto = require('crypto');

var log_file = fs.createWriteStream(__dirname + '/../console.log', {flags : 'w'});
var log_stdout = process.stdout;


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

    //verifyOptions.email = config.verify_email;
    //verifyOptions.key = config.verify_key;
    //verifier = new Verifier(verifyOptions);

    var ws = require("./ws");

    var WorldServer = require("./worldserver");

    //var server = new ws.WebsocketServer(http);
    //var server = new ws.WebsocketServer(https);

    var server = new ws.WebsocketServer(config);
    var metrics = config.metrics_enabled ? new Metrics(config) : null;
    var lastTotalPlayers = 0;
    var self = this;

    /*console.info("config.database="+config.database);
    if (config.database == "redis") {
      redisServer = new RedisServer({
        port: 6379,
        bin: 'D:/Tools/redis-server'
      });
      redisServer.open((err) => {
      if (err === null) {
      }
      console.log("ERRR: " + err);
      });
    }*/

    var DatabaseSelector = require("./databaseselector");

    //while(true) {}
    console.info("Initializing RRO2 GameServer - World " + worldId);

    // You may now connect a client to the Redis
    // server bound to port 6379.
    var selector = DatabaseSelector(config);
    selector(config);
    DBH = databaseHandler = new selector(config);

    loadWorlds = function () {
      _.each(_.range(config.nb_worlds), function(i) {
          var world = new WorldServer('world'+ i, config.nb_players_per_world, server, databaseHandler);
          world.run();
          world.name = config.world_name[i];
          worlds.push(world);

      });
    }

    console.log("REDIS SERVER CREATED!!!!!!!!!!!!!");
    loadWorlds();



    /*databaseHandler.createLeaderBoard();
    setInterval(function()
    {
        databaseHandler.createLeaderBoard();
    }, 300000);*/

    server.onConnect(function(connection) {

        var self = this;

        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        var hash = crypto.createHash('sha1').update(current_date + random).digest('hex');
        connection.hash = hash;
        console.warn("onConnect: hash="+hash);
        var connect = function(config) {
          var Types = require("../shared/js/gametypes");
        	console.info(JSON.stringify(config));
        	console.info("version sent");
          console.info(Types.Messages.SC_VERSION);


        	connection.sendUTF8(Types.Messages.SC_VERSION+","+config.version+","+connection.hash);

          var worldsReply = Types.Messages.SC_WORLDS;
          for (var i=0; i < config.nb_worlds; ++i)
          {
            worldsReply += "," + i + "," + worlds[i].name + "," + worlds[i].getPopulation() + "," + config.nb_players_per_world;
          }
          connection.sendUTF8(worldsReply);
        };
        connect(config);

        self.enterWorld(connection);
    });

    server.enterWorld = function (conn)
    {
        //var conn = server.newConnection;
        var user = new User(self, conn);
        user.hashChallenge = conn.hash;
        //conn.sendUTF8("startgame");
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
  _.each(worlds, function(world) {
			world.save();
	});
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
