// TODO - Convert to bank.

/* global databaseHandler, log */

var cls = require("./lib/class"),
    ItemRoom = require("./itemroom"),
    Messages = require("./message"),
    ItemTypes = require("../shared/js/itemtypes"),
    Types = require("../shared/js/gametypes");

module.exports = Bank = cls.Class.extend({
    init: function(owner, number, items){
        this.owner = owner;
        this.number = number;

        this.maxNumber = 96;
        this.rooms = {};
        console.info("number="+number);
        //console.info("itemSlots="+JSON.stringify(itemSlots));

        if (items) {
          for(var i=0; i<items.length; i++){
              this.rooms[ items[i].slot] = items[i];
          }
        }
    },

    hasItem: function(itemKind){
        return this.hasItems(itemKind, 1);
    },

    hasItems: function(itemKind, itemCount){
        var a = 0;
        for(var i in this.rooms){
            //console.info("hasItems - compare: " + this.rooms[i].itemKind + "=" + itemKind);
            if(this.rooms[i] && this.rooms[i].itemKind === itemKind){
            	 a += this.rooms[i].itemNumber;
            	 if (a >= itemCount)
                	return true;
            }
        }
        return false;
    },

    hasItemCount: function(itemKind){
        var a = 0;
        for(var i in this.rooms){
            if(this.rooms[i] && this.rooms[i].itemKind === itemKind){
            	 a += this.rooms[i].itemNumber;
            }
        }
        return a;
    },

    makeEmptyItem: function(index) {
        this.rooms[index] = null;
        delete this.rooms[index];
        this.setItem(index, null);
    },

    getItemCount: function(itemKind){
    	for(var i in this.rooms){
            if(this.rooms[i] && this.rooms[i].itemKind == itemKind){
                return this.rooms[i].itemNumber;
            }
        }
        return 0;
    },

    getItemIndex: function(itemKind){
        for(var i in this.rooms){
            if(this.rooms[i] && this.rooms[i].itemKind == itemKind){
                return i;
            }
        }
        return -1;
    },

    getEmptyIndex: function() {
        for(var index = 0; index < this.maxNumber; index++) {
            if(!this.rooms[index]) {

                return index;
            }
        }
        return -1;
    },

    putItem: function(item) {
      var consume = ItemTypes.isConsumableItem(item.itemKind);
      var loot = ItemTypes.isLootItem(item.itemKind);
      var craft = ItemTypes.isCraftItem(item.itemKind);
      if (consume || loot || craft)
      {
        for(var i in this.rooms){
          var slot = this.combineItem(item, this.rooms[i]);
          if (slot >= 0)
            return slot;
        }
      }
      return this._putItem(item);
    },

    combineItem: function (item, item2) {
      console.info(JSON.stringify(item));
      console.info(JSON.stringify(item2));

      if(!item || !item2)
        return -1;

      if(item.itemKind != item2.itemKind)
        return -1;

      if (ItemTypes.isEquippable(item.itemKind) ||
          ItemTypes.isEquippable(item2.itemKind)) {
        return -1;
      }

      var slot = item.slot;
      var slot2 = item2.slot;

      if (item2.itemNumber < this.maxStack) {
        item2.itemNumber += item.itemNumber;
        if (item2.itemNumber > this.maxStack) {
          item.itemNumber = item2.itemNumber - this.maxStack;
          item2.itemNumber = Math.min(item2.itemNumber, this.maxStack);
        } else {
          item = null;
        }
      }
      if(item2.itemNumber <= 0) {
        item2 = null;
      }

      //if (item)
      this.setItem(slot, item);
      //if (item2)
      this.setItem(slot2, item2);
      return slot2;
    },

    _putItem: function(item){
        var i=0;

        i = this.getEmptyIndex(i,this.maxNumber);
        if (i < 0)
        {
          if (this.owner instanceof Player)
          	this.owner.map.entities.pushToPlayer(this.owner, new Messages.Notify("BANK", "BANK_FULL"));
          return -1;
        }
        else {
          this.setItem(i, item);
          return i;
        }
    },

    checkItem: function (index, item) {
      return true;
    },

    setItem: function (index, item)
    {
      if (!item) {
        item = {slot: index, itemKind: -1};
        this.rooms[index] = null;
      }
      else {
        if (!this.checkItem(index, item))
          return false;

        this.rooms[index] = item;
        item.slot = index;
      }
      this.owner.map.entities.pushToPlayer(this.owner, new Messages.ItemSlot(1, [item]));
      return true;
    },

    save: function ()
    {
        databaseHandler.saveItems(this.owner, 1, this.rooms);
    },

    takeOutItems: function(index, number){
        var item = this.rooms[index];
        if (!item)
          return null;

        if (number > item.itemNumber)
          return null;

        if (ItemTypes.isEquippable(item.itemKind)) {
          this.setItem(index, null);
          return item;
        }

        item.itemNumber -= number;

        if (item.itemNumber == 0)
          item = null;

        this.setItem(index, item);
        return item;
    },

    toString: function(){
        var i=0;
        var itemString = "" + this.maxNumber + ",";

        for(i=0; i<this.maxNumber; i++){
            var item = this.rooms[i];
            itemArray = [item.itemKind,
              item.itemNumber,
              item.itemDurability,
              item.itemDurabilityMax,
              item.itemExperience];
            itemString += itemArray.join(',');
        }
        return itemString;
    },

    toStringJSON: function () {
      var itemString = "[";
      var isItems = false;

      for(var i=0; i<this.maxNumber; i++){
          var item = this.rooms[i];
          if (!item) continue;
          itemArray = [i,
            item.itemKind,
            item.itemNumber,
            item.itemDurability,
            item.itemDurabilityMax,
            item.itemExperience];
          itemString += "["+itemArray.join(',')+"],"
          isItems = true;
      }
      itemString = itemString.slice(0, -1);
      itemString += "]";
      if (!isItems) return "[]";
      return itemString;
    }

});
