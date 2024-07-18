/* global Types, Class, _, questSerial */

define([], function() {

  var UserAlarm = Class.extend({
    init: function() {
      this.hideDelay = 5000; //How long the notification shows for.

      this.queue = [];
      this.jqAlarm = $('#useralarm');
      this.showing = false;
      this.disabled = false;
    },

    alarmQueue: function(str, delay) {
      var self = this;

      delay = delay || this.hideDelay;

      this.queue.push([str, delay]);

      if (!this.showing)
        this.showQueue();
    },

    hide: function () {
      this.jqAlarm.hide();
      this.disabled = true;
    },

    show: function () {
      this.disabled = false;

      if (!this.showing)
        this.showQueue();
    },

    showQueue: function () {
      var self = this;

      if (this.disabled) {
        setTimeout(function() {
          self.showQueue();
        }, 1000);
        return;
      }

      if (this.queue.length > 0) {
        this.showing = true;
        var msg = this.queue.pop();
        this.jqAlarm.html(msg[0]);
        this.jqAlarm.fadeIn();
        setTimeout(function() {
          self.jqAlarm.fadeOut(1500, function () {
            self.showQueue();
          });
        }, msg[1]);
      }
      else {
        this.showing = false;
      }
    },

    alarm: function(str, delay) {
      this.alarmQueue(str, delay);
    },
  });
  return UserAlarm;
});
