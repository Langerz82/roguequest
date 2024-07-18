var cls = require('./lib/class');

module.exports = Settings = cls.Class.extend({
    init: function() {
        this.showPlayerNames = true;
        this.frameColour = "default";
        this.musicOn = false;
        this.sfxOn = true;
    }
    
    
});