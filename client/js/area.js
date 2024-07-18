
define(function() {

    var Area = Class.extend({
        init: function(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        },

        contains: function(entity) {
            //var ts = TILESIZE;
            if(entity) {
                return entity.gx >= this.x
                    && entity.gy >= this.y
                    && entity.gx < this.x + this.width
                    && entity.gy < this.y + this.height;
            } else {
                return false;
            }
        }
    });

    return Area;
});
