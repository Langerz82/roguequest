/* global Types */

function ItemRoom(slot, itemKind, itemNumber, itemDurability, itemDurabilityMax, itemExperience)
{
  this.slot = slot;
  this.itemKind = itemKind;
  this.itemNumber = itemNumber;
  this.itemDurability = itemDurability;
  this.itemDurabilityMax = itemDurabilityMax;
  this.itemExperience = itemExperience;
}
ItemRoom.toArray = function () {
  var cols = [parseInt(this.slot),
    this.itemKind,
    this.itemNumber,
    this.itemDurability,
    this.itemDurabilityMax,
    this.itemExperience];
  return cols;
}
ItemRoom.toString = function () {
    return this.toArray().join(",");
}


define(['./entity'], function(Entity) {

    var Item = Entity.extend({
        init: function(id, type, map, kind /*, type , durability, durabilityMax, experience*/) {
    	    this._super(id, type, map, kind);

          this.kind = kind;
    	    this.type = type;
    	    this.wasDropped = false;
          //this.itemDurability = durability;
          //this.itemDurabilityMax = durabilityMax;
          //this.itemExperience = experience;
    	    this.count = 1;
        },

        getItemSpriteName: function() {
             if (ItemTypes.KindData[this.kind].sprite !== "")
             {
             	     log.info("item-"+ ItemTypes.KindData[this.kind].sprite);
             	     return "item-"+ ItemTypes.KindData[this.kind].sprite;
             }
             return null;
        },

        getInfoMsg: function(){
            return this.getInfoMsgEx(this);
        },

        getInfoMsgEx: function(item) {
            var msg = '';
            if(ItemTypes.isEquipment(item.itemKind)){
                msg = ItemTypes.getName(item.itemKind) + ": Lv " + ItemTypes.getLevelByKind(item.itemKind) + (item.itemNumber ? "+" + item.itemNumber + " " : " ") + (item.itemDurability/10) + "/" + (item.itemDurabilityMax/10);
                return msg;
            }
            var name = ItemTypes.getName(item.itemKind);
            return (name) ? name : '';
        },

        getState: function () {
          this._getBaseState().concat([this.count]);
        }
    });
  Item.getInfoMsgEx = Item.prototype.getInfoMsgEx;
  return Item;
});
