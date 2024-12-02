define([], function() {
    var ClassPopupMenu = Class.extend({
        init: function(){
            var self = this;

            $('#classSwitcherButton').click(function(event){
                game.player.skillHandler.hideShortcuts();
                game.statDialog.page.clear();
                game.client.sendClassSwitch($('#selectClassSwitch').val());
                self.close();
                self.show = false;
            });
        },

        close: function(){
            $('#classSwitcher').css('display', 'none');
        },
        open: function(){
            $('#classSwitcher').css('display', 'block');
        },
    });

    return ClassPopupMenu;
});
