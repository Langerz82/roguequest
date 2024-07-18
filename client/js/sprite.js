
define(['animation'], function(Animation) {

    var Sprite = Class.extend({
        init: function(data, scale, container) {
            this.name = data.id;
            this.file = data.file;
            this.scale = scale;
            this.container = container;
            this.isLoaded = false;
            this.offsetX = 0;
            this.offsetY = 0;
            this.data = data;

            this.loadJSON(data);

            this.whiteSprite = {
                isLoaded: true,
            };
            this.silhouetteSprite = {
                isLoaded: true,
            };
            this.rsprite = null;
        },

        loadJSON: function(data) {
            this.id = data.id;

            if (this.file)
              this.filepath = "img/" + this.scale + "/sprites/" + this.file;
            else if (data.file)
              this.filepath = "img/" + this.scale + "/sprites/" + data.file;
            else
              this.filepath = "img/" + this.scale + "/sprites/" + this.id + ".png";

            this.animationData = data.animations;
            this.width = data.width;
            this.height = data.height;
            this.offsetX = (data.offset_x !== undefined) ? data.offset_x : -16;
            this.offsetY = (data.offset_y !== undefined) ? data.offset_y : -16;

            //this.load();
        },


        /*load: function(callback) {
            var self = this;

            self.isLoaded = true;

            if (callback)
              callback();
        },*/

        createAnimations: function() {
            this.animations = {};

            for(var name in this.animationData) {
                var a = this.animationData[name];
                if (!a.hasOwnProperty('col')) a.col = 0;
                this.animations[name] = new Animation(name, a.length, a.col, a.row, this.width, this.height);
            }

            return this.animations;
        },

        getAnimationByName: function(name) {
            var animation = null;

            if(name in this.animations) {
                animation = this.animations[name];
            }
            else {
                var e = new Error();
                log.error(e.stack);
                log.error("No animation called "+ name);
            }
            return animation;
        },

        setAnimation: function(name, speed, count, onEndCount) {
            var self = this;

            //if (!this.isLoaded) this.load();

            //if(this.isLoaded) {
                if(this.currentAnimation && this.currentAnimation.name === name) {
                    return;
                }

                var s = this.sprite,
                    a = this.getAnimationByName(name);

                if(a) {
                    this.currentAnimation = a;
                    this.currentAnimation.setSpeed(speed);
                    this.currentAnimation.setCount(count ? count : 0, onEndCount);
                }
            //}
            /*else {
                this.log_error("Not ready for animation");
            }*/
        },

        /*createHurtSprite: function() {
            //if(!this.isLoaded) this.load();
            if (this.whiteSprite.isLoaded) return;
            var canvas = document.createElement('canvas'),
                //ctx = canvas.getContext('2d'),
                width = this.width,
                height = this.height,
                spriteData, data;

            canvas.width = width;
            canvas.height = height;
            //ctx.drawImage(this.image, 0, 0, width, height);

            try {
                //spriteData = ctx.getImageData(0, 0, width, height);

                data = spriteData.data;

                for(var i=0; i < data.length; i += 4) {
                    data[i] = 255;
                    data[i+1] = data[i+2] = 75;
                }
                spriteData.data = data;

                //ctx.putImageData(spriteData, 0, 0);

                this.whiteSprite = {
                    image: canvas,
                    isLoaded: true,
                    offsetX: this.offsetX,
                    offsetY: this.offsetY,
                    width: this.width,
                    height: this.height
                };
            } catch(e) {
                log.error("Error getting image data for sprite : "+this.name);
            }
        },

        getHurtSprite: function() {
            //if (!this.isLoaded) this.load();
            this.createHurtSprite();
            return this.whiteSprite;
        }*/

        /*createSilhouette: function() {
            if(!this.isLoaded) this.load();
            if (this.silhouetteSprite.isLoaded) return;
            var canvas = document.createElement('canvas'),
                //ctx = canvas.getContext('2d'),
                width = this.width,
                height = this.height,
                spriteData, finalData, data;

            canvas.width = width;
            canvas.height = height;
            //ctx.drawImage(this.image, 0, 0, width, height);
            //data = ctx.getImageData(0, 0, width, height).data;
            //finalData = ctx.getImageData(0, 0, width, height);
            //fdata = finalData.data;

            var getIndex = function(x, y) {
                return ((width * (y-1)) + x - 1) * 4;
            };

            var getPosition = function(i) {
                var x, y;

                i = (i / 4) + 1;
                x = i % width;
                y = ((i - x) / width) + 1;

                return { x: x, y: y };
            };

            var hasAdjacentPixel = function(i) {
                var pos = getPosition(i);

                if(pos.x < width && !isBlankPixel(getIndex(pos.x + 1, pos.y))) {
                    return true;
                }
                if(pos.x > 1 && !isBlankPixel(getIndex(pos.x - 1, pos.y))) {
                    return true;
                }
                if(pos.y < height && !isBlankPixel(getIndex(pos.x, pos.y + 1))) {
                    return true;
                }
                if(pos.y > 1 && !isBlankPixel(getIndex(pos.x, pos.y - 1))) {
                    return true;
                }
                return false;
            };

            var isBlankPixel = function(i) {
                if(i < 0 || i >= data.length) {
                    return true;
                }
                return data[i] === 0 && data[i+1] === 0 && data[i+2] === 0 && data[i+3] === 0;
            };

            for(var i=0; i < data.length; i += 4) {
                if(isBlankPixel(i) && hasAdjacentPixel(i)) {
                    fdata[i] = fdata[i+1] = 255;
                    fdata[i+2] = 150;
                    fdata[i+3] = 150;
                }
            }

            //finalData.data = fdata;
            //ctx.putImageData(finalData, 0, 0);

            this.silhouetteSprite = {
                image: canvas,
                isLoaded: true,
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                width: this.width,
                height: this.height
            };
        }*/
    });
    return Sprite;
});
