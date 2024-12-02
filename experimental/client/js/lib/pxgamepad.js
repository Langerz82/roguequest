(function() {
    //var jQuery = $;

    function PxGamepad() {

        // map button indices to names
        this.buttonNames = [
            'a',
            'b',
            'x',
            'y',
            'leftTop',
            'rightTop',
            'leftTrigger',
            'rightTrigger',
            'select',
            'start',
            'leftStick',
            'rightStick',
            'dpadUp',
            'dpadDown',
            'dpadLeft',
            'dpadRight'
        ];

        // callbacks for buton up listeners
        this.callbacksOn = {};
        this.callbacksOff = {};

        // some browsers use an event to provide the gamepad when connected
        this.connectedGamepad = null;

        this.reset();
    }

    // reset button and stick state
    PxGamepad.prototype.reset = function() {
        this.leftStick = { x: 0, y: 0 };
        this.rightStick = { x: 0, y: 0 };
        this.dpad = { x: 0, y: 0 };
        this.buttons = {};
        this.usbNES = false;
    };

    // start listening for gamepad connection events
    PxGamepad.prototype.start = function() {
        var self = this;

        this.reset();

        this.listeners = {
            'gamepadconnected': jQuery.proxy(function(e) {
                var gamepad = e.originalEvent.gamepad;
                if (gamepad.mapping === 'standard' || gamepad.id.indexOf('gamepad') > 0) {
                    this.connectedGamepad = gamepad;
                    if (gamepad.id.indexOf('gamepad') > 0)
                    {
                      self.usbSNES = true;

                      self.buttonNames = [
                          'y',
                          'b',
                          'a',
                          'x',
                          'leftTop',
                          'rightTop',
                          'none1',
                          'none2',
                          'select',
                          'start',
                      ];
                    }
                }
            }),
            'gamepaddisconnected': jQuery.proxy(function(e) {
                var gamepad = e.originalEvent.gamepad;
                if (this.connectedGamepad === gamepad) {
                    this.connectedGamepad = null;
                }
            })
        };

        jQuery(window).on(this.listeners);
    };

    // stop listening to gamepad connection events
    PxGamepad.prototype.stop = function() {
        jQuery(window).off(this.listeners);
        this.connectedGamepad = null;
    };

    // listen to button up events
    PxGamepad.prototype.buttonOn = function(buttonName, callback) {
        var buttonCallbacks = this.callbacksOn[buttonName];
        if (!buttonCallbacks) {
            this.callbacksOn[buttonName] = [ callback ];
        } else {
            buttonCallbacks.push(callback);
        }
    };

    PxGamepad.prototype.buttonOff = function(buttonName, callback) {
        var buttonCallbacks = this.callbacksOff[buttonName];
        if (!buttonCallbacks) {
            this.callbacksOff[buttonName] = [ callback ];
        } else {
            buttonCallbacks.push(callback);
        }
    };

    // remove button up event listeners
    PxGamepad.prototype.off = function(buttonName, callback) {
        var buttonCallbacksOn = this.callbacksOn[buttonName];
        var buttonCallbacksOff = this.callbacksOff[buttonName];
        if (buttonCallbacksOn || buttonCallbacksOff) {
            if (!callback) {
                // remove all callbacks
                this.callbacksOn = [];
                this.callbacksOff = [];
            } else {
                // search for specified callback
                var callbackIndex = buttonCallbacksOn.indexOf(callback);
                if (callbackIndex >= 0) {
                    buttonCallbacksOn.splice(callbackIndex, 1);
                }
                callbackIndex = buttonCallbacksOff.indexOf(callback);
                if (callbackIndex >= 0) {
                    buttonCallbacksOff.splice(callbackIndex, 1);
                }

            }
        }
    };

    function buttonPressed(gamepad, index) {

        if (!gamepad || !gamepad.buttons || index >= gamepad.buttons.length) {
            return false;
        }

        var b = gamepad.buttons[index];
        if (!b) {
            return false;
        }

        if (typeof(b) === "object") {
            return b.pressed;
        }

        return (b === 1.0);
    };

    // helper to retrieve the currently connected gamepad
    PxGamepad.prototype.getGamepad = function() {

        // default to connected gamepad
        var gp = this.connectedGamepad;
        if (gp) {
            return gp;
        }

        // fetch all available gamepads
        var gamepads;
        if (navigator.getGamepads) {
            gamepads = navigator.getGamepads();
        } else if (navigator.webkitGetGamepads) {
            gamepads = navigator.webkitGetGamepads();
        }

        // look for a standard mapped gamepad
        if (gamepads) {
            for (var i = 0, len = gamepads.length; i < len; i++) {
                gp = gamepads[i];
                if (gp && (gp.mapping === 'standard' || gp.id.indexOf('gamepad') > 0)) {
                    return gp;
                }
            }
        }

        return null;
    };

    // should be called during each frame update
    PxGamepad.prototype.update = function() {

        // make sure we have a gamepad
        var gp = this.getGamepad();
        if (!gp) {
            return;
        }

        /*if (this.usbSNES)
        {
          this.buttons.dpadRight = false;
          this.buttons.dpadLeft = false;
          this.buttons.dpadUp = false;
          this.buttons.dpadDown = false;

          if (gp.axes[0] == 1) {
            this.buttons.dpadRight = true;
          }
          if (gp.axes[0] == -1) {
            this.buttons.dpadLeft = true;
          }
          if (gp.axes[1] == 1) {
            this.buttons.dpadDown = true;
          }
          if (gp.axes[1] == -1) {
            this.buttons.dpadUp = true;
          }
        }*/

        // check state of each of the buttons
        var i, len, name, wasDown, isDown;
        for (i = 0, len = this.buttonNames.length; i < len; i++) {
            if (!gp || !gp.buttons || i >= gp.buttons.length) {
                continue;
            }

            name = this.buttonNames[i];
            wasDown = this.buttons[name];
            isDown = this.buttons[name] = buttonPressed(gp, i);

            if (!wasDown && isDown) {
                jQuery.each(this.callbacksOn[name] || [], function(i, callback) {
                    if (callback) { callback(); }
                });
            }
            if (wasDown && !isDown) {
                jQuery.each(this.callbacksOff[name] || [], function(i, callback) {
                    if (callback) { callback(); }
                });
                this.buttons[name] = false;
            }
        }

        // update the sticks
        this.leftStick.x = gp.axes[0];
        this.leftStick.y = gp.axes[1];
        this.rightStick.x = gp.axes[2];
        this.rightStick.y = gp.axes[3];

        // dpad isn't a true stick, infer from buttons
        this.dpad.x = (this.buttons.dpadLeft ? -1 : 0) + (this.buttons.dpadRight ? 1 : 0);
        this.dpad.y = (this.buttons.dpadUp ? -1 : 0) + (this.buttons.dpadDown ? 1 : 0);

    };

    window.PxGamepad = PxGamepad;

})();
