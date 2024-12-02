/* global databaseHandler, log */

var cls = require("./lib/class"),
    ItemRoom = require("./itemroom"),
    Messages = require("./message"),
    ItemTypes = require("../shared/js/itemtypes"),
    Types = require("../shared/js/gametypes");

module.exports = Inventory = cls.Class.extend({
    init: function(owner, number, items){
        this.owner = owner;
        this.number = number;

        this.maxNumber = 48;
        this.maxStack = 100;
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

    /*hasRoomConsumable: function () {
      return this.hasRoom(0,6);
    },*/

    hasRoom: function(start, end) {
        start = start || 0;
        end = end || this.maxNumber;
        for(var i=start; i<end; i++) {
            if(!this.rooms[i]){
                return true;
            }
        }
        return false;
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

    getEmptyIndex: function(start, end) {
        if (typeof start === "undefined")
          start = 0;
        end = end || this.maxNumber;
        for(var index = start; index < end; index++) {
            if(!this.rooms[index]) {
                return index;
            }
        }
        return -1;
    },

    putItem: function(item) {
      var kind = item.itemKind;
      var consume = ItemTypes.isConsumableItem(kind);
      var loot = ItemTypes.isLootItem(kind);
      var craft = ItemTypes.isCraftItem(kind);
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

      maxStack = this.maxStack;
      if (item2.itemNumber < maxStack) {
        item2.itemNumber += item.itemNumber;
        if (item2.itemNumber > maxStack) {
          item.itemNumber = item2.itemNumber - maxStack;
          item2.itemNumber = Math.min(item2.itemNumber, maxStack);
        } else {
          item = null;
        }
      }
      if(item2.itemNumber <= 0) {
        item2 = null;
      }

      this.setItem(slot, item);
      this.setItem(slot2, item2);
      return slot2;
    },

    _putItem: function(item){
      i = this.getEmptyIndex();
      if (i < 0)
      {
        if (this.owner instanceof Player)
        	this.owner.map.entities.pushToPlayer(this.owner, new Messages.Notify("INVENTORY", "INVENTORY_FULL"));
        return -1;
      }
      else {
        this.setItem(i, item);
        return i;
      }
    },

    checkItem: function (index, item) {
      if (!item) return true;

      return true;
    },

    setItem: function (index, item)
    {
      if (!item) {
        this.rooms[index] = null;
        item = {slot: index, itemKind: -1};
      }
      else {
        if (!this.checkItem(index, item))
          return false;

        this.rooms[index] = item;
        item.slot = index;
      }
      this.owner.map.entities.pushToPlayer(this.owner, new Messages.ItemSlot(0, [item]));
      return true;
    },

    save: function ()
    {
        databaseHandler.saveItems(this.owner, 0, this.rooms);
    },

    removeItemKind: function (kind, number)
    {
      var j=number;
      for(var i in this.rooms){
        var r = this.rooms[i];
        if (!r)
          continue;
        if(r.itemKind == kind) {
          if (r.itemNumber > j) {
            r.itemNumber -= j;
            this.setItem(i, r);
            return true;
          } else {
            j -= r.itemNumber;
            r = null;
          }
          this.setItem(i, r);
        }
      }
      return false;
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

    getRandomItemNumber: function() {
    	var i = 0;
    	var index = -1;
    	var item = null;
      var len = this.rooms.length;
    	while(i < len)
    	{
    		index = ~~(Utils.randomRange(0,len-1));
    		item = this.rooms[index];
    		if (item && item.itemKind > 0)
    			return index;
    		++i;
    	}
    	return -1;
    },

    toString: function(){
      var i=0;
      var itemString = "" + this.maxNumber + ",";

      for(i=0; i<this.maxNumber; i++){
          var item = this.rooms[i];
          if (!item) continue;
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
