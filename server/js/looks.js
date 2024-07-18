var cls = require("./lib/class"),
    Messages = require("./message"),
    AppearanceData = require("./data/appearancedata");

module.exports = Looks = cls.Class.extend({
    init: function(){
        var length = AppearanceData.Data.length;
        this.prices = new Array(length);
        this.load();

        for (var i = 0; i < length; i++) {
          this.prices[i] = 500;
        }
        this.prices[0] = 0; // Sword1
        this.prices[50] = 0; // WoodenBow
        this.prices[77] = 0; // Cloth armor
        this.prices[151] = 0; // Cloth armor
    },

    load: function ()
    {
      console.info("LOOKS LOAD");
      databaseHandler.loadLooks(this.prices);
    },

    save: function ()
    {
      console.info("LOOKS SAVED");
      if (this.prices)
        databaseHandler.saveLooks(this.prices);

    },

    modPrice: function (index, modPrice) {
      this.prices[index] += modPrice;
    },

    pricesToString: function () {
      return this.prices.join(',');
    },

    sendLooks: function (player) {
      player.map.entities.pushToPlayer(player, new Messages.AppearanceList(player.user, this));
    }
});
