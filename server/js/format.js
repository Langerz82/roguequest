var _ = require('underscore');
var Types = require('../shared/js/gametypes');

(function () {
    FormatChecker = Class.extend({
        init: function () {
            this.formats = [];

            this.usernameMax = 16;
            this.playerMax = 16;
            this.dateMin = 1670000000000;
            this.dateMax = 2000000000000;
            this.hashLen = 120;
            //this.entityIdMin = 0;
            this.entityIdMax = 99999;
            //this.coordMin = -1;
            this.coordMax = 16384;
            this.bankMax = 47;
            this.inventoryMax = 47;
            this.goldMax = 99999999;
            this.gemMax = 9999;
            this.itemCountMax = 100;
            this.itemKindMax = 999;
            this.questMax = 999;

            this.formats[Types.Messages.BI_SYNCTIME] = [['n',this.dateMin,this.dateMax]],

// USER LOGIN PACKETS
            this.formats[Types.Messages.CS_CREATE_USER] = [['s',2,this.usernameMax],['s',this.hashLen,this.hashLen]],
            this.formats[Types.Messages.CS_LOGIN_USER] = [['s',2,this.usernameMax],['s',this.hashLen,this.hashLen]],
            this.formats[Types.Messages.CS_REMOVE_USER] = [['s',2,this.usernameMax],['s',this.hashLen,this.hashLen]],
            this.formats[Types.Messages.CS_CREATE_PLAYER] = [['n',0,9],['s',2,this.playerMax]],
            this.formats[Types.Messages.CS_LOGIN_PLAYER] = [['n',0,9],['n',0,16]],
// END USER LOGIN PACKETS

            this.formats[Types.Messages.CS_APPEARANCEUNLOCK] = [['n',0,255],['n',0,this.gemMax]],
            this.formats[Types.Messages.CS_ATTACK] = [['n',this.dateMin,this.dateMax],['n',0,this.entityIdMax],['n',0,4],['n',-1,50]],
            this.formats[Types.Messages.CS_AUCTIONBUY] = [['n',0,1000],['n',0,3]],
            this.formats[Types.Messages.CS_AUCTIONDELETE] = [['n',0,1000],['n',0,3]],
            this.formats[Types.Messages.CS_AUCTIONOPEN] = [['n',0,3]],
            this.formats[Types.Messages.CS_AUCTIONSELL] = [['n',0,this.inventoryMax],['n',0,this.goldMax]],
            this.formats[Types.Messages.CS_BANKRETRIEVE] = [['n',0,this.bankMax]],
            this.formats[Types.Messages.CS_BANKSTORE] = [['n',0,this.inventoryMax]],
            this.formats[Types.Messages.CS_CHAT] = [['s',1,256]],
            this.formats[Types.Messages.CS_COLOR_TINT] = [['n',0,1],['s',6,6]],
            this.formats[Types.Messages.CS_BLOCK_MODIFY] = [['n',0,1],['n',0,this.entityIdMax],['n',0,this.coordMax],['n',0,this.coordMax]],
            this.formats[Types.Messages.CS_LOOKUPDATE] = [['n',0,1],['n',0,999]],
            this.formats[Types.Messages.CS_LOOT] = [['n',0,this.entityIdMax],['n',0,this.coordMax],['n',0,this.coordMax]],
            this.formats[Types.Messages.CS_MOVE] = [['n',this.dateMin,this.dateMax],['n',0,this.entityIdMax],['n',0,2],['n',0,4],['n',0,this.coordMax],['n',0,this.coordMax]],
            this.formats[Types.Messages.CS_GOLD] = [['n',0,1],['n',0,this.goldMax],['n',0,1]],
            this.formats[Types.Messages.CS_STATADD] = [['n',1,5],['n',1,1]],
            this.formats[Types.Messages.CS_STOREBUY] = [['n',1,3],['n',0,this.itemKindMax],['n',0,10]],
            this.formats[Types.Messages.CS_CRAFT] = [['n',0,this.itemKindMax],['n',0,10]],
            this.formats[Types.Messages.CS_STORE_MODITEM] = [['n',0,2],['n',0,2],['n',0,this.inventoryMax]],
            this.formats[Types.Messages.CS_STORESELL] = [['n',0,2],['n',0,this.inventoryMax]],
            this.formats[Types.Messages.CS_TALKTONPC] = [['n',5,6],['n',0,this.entityIdMax]],
            this.formats[Types.Messages.CS_TELEPORT_MAP] = [['n',0,9],['n',0,1],['n',-1,this.coordMax],['n',-1,this.coordMax]],
            this.formats[Types.Messages.CS_SKILL] = [['n',0,50],['n',0,this.entityIdMax]],
            this.formats[Types.Messages.CS_SHORTCUT] = [['n',0,7],['n',0,2],['n',0,this.itemKindMax]],
            this.formats[Types.Messages.CS_PARTY] = [['n',0,4],['so',0,this.playerMax],['no',0,3]],
            this.formats[Types.Messages.CS_HARVEST] = [['n',0,this.coordMax],['n',0,this.coordMax]],
            this.formats[Types.Messages.CS_USE_NODE] = [['n',0,this.entityIdMax]],
            this.formats[Types.Messages.CS_QUEST] = [['n',0,this.entityIdMax],['n',0,this.questMax],['n',0,2]],

// NOTE - The following need no paramateres so they are grouped into 1 packet type.
// CS_APPEARANCELIST
// CS_PLAYER_REVIVE
// CS_PLAYERINFO
            this.formats[Types.Messages.CS_REQUEST] = [['n',0,2]]
        },

        checkFormat: function (type, message, format, ignoreLength) {
          var format = format || this.formats[type];
              ignoreLength = ignoreLength || false;

          //message.shift();

          var formatTypes = function (data) {

          };

          if (format) {
              if (!ignoreLength && message.length !== format.length) {
                  return false;
              }
              for (var i = 0, n = format.length; i < n; i += 1) {
                  var fmt = format[i];
                  var msg = message[i];
                  if (Array.isArray(fmt))
                  {
                    var fnn = fmt[0] === 'n' && (!_.isNumber(msg) || msg < fmt[1] || msg > fmt[2]);
                    //var fno = fmt[0] === 'no' && (_.isNull(msg) || fn);
                    if (fnn /*|| fno*/)
                      return false;

                    var fss = fmt[0] === 's' && (!_.isString(msg) || msg.length < fmt[1] || msg.length > fmt[2]);
                    //var fso = fmt[0] === 'so' && (_.isNull(msg) || fs);
                    if (fss /*|| fso*/)
                      return false;

                    //if (fmt[0] === 'n' && (!_.isNumber(msg) || msg < fmt[1] || msg > fmt[2])) {
                      //return false;
                    //}
                    //if (fmt[0] === 's' && (!_.isString(msg) || msg.length < fmt[1] || msg.length > fmt[2])) {
                      //return false;
                    //}
                  }
                  else {
                    if (fmt === 'n' && !_.isNumber(msg)) {
                        return false;
                    }
                    if (fmt === 's' && !_.isString(msg)) {
                        return false;
                    }
                    /*if (fmt === 'no' && (_.isNull(msg) || !_.isNumber(msg))) {
                        return false;
                    }
                    if (fmt === 'so' && (_.isNull(msg) || !_.isString(msg))) {
                        return false;
                    }*/

                  }
              }
              return true;
          }
          else {
              console.error('Unknown message type: ' + type);
              return false;
          }
        },

        check: function (msg) {
            //console.info("msg:"+msg);
            var message = msg.slice(0),
                type = message.shift(),
                format = format || this.formats[type];

            //console.info("type:"+type);
            if (this.formats[type]) {
                return this.checkFormat(type, message, this.formats[type], false);
            }
            if (type === Types.Messages.CS_MOVEPATH) {
                var format = [['n',this.dateMin,this.dateMax],['n',0,this.entityIdMax],['n',0,4],['n',0,1]];
                if (!this.checkFormat(type, message, format, true))
                  return false;

                var path = message.splice(format.length,message.length);
                //console.info("path:"+JSON.stringify(path));
                if (!path)
                  return false;

                if (path.length < 2 || path.length > 16)
                  return false;
                //var coords = JSON.parse(path);
                //if (!Array.isArray(path))
                  //return false;
                for (var coord of path)
                {
                  //console.info("coord:"+JSON.stringify(coord));
                  if (!Array.isArray(coord) || coord.length != 2)
                    return false;
                  var a=0;
                  for (var i=0; i < 2; ++i)
                  {
                    a = coord[i];
                    if (!_.isNumber(a) || a < 0 || a > this.coordMax)
                      return false;
                  }
                }

                return true;
            }
            else if (type === Types.Messages.CS_WHO) {
              try {
                var arr = JSON.parse(message);
              } catch (e) {
                  return false;
              }
              return message.length > 0 && _.all(message, function (param) { return (_.isNumber(param) && param > 0 && param < 99999); });
            }
            else if (type === Types.Messages.CS_ITEMSLOT) {
              var message = msg.slice(0),
                  type = message.shift();

              var format = [['n',0,3], ['n',0,2], ['n',-1,this.inventoryMax], ['n',0,this.itemCountMax]];
              if (message.length == 7) {
                format = format.concat([['n',0,2], ['n',-1,this.inventoryMax], ['n',0,this.itemCountMax]]);
              }
              return this.checkFormat(type, message, format, true);
            }
            else {
                try{ throw new Error(); } catch (err) { console.info(err.stack); }
                console.error('Unknown message type: ' + type);
                console.warn("message="+message);
                return false;
            }
        }
    });

    var checker = new FormatChecker();

    exports.check = checker.check.bind(checker);
})();
