var _ = require('underscore');
var Types = require('../shared/js/gametypes');

var isTypeValid = function (fmt,msg) {
  if (Array.isArray(fmt)) {
    var res = _isTypeValid(fmt[0],msg);
    if (!res) {
      console.info("_isTypeValid = false");
      return false;
    }

    if (fmt[0] === 'no' || fmt[0] === 'so')
    {
      console.info("format is optional and ok.");
      return true;
    }

    var cfn = (fmt[0] === 'n' && msg >= fmt[1] && msg <= fmt[2]);
    if (cfn) {
      console.info("format is number and in range.");
      return true;
    }

    var cfs = (fmt[0] === 's' && msg.length >= fmt[1] && msg.length <= fmt[2]);
    if (cfs) {
      console.info("format is string and in range.");
      return true;
    }

    var cfa = (fmt[0] === 'array' && msg.length >= fmt[1] && msg.length <= fmt[2]);
    if (cfa) {
      console.info("format is Array and in length.");
      return true;
    }

    var cfo = (fmt[0] === 'object' && Object.keys(msg).length >= fmt[1] && Object.keys(msg).length <= fmt[2]);
    if (cfo) {
      console.info("format is Object and in keys range.");
      return true;
    }
  }
  else {
    return _isTypeValid(fmt,msg);
  }
};

var _isTypeValid = function (fmt, msg) {

  if (fmt === 'n' && _.isNumber(parseInt(msg))) {
      console.info("isType is number");
      return true;
  }
  if (fmt === 's' && _.isString(msg)) {
      console.info("isType is string");
      return true;
  }
  if (fmt === 'no' && (_.isNull(msg) || _.isNumber(parseInt(msg)))) {
      console.info("isType is optional number");
      return true;
  }
  if (fmt === 'so' && (_.isNull(msg) || _.isString(msg))) {
      console.info("isType is optional string");
      return true;
  }
  if (fmt === 'array' && Array.isArray(msg)) {
      console.info("isType is Array");
      return true;
  }
  if (fmt === 'object' && (typeof(msg) === 'object')) {
      console.info("isType is Object");
      return true;
  }
  console.info("isType not type or invalid.");
  console.info("fmt:"+fmt);
  console.info("msg:"+JSON.stringify(msg));
  return false;
};

