var cls = require("./lib/class"),
    ItemRoom = require("./itemroom"),
    Messages = require("./message"),
    ItemTypes = require("../shared/js/itemtypes"),
    Types = require("../shared/js/gametypes");

module.exports = AuctionRecord = cls.Class.extend({
    init: function (playerName, price, item) {
      this.playerName = playerName;
      this.price = price;
      this.item = item;
    },

    save: function (index) {
        var cols = [this.playerName,
          this.price];
        return cols.join(",") + "," + this.item.save();
    },

    toArray: function (index) {
      var cols = [parseInt(index),
        this.playerName,
        this.price];
      cols = cols.concat(this.item.toArray());
      return cols;
    }
});

module.exports = Auction = cls.Class.extend({
    init: function(){
        this.auctions = {};
        this.load();
    },

    load: function ()
    {
      var self = this;
      console.info("AUCTION LOAD");
      databaseHandler.loadAuctions(self, self.onLoad);

    },
// TODO - see if this can be simplified.
    onLoad: function (self, auctions)
    {
      if (auctions)
        self.auctions = auctions;
    },

    save: function ()
    {
      console.info("AUCTION SAVED");
      if (this.auctions)
        databaseHandler.saveAuctions(this.auctions);

    },

    add: function(player, item, price, invIndex) {
        //this.auctions = databaseHandler.loadAuctions();
        var count = 0;
        if (this.auctions)
          count = Object.keys(this.auctions).length;
        this.auctions[count] = new AuctionRecord(player.name, price, item);
        player.inventory.setItem(invIndex, null);
        player.map.entities.pushToPlayer(player, new Messages.Notify("AUCTION","AUCTION_ADDED"));
    },

    remove: function (index) {
      this.auctions[index] = null;
    },

    list: function (player, type) {
      var msg = [Types.Messages.SC_AUCTIONOPEN, type, 0];
      var recCount = 0;
      for (var i in this.auctions) {
        var rec = this.auctions[i];
        if (!rec) {
          //msg.push(parseInt(i));
          //msg.push(-1);
          continue;
        }
        var kind = rec.item.itemKind;
        var pc = player.name === rec.playerName;
        if ((type === 1 && !pc && ItemTypes.isArmor(kind)) ||
          (type === 2 && !pc && ItemTypes.isWeapon(kind)) ||
          (type === 0 && pc))
        {
          msg = msg.concat(rec.toArray(i));
          ++recCount;
        }
      }
      msg[2] = recCount;
      player.map.entities.pushToPlayer(player, new Messages.AuctionOpen(msg));
    }
});
