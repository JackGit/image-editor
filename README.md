# ImageEditor
ImageEditor is a jQuery plugin which can scale, rotate, move images, and merge images, based on HTML5 canvas.

### Usage
```js
var options = {
			imageUrls: [
				'../public/images/pic-2.jpg', // the most bottom image
				'../public/images/background-1.png' // the most top image
			],
			width: 240, // default value: 400 (px)
			height: 180, // default value: 400 (px)
			onAllImageLoaded: function() { // callback of all image loaded
			  this.selectImage(0);
			}
		},
    editor = $('#editor').ImageEditor(options); // init a DIV as ImageEditor
```

### Public methods
```js
editor.addImage(imageUrl); // add an image to the top
editor.selectImage(1); // select an image which index is 1. (Index of bottom is 0)
editor.setImage(imageUrl, index); // replace image to the target index
editor.rotateImage(30); // rotate image to 30 deg
editor.scaleImage(1.5, 1.5); // scale image width and height to 1.5 and 1.5
editor.mergeImage(); // merge all images together, returns a canvas DOM
```

### Demo
http://jackgit.github.io/ImageEditor/app/demo.html
