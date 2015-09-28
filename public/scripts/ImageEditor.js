/* 
  ImageEditor as jQuery plugin
*/  
;(function($, window) {

  $.fn.ImageEditor = function(options) {

    var hasTouch = 'ontouchstart' in window,
        startEvent = hasTouch ? 'touchstart' : 'mousedown',
        moveEvent = hasTouch ? 'touchmove' : 'mousemove',
        endEvent = hasTouch ? 'touchend' : 'mouseup',
        cancelEvent = hasTouch ? 'touchcancel' : 'mouseup';


    /* ImageEditor */
    function ImageEditor($el, options) {

      var defaults = {
        width: 400,
        height: 400,
        imageUrls: [],
        onAllImageLoaded: function() { }
      };

      this.$el = $el;
      this.options = $.extend(defaults, options);

      this.images = [];
      this.activeImage = null;
      this.operations = {};

      this._init();
    }

    ImageEditor.prototype = {
      constructor: ImageEditor,

      handleEvent: function(e) {
        switch(e.type) {
          case startEvent:
            this._start(e);
            break;
          case moveEvent:
            this._move(e)
            break;
          case endEvent:
          case cancelEvent:
            this._end(e);
            break;
          default:
            break;
        }
      },

      // private methods
      _init: function() {
        var that = this;

        // init container
        this.$el.css('position', 'relative');
        this.$el.css('height', this.options.height);
        this.$el.css('width', this.options.width);
        this.$el.css('overflow', 'hidden');

        // bind container event
        this.$el.on(startEvent, this._start.bind(this));
        this.$el.on(moveEvent, this._move.bind(this));
        this.$el.on(endEvent, this._end.bind(this));

        // load images
        this._loadImage(this.options.imageUrls);
      },

      _loadImage: function(urls) {
        var that = this;

        if(typeof urls == 'string')
          urls = [urls];

        urls.forEach(function(url) {
          that.addImage(url);
        });
      },

      _placeImage: function(image) {
        var img = image.img,
            index = image.order;

        var $img = $(img),
            containerWidth = this.options.width,
            containerHeight = this.options.height,
            naturalWidth = img.naturalWidth,
            naturalHeight = img.naturalHeight,
            ratio = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight),
            newWidth = naturalWidth * ratio,
            newHeight = naturalHeight * ratio,
            top = 0, left = 0;

        // center image in the editor
        if((containerWidth - newWidth) > (containerHeight - newHeight))
          $img.css('left', left = ((containerWidth - newWidth) / 2));
        else
          $img.css('top', top = ((containerHeight - newHeight) / 2));
          
        // store display image width and height
        image.width = newWidth;
        image.height = newHeight;

        // set center point
        image.centerPoint = {x: left + newWidth / 2, y: top + newHeight / 2};

        // resize image
        $img.css('width', newWidth);
        $img.css('height', newHeight);

        // set image style
        $img.css('position', 'absolute');
        $img.css('z-index', 5 + index);

        // append img
        this.$el.append($img);

      },

      _start: function(e) {
        this.readyToMove = true;
        this.startPoint = {x: e.pageX, y: e.pageY};
      },

      _move: function(e) {
        var image = null,
            $img = null,
            dx, dy,
            top, left;

        if(!this.readyToMove)
          return;

        image = this.activeImage;
        $img = $(image.img);

        dx = e.pageX - this.startPoint.x;
        dy = e.pageY - this.startPoint.y;

        top = image.centerPoint.y - image.height / 2 + dy;
        left = image.centerPoint.x - image.width / 2 + dx;

        $img.css('top', top + 'px');
        $img.css('left', left + 'px');

        e.preventDefault();
      },

      _end: function(e) {
        var image = null,
            $img = null,
            dx, dy;

        this.readyToMove = false;

        image = this.activeImage;
        $img = $(image.img);

        dx = e.pageX - this.startPoint.x;
        dy = e.pageY - this.startPoint.y;

        image.centerPoint.x += dx;
        image.centerPoint.y += dy;

      },

      _concatTransform: function(image) {
        var value = '';
        value += 'rotate(' + image.deg + 'deg) ';
        value += 'scale(' + image.scale.x + ', ' + image.scale.y + ') ';
        return value;
      },

      _drawImage: function(image, ctx) {
        ctx.save();
 
        // perform rotate
        ctx.translate(image.centerPoint.x, image.centerPoint.y);
        ctx.rotate(image.deg * Math.PI / 180);
        ctx.translate(-image.centerPoint.x, -image.centerPoint.y);

        // perform scale
        ctx.scale(image.scale.x, image.scale.y);

        ctx.drawImage(image.img, 
            (image.centerPoint.x - image.width * image.scale.x / 2) / image.scale.x,
            (image.centerPoint.y - image.height * image.scale.y / 2) / image.scale.y,
            image.width,
            image.height
        );

        ctx.restore();
      },

      // public methods
      moveImage: function(x, y) {

      },

      rotateImage: function(deg) {
        this.activeImage.deg = deg;
        $img = $(this.activeImage.img);
        $img.css('transform', this._concatTransform(this.activeImage));
      },

      scaleImage: function(x, y) {
        this.activeImage.scale = {x: x, y: y};
        $img = $(this.activeImage.img);
        $img.css('transform', this._concatTransform(this.activeImage));
      },

      addImage: function(url) {
        var $img = $('<img />'),
            that = this,
            image = {
              url: url,
              img: null,
              order: this.images.length + 1, // starts from 1
              top: 0,
              left: 0,
              height: 0, // origin height once placed into the container
              width: 0, // origin width once placed into the container
              centerPoint: {x: 0, y: 0},
              scale: {x: 1, y: 1},
              deg: 0,
            };

        this.images.push(image);

        $img.on('load', function() {
          image.img = this;
          that._placeImage(image);

          var loaded = 0;
          that.images.forEach(function(im) {
            if(im.img)
              loaded ++;
          });

          if(loaded == that.images.length) { // all images loaded
            that.selectImage(that.images.length - 1); // select the top image
            that.options.onAllImageLoaded && that.options.onAllImageLoaded.bind(that)();
          }
        });

        $img.attr('src', url);
      },

      setImage: function(url, index) {
       /* var image = this.images[index],
            $img = $(image.img);

        $img.attr('src', url + '?v=' + new Date().getTime());*/
      },

      removeImage: function(index) {
        // not implemented yet
      },

      removeAll: function() {
        // not implemented yet
      },

      reset: function() {
        // not implemented yet
      },

      selectImage: function(index) {
        this.activeImage = this.images[index];
      },

      mergeImage: function() {
        var cvs = document.createElement('canvas'),
            ctx = cvs.getContext('2d'),
            that = this;

        cvs.width = this.options.width;
        cvs.height = this.options.height;

        this.images.forEach(function(image) {
          that._drawImage(image, ctx);
        });

        // img.src = cvs.toDataURL();
        return cvs;
      }

    };
  

    return new ImageEditor(this, options);
  }

})(jQuery, window);