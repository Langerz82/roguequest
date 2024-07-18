var cls = require("./lib/class"),
    Types = require("../shared/js/gametypes"),
    RequestHandler = require("./requesthandler"),
    Messages = require("./message");

/* global Trade, log */

module.exports = Trade = cls.Class.extend({
    init: function(player, otherPlayer, rooms) {
        this.player = player;
        this.otherPlayer = otherPlayer;
        this.requestAssistant = new RequestHandler(player, otherPlayer);
        this.items = {};
        this.currentState = null;
        this.rooms = rooms;
        this.roomId = 0;
    },


    sendRequest: function(player, otherPlayer) {
        if ((this.otherPlayerSentRequest && this.currentPlayerSentRequest) || (this.currentPlayerSentRequest && this.otherPlayerSentRequest)) {
            this.startTradingProcess(player, otherPlayer);
            return;
        }
        if (player && otherPlayer) {
            player.map.entities.pushToPlayer(player, new Messages.Notify("TRADE", "TRADE_REQUESTED", [otherPlayer.name]));
            otherPlayer.map.entities.pushToPlayer(otherPlayer, new Messages.Notify("TRADE", "TRADE_REQUEST", [player.name]));
            this.currentPlayerSentRequest = true;
            return;
        }
        console.info("An error has occured.");
    },

    startTradingProcess: function(player, otherPlayer) {
        if (player.admin) {
            player.map.entities.pushToPlayer(player);
            return;
        }
        this.currentState = Types.Messages.INVENTORYSTATE.STARTED;

        otherPlayer.server.pushToPlayer(otherPlayer, Types.Messages.TRADESCREEN);
        player.map.entities.pushToPlayer(player, Types.Messages.TRADESCREEN);
    },



    addItemToTradeSession: function(itemKind, itemCount, player, otherPlayer, inventoryNumber, playerCountChosen, otherPlayerChosenCount) {
        for(var iRooms = 0; iRooms < player.inventory.rooms; iRooms++) {
            for (var selectedInventory in iRooms) {
                if (ItemTypes.isConsumableItem(selectedInventory.kind)) {
                    player.map.entities.pushToPlayer(player, Types.Messages.TRADESTATES.TRADECOUNT);
                    if (itemCount > playerCountChosen) {
                        this.items.push(itemKind, itemCount);
                        player.map.entities.pushToPlayer(player, new Messages.TradeStates)
                    } else {
                        this.items.push(itemKind, playerCountChosen);
                    }
                } else {
                    this.items.push(itemKind, itemCount);
                }

            }
        }
    },

    removeItemFromTradeSession: function(itemKind, itemCount, player, otherPlayer, roomId) {
        this.roomId = roomId;
        for (roomId in this.rooms) {
            roomId.delete(itemKind, itemCount);
            player.map.entities.pushToPlayer(player, Types.Messages.TRADESTATES.ITEMREMOVED);
        }
    }


});
