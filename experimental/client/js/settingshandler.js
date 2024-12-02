define(['lib/localforage', 'lib/virtualjoystick'], function(localforage) {
  var SettingsHandler = Class.extend({
    init: function(game,app) {
    	this.game = game;
    	this.app = app;
    	this.toggle = false;
    	var self = this;

      var sound = localforage.getSetting

    	$('#settingsclose').click(function(e){
                self.show();
    	});

    	/*$('#buttonsound').click(function(e) {
    		if ($(this).hasClass('active')) {
    			$(this).html("Off");
    			$(this).removeClass('active');
          funcSound(false);
          localforage.setItem('sound', false);
    		}
    		else {
    			$(this).html("On");
    			$(this).addClass('active');
          funcSound(true);
          localforage.setItem('sound', true);
    		}
    	});*/

      this.funcSound = function (bSound)
      {
        if(self.game && self.game.audioManager) {
          self.game.audioManager.toggle(bSound);
        }
      };

      var buttonSound = $('#buttonsound');
      buttonSound.click(function(e) {
        if ($(this).hasClass('active')) {
          $(this).html("Off");
          $(this).removeClass('active');
          self.funcSound(false);
          localforage.setItem('sound', 0);
        }
        else {
          $(this).html("On");
          $(this).addClass('active');
          self.funcSound(true);
          localforage.setItem('sound', 1);
        }
      });


      var funcChat = function (bChat)
      {
        if(self.game) {
    			if(bChat) {
    				app.hideChatLog();
    			} else {
    				app.showChatLog();
    			}
        }
      };

      var buttonChat = $('#buttonchat');
      localforage.getItem('chat', function(e, val) {
        if (!val) {
          buttonChat.html("Off");
    			buttonChat.removeClass('active');
          funcChat(false);
        }
        else {
          buttonChat.html("On");
    			buttonChat.addClass('active');
          funcChat(true);
        }
      });

    	buttonChat.click(function(e) {
    		if ($(this).hasClass('active')) {
    			$(this).html("Off");
    			$(this).removeClass('active');
          funcChat(false);
          localforage.setItem('chat', false);
    		}
    		else {
    			$(this).html("On");
    			$(this).addClass('active');
          funcChat(true);
          localforage.setItem('chat', true);
    		}

      });


      var funcJoystick = function (bJoystick)
      {
        if(self.game) {
          if (bJoystick)
          {
              self.game.usejoystick = true;
              log.info("Loading Joystick");
              self.game.joystick = new VirtualJoystick({
              game            : self.game,
              container		: document.getElementById('canvas'),
              mouseSupport	: true,
              //stationaryBase  : true,
              //baseX : 50 * self.renderer.scale,
              //baseY : $('#container').height() - (60 * self.renderer.scale),

              //limitStickTravel: true,
              //stickRadius: 20 * self.renderer.scale,
              });
          }
          else
          {
            self.game.usejoystick = false;
            self.game.joystick = null;
            VirtualJoystick._touchIdx = null;
          }
        }
      };

      var buttonJoystick = $('#buttonjoystick');
      localforage.getItem('joystick', function(e, val) {
        if (!val) {
          buttonJoystick.html("Off");
    			buttonJoystick.removeClass('active');
          funcJoystick(false);
        }
        else {
          buttonJoystick.html("On");
    			buttonJoystick.addClass('active');
          funcJoystick(true);
        }
      });

    	buttonJoystick.click(function(e) {
    		if ($(this).hasClass('active')) {
    			$(this).html("Off");
    			$(this).removeClass('active');
          funcJoystick(false);
          localforage.setItem('joystick', false);
    		}
    		else {
    			$(this).html("On");
    			$(this).addClass('active');
          funcJoystick(true);
          localforage.setItem('joystick', true);
    		}
      });


      var buttonOptimized = $('#buttonoptimized');
      /*localforage.getItem('optimized', function(e, val) {
        if (!val) {
    			buttonOptimized.html("Off");
    			buttonOptimized.removeClass('active');
    		}
    		else {
    			buttonOptimized.html("On");
    			buttonOptimized.addClass('active');
    		}
        if (self.game) {
    			self.game.optimized = val;
        }
      });*/

    	buttonOptimized.click(function(e) {
    		if ($(this).hasClass('active')) {
    			$(this).html("Off");
    			$(this).removeClass('active');
    		}
    		else {
    			$(this).html("On");
    			$(this).addClass('active');
    		}
        if (self.game) {
    			self.game.optimized = !self.game.optimized;
        }
        localforage.setItem('optimized', self.game.optimized);
      });

      var buttonGPU = $('#buttonGPU');
      if(self.game && self.game.renderer) {
        /*localforage.getItem('gpu', function(e, val) {
          self.game.updateTick = val;
          if(val == 16) {
            buttonGPU.html("High");
            buttonGPU.addClass('active');
            funcGPU(16);
          }
          if(val == 32) {
            buttonGPU.html("Low");
            buttonGPU.removeClass('active');
            funcGPU(32);
          }
        });*/
      }

      var funcGPU = function (tick)
      {
        if(self.game) {
          //self.game.renderTick = 32;
          self.game.updateTick = tick;
          if (typeof(requestAnimFrame) === "undefined")
          {
            clearInterval(self.game.gameTick);
            self.game.gameTick = setInterval(self.game.tick, tick);
          }
        }
      };

      buttonGPU.click(function(e) {
        if ($(this).hasClass('active')) {
          localforage.setItem('gpu', 32);
    			$(this).html("Low");
    			$(this).removeClass('active');
          funcGPU(32);
    		}
    		else {
          localforage.setItem('gpu', 16);
    			$(this).html("High");
    			$(this).addClass('active');
          funcGPU(16);
    		}
      });

      var buttonMColor = $('#buttonmenucolor');
      localforage.getItem('menucolor', function(e, val) {
        if (!val)
          return;
        //$('div.frame-heading').css('background-color', val);
        //$('div.frame-content').css('background-color', val);
        //$('div.frame-panel').css('background-color', val);
        buttonMColor.val(val);
      });

      var buttonBColor = $('#buttonbuttoncolor');
      localforage.getItem('buttoncolor', function(e, val) {
        if (!val)
          return;
        $('div.frame-new-button').css('background-color', val);
        buttonBColor.val(val);
      });

    	buttonMColor.change(function(e) {
        localforage.setItem('menucolor', this.value);
        //$('div.frame-heading').css('background-color', this.value);
        //$('div.frame-content').css('background-color', this.value);
        //$('div.frame-panel').css('background-color', this.value);
      });
      $('#buttonbuttoncolor').change(function(e) {
        localforage.setItem('buttoncolor', this.value);
        $('div.frame-new-button').css('background-color', this.value);
      });

      // Hacky value settings but should work!
      this.changeZoom = function (defval, forceval) {
        if (!self.game)
          return;
        forceval = forceval || 0;
        if (forceval > 0)
          val = forceval;
        else
          val = self.zoomLevel || defval;
        self.game.ready = false;
        self.game.camera.rescale(val);
        self.game.renderer.rescaling = true;
        self.game.renderer.calcZoom();
        self.game.renderer.rescale();
        self.game.renderer.resizeCanvases();
        self.game.camera.setRealCoords();
        self.game.moveEntityThreshold = ~~(self.game.camera.gridW / 2) + 1;
        self.game.ready = true;
        self.game.renderer.forceRedraw = true;
        self.game.renderer.rescaling = false;
        $("#gamezoom option:selected").removeAttr("selected");
        $('#gamezoom option[value="'+val+'"]').attr("selected", true);
      }

      var selectZoom = $('.cgamezoom');
      if(self.game) {
        localforage.getItem('gamezoom', function(e, val) {
            self.zoomLevel = val;
        });
      }

    	selectZoom.change(function() {
    		var val = parseInt($('#gamezoom').val());
        localforage.setItem('gamezoom', val);
        //$("#gamezoom option:selected").prop("selected", false);
        //self.changeZoom(0, val);
    	});
    },

    apply: function () {
        var self = this;

        var buttonSound = $('#buttonsound');
        localforage.getItem('sound', function(e, val) {
          if (val == 0) {
            buttonSound.html("Off");
            buttonSound.removeClass('active');
            self.funcSound(false);
          }
          else {
            buttonSound.html("On");
            buttonSound.addClass('active');
            self.funcSound(true);
          }
        });


    },

    show: function() {
    	var self = this;
        this.toggle = !this.toggle;
    	if (this.toggle)
    	{
            $('#settings').css('display', 'block');
        }
        else
        {
            $('#settings').css('display', 'none');
        }
    }

  });
  return SettingsHandler;
});
