/* global databaseHandler, log */

var cls = require("./lib/class"),
    ItemRoom = require("./itemroom"),
    Messages = require("./message"),
    ItemTypes = require("../shared/js/itemtypes"),
    Types = require("../shared/js/gametypes"),
    ItemData = require("./data/itemdata");

module.exports = Equipment = cls.Class.extend({
    init: function(owner, number, items){
        this.owner = owner;
        this.number = number;
        this.maxNumber = 5;
        this.weaponSlot = 4;
        this.rooms = {};
        console.info("number="+number);
        console.info("itemSlots="+JSON.stringify(items));

        if (items) {
          for(var i=0; i<items.length; i++){
            var index = items[i].slot;
            this.rooms[index] = items[i];
            /*if (items[i] && index == this.weaponSlot) {
              this.owner.setRange();
            }*/
          }
        }
    },

    /*hasItem: function(itemKind){
        return this.hasItems(itemKind, 1);
    },

    hasItems: function(itemKind, itemCount){
        var a = 0;
        for(var i in this.rooms){
            //console.info("hasItems - compare: " + this.rooms[i].itemKind + "=" + itemKind);
            if(this.rooms[i].itemKind === itemKind){
            	 a += this.rooms[i].itemNumber;
            	 if (a >= itemCount)
                	return true;
            }
        }
        return false;
    },*/

    makeEmptyItem: function(index) {
        this.rooms[index] = null;
        delete this.rooms[index];
        this.setItem(index, null);
    },

    /*getItemCount: function(itemKind){
    	for(var i in this.rooms){
            if(this.rooms[i].itemKind == itemKind){
                return this.rooms[i].itemNumber;
            }
        }
        return 0;
    },*/

    getItemIndex: function(itemKind){
        for(var i in this.rooms){
            if(this.rooms[i] && this.rooms[i].itemKind == itemKind){
                return i;
            }
        }
        return -1;
    },

    /*getEmptyIndex: function() {
        for(var index = 0; index < this.maxNumber; index++) {
            if(!this.rooms[index]) {

                return index;
            }
        }
        return -1;
    },*/

    /*putItem: function(item) {
        return this._putItem(item);
    },

    _putItem: function(item){
        for(var i=0; i < this.maxNumber; i++){
            var item = this.rooms[i];
            if(!item) {
                this.setItem(i, item);
                return i;
            }
        }
        if (this.owner instanceof Player)
        	this.owner.map.entities.pushToPlayer(this.owner, new Messages.Notify("EQUIPMENT", "EQUIPMENT_FULL"));
        return -1;
    },*/

    combineItem: function (item, item2) {
      return -1;
    },

    checkItem: function (index, item) {
      if (!item)
        return true;

      var kind = item.itemKind;
      var data = ItemData.Kinds[kind];
      //var equip = this.rooms;
      //var isArmor = ItemTypes.isArmor(kind);

      if (!ItemTypes.isEquipment(kind))
        return false;

      if (index==0 && !(data.type === "helm" && this.canEquip(item, data.level)))
        return false;
      //if (slot==1 && (!isArmor || !this.canEquip(item, ItemTypes.getArmorLevel(kind))))
      if (index==1 && !(data.type === "chest" && this.canEquip(item, data.level)))
        return false;
      if (index==2 && !(data.type === "gloves" && this.canEquip(item, data.level)))
        return false;
      if (index==3 && !(data.type === "boots" && this.canEquip(item, data.level)))
        return false;
      //var isWeapon = ItemTypes.isWeapon(kind);
      if (index==4 && !(ItemTypes.isWeapon(kind) && this.canEquip(item, ItemTypes.getWeaponLevel(kind))))
        return false;

      return true;
    },

    setItem: function (index, item)
    {
      var weaponFN = function (player) {
        player.setRange();
        //player.map.entities.pushNeighbours(player, new Messages.Looks(player));
        var s1 = player.isArcher() ? player.sprites[2] : player.sprites[0];
        var s2 = player.sprites[1];
        player.map.entities.pushNeighbours(player, new Messages.setSprite(player, s1, s2));
      };

      var player = this.owner;
      if (!item) {
        this.rooms[index] = null;
        item = {slot: index, itemKind: -1};
        if (index == this.weaponSlot) {
          weaponFN(player);
        }
      }
      else {
        if (!this.checkItem(index, item))
          return false;

        this.rooms[index] = item;
        item.slot = index;

        if (index == this.weaponSlot) {
          weaponFN(player);
        }
      }
      player.map.entities.pushToPlayer(player, new Messages.ItemSlot(2, [item]));
      return true;
    },

    canEquip: function(item, level){
      var player = this.owner;
      var kind = item.itemKind;
      //var level = ItemTypes.getArmorLevel(kind);

      if(level > player.level.base){
          player.map.entities.pushToPlayer(player, new Messages.Notify("EQUIP", "EQUIPMENT_LEVEL", [level]));
          return false;
      }

      return true;
    },

    save: function ()
    {
        databaseHandler.saveItems(this.owner, 2, this.rooms);
    },

    /*takeOutItems: function(index, number){
        var item = this.rooms[index];
        if((ItemTypes.isLootItem(item.itemKind) || ItemTypes.isConsumableItem(item.itemKind)) && item.itemNumber > number)
        {
            item.itemNumber -= number;
        }
        this.setItem(index, item);
    },*/

    degradeItem: function (slot, adjustment) {
	    var item = this.rooms[slot];
	    if (!item)
	    	return;
	    item.itemDurability -= adjustment;
	    item.itemDurability = Math.max(0,item.itemDurability);
	    if (item.itemDurability == 0 && item.itemDurabilityMax <= 30)
	    {
	    	this.makeEmptyEquipment(slot);
	    	return false;
	    }
      this.owner.map.entities.pushToPlayer(this.owner, new Messages.ItemSlot(2, [item]));
	    return true;
    },

    addExperience: function (slot, adjustment) {
	    var item = this.rooms[slot];
	    if (!item)
	    	return;

	    item.itemExperience += adjustment;
	    var oldItemNumber = item.itemNumber;
	    var newItemNumber = ItemTypes.getItemLevel(item.itemExperience);

	    if (oldItemNumber < newItemNumber)
	    {
	    	item.itemNumber++;
	    	this.owner.map.entities.pushToPlayer(this.owner, new Messages.ItemLevelUp(slot, item));
	    }

      //log.warn("addExperience - item:"+JSON.stringify(item));
      item.slot = slot;
      this.owner.map.entities.pushToPlayer(this.owner, new Messages.ItemSlot(2, [item]));
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
