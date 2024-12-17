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
        return [this.playerName,
          this.price].join(",") + "," + this.item.save();
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
        this.auctions = [];
    },

    load: function (data)
    {
      var self = this;
      console.info("auction - load: "+JSON.stringify(data));

      if (Array.isArray(data) && data.length === 0)
        return;

      auctions = [];
      for (var rec of data)
      {
        var sData = rec.split(",");
        var record = new AuctionRecord(sData[0],
          parseInt(sData[1]),
          new ItemRoom(parseInt(sData[2]),
             parseInt(sData[3]),
             parseInt(sData[4]),
             parseInt(sData[5]),
             parseInt(sData[6]))
          );
        auctions.push(record);
      }
      if (auctions)
        this.auctions = auctions;
    },

    save: function (world)
    {
      console.info("auction - save: "+JSON.stringify(this.auctions));

      var data = [];
      for(var auction of this.auctions) {
        if (auction)
          data.push(auction.save(i));
      }

      if (world.userHandler) {
        world.userHandler.sendAuctionsData(data);
      } else {
        console.info("save: world.userHandler not set.");
      }
    },

    add: function(player, item, price, invIndex) {
        var auction = new AuctionRecord(player.name, price, item);
        this.auctions.push(auction);
        player.inventory.setItem(invIndex, null);
        player.map.entities.pushToPlayer(player, new Messages.Notify("AUCTION","AUCTION_ADDED"));
    },

    remove: function (index) {
      this.auctions[index] = null;
    },

    list: function (player, type) {
      var msg = [Types.Messages.WC_AUCTIONOPEN, type, 0];
      var recCount = 0;
      for (var auction of this.auctions) {
        if (!auction) {
          continue;
        }
        var kind = auction.item.itemKind;
        var pc = player.name === auction.playerName;
        if ((type === 1 && !pc && ItemTypes.isArmor(kind)) ||
          (type === 2 && !pc && ItemTypes.isWeapon(kind)) ||
          (type === 0 && pc))
        {
          msg = msg.concat(auction.toArray(i));
          ++recCount;
        }
      }
      msg[2] = recCount;
      player.map.entities.pushToPlayer(player, new Messages.AuctionOpen(msg));
    }
});