(function () {
    FormatChecker = Class.extend({
        init: function () {
            this.formats = {};

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
            this.formats[Types.Messages.CW_CREATE_USER] = [
              ['s',2,this.usernameMax],
              ['s',this.hashLen,this.hashLen]],
            this.formats[Types.Messages.CW_LOGIN_USER] = [
              ['s',2,this.usernameMax],
              ['s',this.hashLen,this.hashLen]],
            this.formats[Types.Messages.CW_REMOVE_USER] = [
              ['s',2,this.usernameMax],
              ['s',this.hashLen,this.hashLen]],
            this.formats[Types.Messages.CW_CREATE_PLAYER] = [
              ['n',0,9],
              ['s',2,this.playerMax]],
            this.formats[Types.Messages.CW_LOGIN_PLAYER] = [
              ['n',0,9],
              ['n',0,16]],
// END USER LOGIN PACKETS

            this.formats[Types.Messages.CW_APPEARANCEUNLOCK] = [
              ['n',0,255],
              ['n',0,this.gemMax]],
            this.formats[Types.Messages.CW_ATTACK] = [
              ['n',this.dateMin,this.dateMax],
              ['n',0,this.entityIdMax],
              ['n',0,4],
              ['n',-1,50]],
            this.formats[Types.Messages.CW_AUCTIONBUY] = [
              ['n',0,1000],
              ['n',0,3]],
            this.formats[Types.Messages.CW_AUCTIONDELETE] = [
              ['n',0,1000],
              ['n',0,3]],
            this.formats[Types.Messages.CW_AUCTIONOPEN] = [
              ['n',0,3]],
            this.formats[Types.Messages.CW_AUCTIONSELL] = [
              ['n',0,this.inventoryMax],
              ['n',0,this.goldMax]],
            this.formats[Types.Messages.CW_BANKRETRIEVE] = [
              ['n',0,this.bankMax]],
            this.formats[Types.Messages.CW_BANKSTORE] = [
              ['n',0,this.inventoryMax]],
            this.formats[Types.Messages.CW_CHAT] = [
              ['s',1,256]],
            this.formats[Types.Messages.CW_COLOR_TINT] = [
              ['n',0,1],['s',6,6]],
            this.formats[Types.Messages.CW_BLOCK_MODIFY] = [
              ['n',0,1],
              ['n',0,this.entityIdMax],
              ['n',0,this.coordMax],
              ['n',0,this.coordMax]],
            this.formats[Types.Messages.CW_LOOKUPDATE] = [
              ['n',0,1],
              ['n',0,999]],
            this.formats[Types.Messages.CW_LOOT] = [
              ['n',0,this.entityIdMax],
              ['n',0,this.coordMax],
              ['n',0,this.coordMax]],
            this.formats[Types.Messages.CW_MOVE] = [
              ['n',this.dateMin,this.dateMax],
              ['n',0,this.entityIdMax],
              ['n',0,2],
              ['n',0,4],
              ['n',0,this.coordMax],
              ['n',0,this.coordMax]],
            this.formats[Types.Messages.CW_GOLD] = [
              ['n',0,1],
              ['n',0,this.goldMax],
              ['n',0,1]],
            this.formats[Types.Messages.CW_STATADD] = [
              ['n',1,5],
              ['n',1,1]],
            this.formats[Types.Messages.CW_STOREBUY] = [
              ['n',1,3],
              ['n',0,this.itemKindMax],
              ['n',0,10]],
            this.formats[Types.Messages.CW_CRAFT] = [
              ['n',0,this.itemKindMax],
              ['n',0,10]],
            this.formats[Types.Messages.CW_STORE_MODITEM] = [
              ['n',0,2],
              ['n',0,2],
              ['n',0,this.inventoryMax]],
            this.formats[Types.Messages.CW_STORESELL] = [
              ['n',0,2],
              ['n',0,this.inventoryMax]],
            this.formats[Types.Messages.CW_TALKTONPC] = [
              ['n',5,6],
              ['n',0,this.entityIdMax]],
            this.formats[Types.Messages.CW_TELEPORT_MAP] = [
              ['n',0,9],
              ['n',0,1],
              ['n',-1,this.coordMax],
              ['n',-1,this.coordMax]],
            this.formats[Types.Messages.CW_SKILL] = [
              ['n',0,50],
              ['n',0,this.entityIdMax]],
            this.formats[Types.Messages.CW_SHORTCUT] = [
              ['n',0,7],
              ['n',0,2],
              ['n',0,this.itemKindMax]],
            this.formats[Types.Messages.CW_PARTY] = [
              ['n',0,4],
              ['so',0,this.playerMax],
              ['no',0,3]],
            this.formats[Types.Messages.CW_HARVEST] = [
              ['n',0,this.coordMax],
              ['n',0,this.coordMax]],
            this.formats[Types.Messages.CW_USE_NODE] = [
              ['n',0,this.entityIdMax]],
            this.formats[Types.Messages.CW_QUEST] = [
              ['n',0,this.entityIdMax],
              ['n',0,this.questMax],
              ['n',0,2]],
            this.formats[Types.Messages.CW_MOVEPATH] = [
              ['n',this.dateMin,this.dateMax],
              ['n',0,this.entityIdMax],
              ['n',0,4],
              ['n',0,1],
              ['array',2,16,[
                ['n',0,this.coordMax],
                ['n',0,this.coordMax]]
              ]],
            this.formats[Types.Messages.CW_WHO] = [['array',0,999,[
                ['n',0,99999]]
            ]];
            /*this.formats[Types.Messages.CW_ITEMSLOT] = [
              ['n',0,3],
              ['n',0,2],
              ['n',-1,this.inventoryMax],
              ['n',0,this.itemCountMax]
              ['no',0,2],
              ['no',-1,this.inventoryMax],
              ['no',0,this.itemCountMax]
            ];*/

// NOTE - The following need no paramateres so they are grouped into 1 packet type.
// CW_APPEARANCELIST
// CW_PLAYER_REVIVE
// CW_PLAYERINFO
// CW_WHO REQUEST
            this.formats[Types.Messages.CW_REQUEST] = [['n',0,3]]
        },

        checkFormatData: function (fmt, msg) {
            var tfmt = (Array.isArray(fmt)) ? fmt[0] : fmt;
            var t = isTypeValid(tfmt, msg);
            if (!t) {
              console.info("isType not type or invalid.");
              return false;
            }

            var cfa = (fmt[0] === 'array');
            if (cfa) {
              console.info("format is Array and in length.");
              if (fmt[3]) {
                for(var i=0; i < msg.length; ++i) {
                  var res = this.checkFormat(fmt[3], [msg[i]], true);
                  if (!res) return false;
                }
              }
            }

            var cfo = (fmt[0] === 'object');
            if (cfo) {
              console.info("format is Object and in keys range.");
              if (fmt[3]) {
                for (var id in msg[i]) {
                  var res = this.checkFormat(fmt[3], msg[i][id]);
                  if (!res) return false;
                }
              }
            }
            return true;
        },

        checkFormat: function (format, message, ignoreLength) {
          var self = this;
          //var format = format || this.formats[type];
          var ignoreLength = ignoreLength || false;

          if (format) {
              console.info("message:"+message);
              console.info("format:"+format);
              if (!ignoreLength && message.length !== format.length) {
                  console.info("checkFormat - length incorrect. fmt:"+JSON.stringify(message)+", msg:"+JSON.stringify(format));
                  return false;
              }

              var fmt = (Array.isArray(format[0])) ? format[0][0] : format[0];

              // handle empty arrays.
              if (fmt==='array' && Array.isArray(message) && message.length===0) {
                  return (Array.isArray(fmt)) ? (fmt[1]===0) : true;
              }

              // handle empty objects.
              if (fmt==='object' && typeof(message) === 'object' && Object.keys(message).length===0) {
                  return (Array.isArray(fmt)) ? (fmt[1]===0) : true;
              }

              for (var i = 0, n = format.length; i < n; i += 1) {
                  var res = this.checkFormatData(format[i], message[i]);
                  if (!res) return false;
              }
              return true;
          }
          else {
              console.error('Unknown message type. ');
              console.warn('message: ' + JSON.stringify(message));
              console.warn('format: ' + JSON.stringify(format));
              return false;
          }
        },

        check: function (msg) {
            var self = this;

            console.info("msg:"+JSON.stringify(msg));
            var message = msg.slice(0);
            var type = message.shift();
            var format = this.formats[type];

            console.info("msg: "+JSON.stringify(message));
            console.info("type: "+type);
            if (format)
            {
                console.info("checkFormat type:"+type);
                var res = this.checkFormat(format, message, true);
                return res;
            }
            /*else if (type === Types.Messages.CW_MOVEPATH)
            {
              console.info("type CW_MOVEPATH");
              var format = [
                  ['n',this.dateMin,this.dateMax],
                  ['n',0,this.entityIdMax],
                  ['n',0,4],
                  ['n',0,1],
                  ['array',2,16,[
                    ['n',0,this.coordMax],
                    ['n',0,this.coordMax]]
              ]];
              if (!this.checkFormat(format, message, true))
                return false;
              return true;
            }
            else if (type === Types.Messages.CW_WHO)
            {
              console.info("type CW_WHO");
              var format = [['array',0,999,[
                  ['n',0,99999]]
              ]];
              if (!this.checkFormat(format, [message], true))
                return false;
            }*/
            else if (type === Types.Messages.CW_ITEMSLOT)
            {
              console.info("type CW_ITEMSLOT");
              var format = [
                ['n',0,3],
                ['n',0,2],
                ['n',-1,this.inventoryMax],
                ['n',0,this.itemCountMax]
              ];
              if (message.len === 7) {
                format = format.concat([
                  ['no',0,2],
                  ['no',-1,this.inventoryMax],
                  ['no',0,this.itemCountMax]]);
              }
              return this.checkFormat(format, message, true);
            }
            else
            {
                try{ throw new Error(); } catch (err) { console.info(err.stack); }
                console.error('Unknown message type: ' + type);
                console.warn("msg="+JSON.stringify(msg));
                return false;
            }
        },
    });

    var checker = new FormatChecker();

    exports.check = checker.check.bind(checker);
})();
