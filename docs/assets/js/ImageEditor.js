/**
 * Image Editor as jQuery plugin
 * Dependency: hammer.js
 */
;(function($, window, Hammer) {

  $.fn.ImageEditor = function(options) {

    /* ImageEditor */
    function ImageEditor($el, options) {

      // default options of ImageEditor
      var defaults = {
        width: 400,
        height: 400,
        imageUrls: [], // element of array could be: 'images/url.jpg' or {url: 'images/url.jpg', closeButtonRequire: false, clickToSelect: true, onClick: function() {}}
        removeIcon: 'images/delete.png',
        removeIconSize: 30,
        addImageAnimation: true,
        removeImageAnimation: true,
        onImagesLoaded: function() {},
        onInitCompleted: function() {}
      };

      this.$el = $el;
      this.options = $.extend(defaults, options);

      this.inited = false;
      this.images = [];
      this.activeImage = null;

      this.startCenterPoint = {x: 0, y : 0};
      this.startPan = {x: 0, y : 0};
      this.startRotation = 0;
      this.startScale = 1;

      this.hammerManager = new Hammer.Manager($el[0]);

      this._init();
    }

    ImageEditor.prototype = {
      constructor: ImageEditor,

      // private methods
      _init: function() {
        // init container
        this.$el.css('position', 'relative');
        this.$el.css('height', this.options.height);
        this.$el.css('width', this.options.width);
        this.$el.css('overflow', 'hidden');

        // init hammer
        this.hammerManager.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
        this.hammerManager.add(new Hammer.Swipe()).recognizeWith(this.hammerManager.get('pan'));
        this.hammerManager.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(this.hammerManager.get('pan'));
        this.hammerManager.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([this.hammerManager.get('pan'), this.hammerManager.get('rotate')]);

        this.hammerManager.on("panstart panmove", this._onPan.bind(this));
        this.hammerManager.on("rotatestart rotatemove", this._onRotate.bind(this));
        this.hammerManager.on("pinchstart pinchmove", this._onPinch.bind(this));

        // load images
        this._loadImage(this.options.imageUrls);
      },

      _loadImage: function(urls) {
        var that = this;

        if(!(urls instanceof Array))
          urls = [urls];

        urls.forEach(function(url) {
          that.addImage(url);
        });
      },

      _placeImage: function(image) {
        var img = image.img,
            index = image.order;

        var $img = $(img),
            $imgWrapper = image.$imgWrapper,
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
          left = (containerWidth - newWidth) / 2;
        else
          top = (containerHeight - newHeight) / 2;

        $imgWrapper.css('left', left);
        $imgWrapper.css('top', top);
        $imgWrapper.css('box-sizing', 'border-box');

        // store display image width and height
        image.width = newWidth;
        image.height = newHeight;

        // set center point
        image.centerPoint = {x: left + newWidth / 2, y: top + newHeight / 2};

        // resize image
        $img.css('width', newWidth);
        $img.css('height', newHeight);

        // set image style
        $imgWrapper.css('position', 'absolute');
        $imgWrapper.css('z-index', 5 + index);

        // set click to select
        // there is conflict between jquery click event and hammer.js in iphone or samsung
        // so use 'tap' of hammer instead of jquery click event
        new Hammer($imgWrapper[0]).on('tap', function() {
          if(image.clickToSelect)
            this.selectImage(image);

          image.onClick && image.onClick();
        }.bind(this));


        // mask for selected image
        var $mask = $('<span>')
            .css('position', 'absolute')
            .css('top', 0)
            .css('bottom', 0)
            .css('left', 0)
            .css('right', 0)
            .css('z-index', 9)
            .css('background', 'rgba(0,0,0,0)');

        $imgWrapper.append($mask);
        image.$mask = $mask;

        // close button
        var $removeIcon = $('<img>')
            .css('position', 'absolute')
            .css('top', 0)
            .css('right', 0)
            .css('width', this.options.removeIconSize)
            .css('z-index', 10)
            .attr('src', this.options.removeIcon);

        if(image.closeButtonRequire) {
          new Hammer($removeIcon[0]).on('tap', function(e) {
            this.removeImage(image);
          }.bind(this));

          $imgWrapper.append($removeIcon);
        }

        image.$removeIcon = $removeIcon;

        // append img wrapper
        this.$el.append($imgWrapper);

        if(this.options.addImageAnimation) {
          // add image fade in animation
          $imgWrapper.css('display', 'none');
          $imgWrapper.fadeIn('fast');
        }
      },

      _updateImageTransform: function(image) {
        var transform = image.transform,
            imgWrapper = image.$imgWrapper[0],
            removeIcon = image.$removeIcon[0],
            value = [
              'translate(' + transform.translate.x + 'px, ' + transform.translate.y + 'px)',
              'scale(' + transform.scale + ', ' + transform.scale + ')',
              'rotate('+ transform.rotation + 'deg)'
            ].join(''),
            removeIconValue = 'scale(' + 1 / transform.scale + ', ' + 1 / transform.scale + ')';

        imgWrapper.style.webkitTransform = value;
        imgWrapper.style.mozTransform = value;
        imgWrapper.style.transform = value;

        // keep remove icon not scaled
        removeIcon.style.webkitTransform = removeIconValue;
        removeIcon.style.mozTransform = removeIconValue;
        removeIcon.style.transform = removeIconValue;
      },

      _onPan: function(e) {
        var image = this.activeImage;

        if(e.type == 'panstart') {
          this.startPan = {
            x: image.transform.translate.x,
            y: image.transform.translate.y
          };

          this.startCenterPoint = {
            x: image.centerPoint.x,
            y: image.centerPoint.y
          };
        }

        image.transform.translate = {
          x: this.startPan.x + e.deltaX,
          y: this.startPan.y + e.deltaY
        };

        image.centerPoint = {
          x: this.startCenterPoint.x + e.deltaX,
          y: this.startCenterPoint.y + e.deltaY
        };

        this._updateImageTransform(image);
        e.preventDefault();
      },

      _onRotate: function(e) {
        var image = this.activeImage;

        if(e.type == 'rotatestart')
          this.startRotation = image.transform.rotation;

        image.transform.rotation = this.startRotation + e.rotation;

        this._updateImageTransform(image);
        e.preventDefault();
      },

      _onPinch: function(e) {
        var image = this.activeImage, scale;

        if(e.type == 'pinchstart')
          this.startScale = image.transform.scale;

        scale = this.startScale * e.scale;

        // set restriction of scale: 0.2 ~ 5
        if(scale < 0.2)
          image.transform.scale = 0.2;
        else if(scale > 5)
          image.transform.scale = 5;
        else
          image.transform.scale = scale;

        this._updateImageTransform(image);
        e.preventDefault();
      },

      _drawImage: function(image, ctx) {
        var transform = image.transform;

        ctx.save();

        // perform rotate
        ctx.translate(image.centerPoint.x, image.centerPoint.y);
        ctx.rotate(transform.rotation * Math.PI / 180);
        ctx.translate(-image.centerPoint.x, -image.centerPoint.y);

        // perform scale
        ctx.scale(transform.scale, transform.scale);

        ctx.drawImage(image.img,
            (image.centerPoint.x - image.width * transform.scale / 2) / transform.scale,
            (image.centerPoint.y - image.height * transform.scale / 2) / transform.scale,
            image.width,
            image.height
        );

        ctx.restore();
      },

      _preProcessImageUrl: function(url) {
        var defaultObj = {
          url: '',
          closeButtonRequire: true,
          clickToSelect: true,
          onClick: null
        };

        if(typeof url == 'string') {
          defaultObj.url = url;
        } else if(typeof url == 'object') {
          defaultObj = $.extend(defaultObj, url);
        }

        console.log('pre process', defaultObj);
        return defaultObj;
      },

      // public methods
      moveImage: function(deltaX, deltaY) {
        var image = this.activeImage;
        image.transform.translate = {
          x: image.transform.translate.x + deltaX,
          y: image.transform.translate.y + deltaY
        };

        image.centerPoint = {
          x: image.centerPoint.x + deltaX,
          y: image.centerPoint.y + deltaY
        };

        this._updateImageTransform(image);
      },

      rotateImage: function(deg) {
        var image = this.activeImage;
        image.transform.rotation = this.startRotation + deg * 1;
        this._updateImageTransform(image);
      },

      scaleImage: function(scale) {
        var image = this.activeImage;
        image.transform.scale = scale;
        this._updateImageTransform(image);
      },

      addImage: function(url, select) {
        url = this._preProcessImageUrl(url);
        if(select === undefined)
          select = true;

        var $img = $('<img />'),
            that = this,
            image = {
              id: new Date() * 1,
              url: url.url,
              closeButtonRequire: url.closeButtonRequire,
              clickToSelect: url.clickToSelect,
              onClick: url.onClick,
              img: null,
              $imgWrapper: null,
              $removeIcon: null,
              order: this.images.length + 1, // starts from 1
              height: 0, // origin height once placed into the container
              width: 0, // origin width once placed into the container
              centerPoint: {x: 0, y: 0},
              transform: {
                translate: {x: 0, y: 0},
                rotation: 0,
                scale: 1
              }
            };

        this.images.push(image);

        $img.on('load', function() {
          image.$imgWrapper = $('<span>').append($(this));
          image.img = this;
          that._placeImage(image);

          var loaded = 0;
          that.images.forEach(function(im) {
            if(im.img)
              loaded ++;
          });

          if(loaded == that.images.length) { // all images loaded
            if(!that.inited) {
              that.inited = true;
              that.options.onInitCompleted && that.options.onInitCompleted();
            } else {
              select && that.selectImage(that.images.length - 1); // select the top image
            }

            that.options.onImagesLoaded && that.options.onImagesLoaded();
          }
        });

        $img.attr('src', url.url);
      },

      setImage: function(url, index, select) {
        if(index > this.images.length - 1)
          // throw new Error('index out of range');
          return;

        url = this._preProcessImageUrl(url);

        var image = this.images[index],
            $img = $('<img>'),
            that = this;

        $img.on('load', function() {
          image.$imgWrapper.remove();

          image = {
            id: new Date() * 1,
            url: url.url,
            closeButtonRequire: url.closeButtonRequire,
            clickToSelect: url.clickToSelect,
            onClick: url.onClick,
            img: this,
            $imgWrapper: null,
            $removeIcon: null,
            order: index + 1, // starts from 1
            height: 0, // origin height once placed into the container
            width: 0, // origin width once placed into the container
            centerPoint: {x: 0, y: 0},
            transform: {
              translate: {x: 0, y: 0},
              rotation: 0,
              scale: 1
            }
          };

          image.$imgWrapper = $('<span>').append($(this));
          that.images[index] = image;
          that._placeImage(image);

          select && that.selectImage(index);
        });

        $img.attr('src', url.url);
      },

      removeImage: function(index) {
        var targetImage;

        if(typeof index == 'object') {
          targetImage = this.images.filter(function(image) {
            return image.id == index.id;
          })[0];

          if(targetImage)
            index = targetImage.order - 1;
          else
            // throw new Error('cannot remove an image that not exists');
            return;
        }

        this.images = this.images.filter(function(image, i) {
          var keep = true;

          if(index == i) {
            keep = false;
            if(this.options.removeImageAnimation)
              image.$imgWrapper.fadeOut('fast', function() {
                image.$imgWrapper.remove();
              });
            else
              image.$imgWrapper.remove();
          }

          if(i > index)
            image.order --;

          return keep;
        }.bind(this));
      },

      removeAll: function() {
        for(var i = this.images.length - 1; i >= 0; i --)
          this.removeImage(i)
      },

      reset: function() {
        this.removeAll();
        this.options.imageUrls.forEach(function(url) {
          this.addImage(url, false);
        }.bind(this));
      },

      selectImage: function(index) {
        var targetImage;

        if(typeof index == 'object') {
          targetImage = this.images.filter(function(image) {
            return image.id == index.id;
          })[0];

          if(targetImage)
            index = targetImage.order - 1;
          else
            // throw new Error('cant select an image that not exists');
            return;
        }

        this.activeImage = this.images[index];

        this.images.forEach(function(image, i) {
          if(index == i)
            image.$mask.css('background', 'rgba(0,0,0,0.3)')
          else
            image.$mask.css('background', 'rgba(0,0,0,0)')
        });
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

        return cvs;
      }

    };

    return new ImageEditor(this, options);
  }

})(jQuery, window, Hammer);