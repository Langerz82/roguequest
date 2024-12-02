define(['./dialog'], function(Dialog) {

    var ConfirmDialog = Dialog.extend({
        init: function() {
            this._super(game, '#dialogModalConfirm');
            this.setScale();

            this.modalParent = $('#dialogModal');
            this.modal = $('#dialogModalConfirm');

            this.modalConfirmMessage = $('#dialogModalConfirmMessage');
            this.modalConfirmButton1 = $('#dialogModalConfirmButton1');
            this.modalConfirmButton2 = $('#dialogModalConfirmButton2');

            this.confirmCallback = null;
            this.scale=this.setScale();

            var self = this;

            this.modalConfirmButton1.click(function(event) {
                self.hide();

                if(self.confirmCallback) {
                    self.confirmCallback(true);
                }
            });
            this.modalConfirmButton2.click(function(event) {
                self.hide();

                if(self.confirmCallback) {
                    self.confirmCallback(false);
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

        confirm: function(message, callback) {
            this.confirmCallback = callback;

            this.modalConfirmMessage.text(message);
            this.show();
        },
    });

    return ConfirmDialog;
});
