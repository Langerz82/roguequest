define(['config'], function(config) {
  var StoreHandler = Class.extend({
    init: function(game,app) {
    	this.game = game;
    	this.app = app;
    	this.toggle = false;
    	var self = this;
    	$('#shopCloseButton').click(function(e){
          $('#shopDialog').hide();
          this.toggle = false;
    	});
      $('#shopDialog').hide();
    },

    show: function() {
      $('#shopDialog').show();
      $('#shopUsername').val(game.player.user.username);

    }

  });
  return StoreHandler;
});
