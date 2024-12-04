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
        this.auctions = {};
    },

    load: function (data)
    {
      var self = this;
      console.info("auction - load: "+JSON.stringify(data));

      if (!data)
        return;

      auctions = [];
      for (var i = 0; i < Object.keys(data[0]).length; ++i) {
        var sData = data[0][i].split(",");
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

    save: function ()
    {
      console.info("auction - save: "+JSON.stringify(this.auctions));

      var data = [];
      var auctions = this.auctions;
      for(var i in auctions) {
        auction = auctions[i];
        data.push(auction.save(i));
      }

      if (world.userHandler) {
        world.userHandler.sendAuctionsData(data);
      }
    },

    add: function(player, item, price, invIndex) {
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
      var msg = [Types.Messages.WC_AUCTIONOPEN, type, 0];
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
