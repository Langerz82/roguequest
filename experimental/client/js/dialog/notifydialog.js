define(['./dialog'], function(Dialog) {
    var NotifyDialog = Dialog.extend({
        init: function() {
            this._super(game, '#dialogModalNotify');
            this.setScale();

            this.modalParent = $('#dialogModal');
            this.modal = $('#dialogModalNotify');

            this.modalNotifyMessage = $('#dialogModalNotifyMessage');
            this.modalNotifyButton1 = $('#dialogModalNotifyButton1');

            this.notifyCallback = null;
            this.scale=this.setScale();

            var self = this;

            this.modalNotifyButton1.click(function(event) {
                self.hide();

                if(self.notifyCallback) {
                    self.notifyCallback();
                }
            });
        },

        setScale: function() {
          this.scale = game.renderer.getUiScaleFactor();
        },

        rescale: function() {
        	this.setScale();
        },

        show: function() {
            this.rescale();
            this.modalParent.css('display', 'block');
            this.modal.css('display', 'block');
            this._super();
        },

        hide: function() {
            this.modalParent.css('display', 'none');
            this.modal.css('display', 'none');
            this._super();
        },

        notify: function(message, callback) {
            this.notifyCallback = callback;

            this.modalNotifyMessage.text(message);
            this.show();
        },

    });

    return NotifyDialog;
});
