# Over Easy

<img src="./Over-Easy-logo.svg" width="160" height="160" alt="sharp logo" align="right">

A base project for static sites with templating and compression right out of the box.

---

## Features
* Use plain HTML or template with [Nunjucks](https://mozilla.github.io/nunjucks/)
* Style in CSS or[SASS](https://sass-lang.com)
* Generate image thumbnails
* Compress, resize, and convett images to jpeg and [webp](https://en.wikipedia.org/wiki/WebP)
* Optimize svg files
* Minify Javascipt, CSS, and HTML

All done automatically!

---

## Creating a Site

### Installation
This library uses [Node.js](https://nodejs.org/en/); if you don't have that, get it first!

Clone or download this repo, then run `npm install`.

### Customization
To make the website your own, you need to add content! Any files you want on the website should go in the [assets](assets) folder, and the built output will be put in the `public` folder ready to be hosted!

#### Adding HTML
HTML files are located in [assets/html/pages](assets/html/pages). All html files in this folder and any subfolders are run through the templating engine. The contents of this folder are copied to the top level of the `public/` output folder. That means that `assets/html/pages/index.html` is the default file for `yourwebsite.com` while `assets/html/pages/subdir/about.html` would be `yourwebsite.com/subdir/about.html`.

See the (Templating)[###Templating] section for more detailed information on using templating engine.

#### Adding CSS
Add any css, sass, or scss files in [assets/css](assets/css) or a subfolder thereof, then reference them in [assets/css/style.sass](assets/css/style.sass) with `@use`.

#### Adding Javascript
Add any Javascript files in [assets/js](assets/js) or a subfolder thereof, then reference them in [assets/js/main.js](assets/js/main.js) with `require`.

---

### Building
To compile the contents of the [assets](assets) folder, run `node build.js`.

---

### Hosting
Everything is now built in the `public` folder. To view the website locally, run

```sh
cd public/
npx http-server
```

Then go to http://localhost:8080 in your web browser.

---

### Custom Build Settings

Editing the [options.json](data/options.json) file will change what happens during the build process.

##### shrink_images
If `true` images that are too wide will be resized to be smaller. See the [Custom *Custom* Build Settings](###Custom-*Custom*-Build-Settings) section for details.

##### create_thumbnails
If `true` create smaller `jpg` versions of all image files. These files will have the same path and name, but with `_thumb.jpg` replacing the original file extension.

##### minify_html
If `true` minify html files.

##### minify_css
If `true` minify CSS.

##### minify_js
If `true` minify Javascript.

##### create_js_map
If `true` create a [source map](https://en.wikipedia.org/wiki/Minification_(programming)#Source_mapping) for the Javascript.

##### optimize_svg
If `true` run svg files through the [svgo](https://github.com/svg/svgo) optimizer.

---

### Custom *Custom* Build Settings
Editing the [compile.json](data/compile.json) file will change deails of certain steps during the build process.

##### images
* `quality` [1-100]: The quality of jpg to create when [optimize_images](####optimize_images) is `true`.
* `width` [1+]: The width to resize images to if they are over it when [shrink_images](####shrink_images) is `true`.
* `fit` [`cover`, `contain`, `fill`, `inside`, or `outside`]: The type of resizing to do when [shrink_images](####shrink_images) is `true`. Refer to the [sharp documentation](https://sharp.pixelplumbing.com/api-resize) for details.

##### thumbnails
* `quality` [1-100]: The quality of jpg thumbnails when [create_thumbnails](####create_thumbnails) is `true`.
* `width` [1+]: The width of thumbnails when [create_thumbnails](####create_thumbnails) is `true`.
* `fit` [`cover`, `contain`, `fill`, `inside`, or `outside`]: The type of resizing to do when [create_thumbnails](####create_thumbnails) is `true`. Refer to the [sharp documentation](https://sharp.pixelplumbing.com/api-resize) for details.

---

### Templating
The templating engine used is [nunjucks](https://mozilla.github.io/nunjucks), the documentation for which can be found [here](https://mozilla.github.io/nunjucks/templating.html). Html files that should not be compiled directly (such as partials) can go anywhere in [assets/html](assets/html) or subfolders thereof except the [assets/html/pages](assets/html/pages) folder.

#### Parameters
[data/website.json](data/website.json) contains the parameters passed into the templating engine. However, there are several reserved keywords that will be overwritten when building:
* `options`: The contents of (data/options.json)[data/options.json].
* `images`: A dictionary with keys being all paths under the (assets/img)[assets/img] folder, starting with 'img' and values being an array of all images under that path (without the filename extension).

#### Helper Partials
Several helper templates have been pre-defined to make life easier.

##### [img.html](assts/html/helpers/img.html)
Displays an image as `webp` with a `jpg` fallback. Inputs:
* `src`: The image path (excluding `img/`) without the filename extension.
* `alt`: Optional alternate text.

---

## Miscellaneous Tips
* When adding custom icons, consider using inline svgs from a site like [IconMonstr](https://iconmonstr.com) instead of adding an entire font face.

---

## Tools Used Internally
* [nunjucks](https://mozilla.github.io/nunjucks/) for HTML templating
* [dart-sass](https://github.com/sass/dart-sass) for compiling and minifying stylesheets
* [webpack](https://webpack.js.org) for bundling and minifying Javascript
* [sharp](https://sharp.pixelplumbing.com) for image conversion and resizing
* [svgo](https://github.com/svg/svgo) for svg optimization
* [node-minify](https://github.com/srod/node-minify) for minifying HTML

---

## Author
Check out my other work at [stuffjackmakes.com](https://stuffjackmakes.com)