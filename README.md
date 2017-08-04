# ImageEditor
ImageEditor is a jQuery plugin which can scale, rotate, move images, and merge images, based on HTML5 canvas.
And now it supports multi touch in mobile phones, thanks to Hammer.js

### Usage
```js
var options = {
	imageUrls: [
		{url: 'assets/images/pic-2.jpg', closeButtonRequire: false},
		{url: 'assets/images/background-1.png', closeButtonRequire: false, clickToSelect: false, onClick: function() { editor.selectImage(0);}},
		'assets/images/mustache.png'
	],
	width: 300,
	height: 300,
	onInitCompleted: function() {
		editor.selectImage(0); // select most bottom image as current operating image
	}
},
editor = $('#editor').ImageEditor(options); // init a DIV as ImageEditor
```

### Public methods
```js
editor.moveImage(deltaX, deltaY); // move image to delta x, y
editor.rotateImage(90); // rotate image 90 deg
editor.scaleImage(1.5); // scale as 1.5 size (for both width and height)
editor.addImage(urlObj, true); // add image, and make it as current selected image for operation. structure of urlObj refers to options imageUrls array element
editor.setImage(urlObj, 1, false); // if index = 1 image exists, replace it, and not make replaced image as current selected image
editor.removeImage(2); // remove index = 2 image
editor.removeAll(); // remove all images
editor.reset(); // reset as initial status after ImageEditor created
editor.mergeImage(); // merge all images together, returns a canvas DOM
```

### Demo
http://jackgit.github.io/image-editor/index.html
