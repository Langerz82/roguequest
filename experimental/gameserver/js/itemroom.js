var cls = require("./lib/class"),
    Types = require("../shared/js/gametypes"),
    ItemTypes = require("../shared/js/itemtypes");

module.exports = ItemRoom = cls.Class.extend({
    init: function(itemKind, itemNumber, itemDurability, itemDurabilityMax, itemExperience){
        this.set(itemKind, itemNumber, itemDurability, itemDurabilityMax, itemExperience);
    },

    assign: function (itemRoom) {
      this.set(itemRoom.itemKind,
        itemRoom.itemNumber,
        itemRoom.itemDurability,
        itemRoom.itemDurabilityMax,
        itemRoom.itemExperience);
    },

    set: function(itemKind, itemNumber, itemDurability, itemDurabilityMax, itemExperience){
        this.slot = -1;
        this.itemKind = itemKind;
        this.itemNumber = itemNumber;
        this.itemDurability = itemDurability ? itemDurability : ((ItemTypes.isConsumableItem(itemKind) || ItemTypes.isCraftItem(itemKind)) ? 0 : 900);
        this.itemDurabilityMax = itemDurabilityMax ? itemDurabilityMax : ((ItemTypes.isConsumableItem(itemKind) || ItemTypes.isCraftItem(itemKind)) ? 0 : 900);
        this.itemExperience = itemExperience || 0;
    },

    addNumber: function(number){
        this.itemNumber += number;
    },

    save: function()
    {
      var cols = [
        this.itemKind,
        this.itemNumber,
        this.itemDurability,
        this.itemDurabilityMax,
        this.itemExperience];

      return cols.join(",");
    },

    toArray: function ()
    {
      var cols = [
        parseInt(this.slot),
        this.itemKind,
        this.itemNumber,
        this.itemDurability,
        this.itemDurabilityMax,
        this.itemExperience];
      return cols;
    }
});
