var cls = require("./lib/class");
var Utils = require("./utils");
var Messages = require("./message");

module.exports = Wheather = cls.Class.extend({
    init: function(server) {
    	var self = this;
    	
    	this.server = server;
    	
    	self.seedWheather();
    	
    	// Wheather
        setInterval(function () {
        	self.seedWheather();
    	},360*60000);
    	
    	setInterval(function () {
    		for (var i =0; i < self.Wheather.length; ++i)
    		{
    			var pattern = self.Wheather[i];
    			var elapsedTime = Date.now() - pattern.elapsedTime;
    			if (pattern.state == 0 && elapsedTime >= pattern.delay)
    			{
    				pattern.state++;
    				pattern.activeDelay = pattern.switchtime;
    				pattern.elapsedTime = Date.now();
    			}
    			else if (pattern.state == 1 && elapsedTime >= pattern.switchtime)
    			{
    				pattern.state++;
    				pattern.activeDelay = pattern.duration;
    				pattern.elapsedTime = Date.now();
    			}
    			else if (pattern.state == 2 && elapsedTime >= pattern.duration)
    			{
    				pattern.state++;
    				pattern.activeDelay = pattern.switchtime;
    				pattern.elapsedTime = Date.now();
    			}
    			else if (pattern.state == 3 && elapsedTime >= pattern.switchtime)
    			{
    				pattern.state = 0;
    				pattern.activeDelay = pattern.delay;
    				pattern.elapsedTime = Date.now();
    			}
    		}
    		//self.sendWheather();
    	}, 60000);
    	
        self.sendWheather();    	
    },
        
    sendWheather: function() {
	for (var i =0; i < this.Wheather.length; ++i)
	{
		var pattern = this.Wheather[i];
		this.server.pushWorld(new Messages.Wheather(pattern.id, (pattern.state+1)%4, pattern.activeDelay));
	}
    },
    
    seedWheather: function() {
	this.Wheather = [
		{id: 1, name: "cloudy", 
			elapsedTime: Date.now(),
			duration: Utils.randomInt(60000*15,60000*30),
			delay: Utils.randomInt(60000*60,60000*180),
			switchtime: Utils.randomInt(60000*5,60000*10),
			state: 0,
			activeDelay:0},
	    {id: 2, name: "night", 
			elapsedTime: Date.now(),
			duration:20*60000, 
			delay:30*60000, 
			switchtime:5*60000,
			state:0,
			activeDelay:0},
	    {id: 3, name: "rain", 
			elapsedTime: Date.now(),
			duration: Utils.randomInt(60000*15,60000*30),
			delay: Utils.randomInt(60000*60,60000*180),
			switchtime: Utils.randomInt(60000*5,60000*10),
			state: 1,
			activeDelay:0},
	];
	for (var i =0; i < this.Wheather.length; ++i)
	{
		var pattern = this.Wheather[i];
		pattern.activeDelay = pattern.delay;
	}        
    },
        
});

