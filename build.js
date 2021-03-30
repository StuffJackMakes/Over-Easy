// ===== Generally-Used Libraries =====
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const compileParams = require("./data/compile.json");
const options = require("./data/options.json");
let websiteParams = require("./data/website.json");


// ===== Generally-Used Variables =====
const INPUT_FOLDER = "assets";
const OUTPUT_FOLDER = "public";



// ===== Run Everything =====
async function Build() {
	let err;
	try {
		CleanOutputDirectory();
		CreateOutputDirectory();
		await PopulateParameters();
		await CompileSass();
		err = await BundleJs();
		if (err) throw err;
		await ReformatImages();
		await OptimizeSvg();
		await CompileHtml();
	} catch (err) {
		console.error("Encountered an error:", err);
	}
}
Build();



// ===== Handle An Error =====
function Error() {
	console.error("Encountered an error:", err);
	process.exit(1);
}

// ===== Write Data To A File =====
function WriteToFile(filename, data) {
	fs.writeFile(filename, data, (err) => {
		if (err) throw err;
	});
}



// ===== Clean Up Output Directory =====
function CleanOutputDirectory() {
	console.log("Cleaning up output folder...");
	if (fs.existsSync(OUTPUT_FOLDER)) {
		fs.rmdirSync(OUTPUT_FOLDER, { recursive: true });
	}
}



// ===== Create Output Directory Structure =====
function CreateOutputDirectory() {
	console.info("Creating output folder...");

	const STYLE_FOLDER = path.join(OUTPUT_FOLDER, "css");
	const JAVASCRIPT_FOLDER = path.join(OUTPUT_FOLDER, "js");
	const IMAGE_SOURCE = path.join(INPUT_FOLDER, "img");
	const IMAGE_DESTINATION = path.join(OUTPUT_FOLDER, "img");
	const HTML_SOURCE = path.join(INPUT_FOLDER, "html", "pages");

	fs.mkdirSync(STYLE_FOLDER, {recursive: true });
	fs.mkdirSync(JAVASCRIPT_FOLDER, {recursive: true });
	DuplicateDirectoryStructure(IMAGE_SOURCE, IMAGE_DESTINATION);
	DuplicateDirectoryStructure(HTML_SOURCE, OUTPUT_FOLDER);
}
function DuplicateDirectoryStructure(source, destination) {
	let remainingPaths = [source];
	while (remainingPaths.length > 0) {
		let folder = remainingPaths.pop();
		Array.prototype.push.apply(remainingPaths, GetFoldersInPath(folder));
		folder = folder.replace(source, "");
		folder = path.join(destination, folder);
		fs.mkdirSync(folder, { recursive: true });
	}
}
function GetFoldersInPath(directory) {
	let folders = [];
	let files = fs.readdirSync(directory);
	files.forEach(file => {
		if (fs.lstatSync(path.resolve(directory, file)).isDirectory()) {
			folders.push(path.join(directory, file));
		}
	});
	return folders;
}



// ===== Compile SASS =====
async function CompileSass() {
	console.info("Compiling SASS...");

	const sass = require("sass");
	const STYLE_INPUT = path.join(INPUT_FOLDER, "css", "style.sass");
	const STYLE_OUTPUT = path.join(OUTPUT_FOLDER, "css", "style.css");

	sass.render({
		file: STYLE_INPUT,
		outputStyle: options.minify_css ? "compressed" : "expanded"
	}, (err, result) => {
		if (err) throw err;
		WriteToFile(STYLE_OUTPUT, result.css);
	});
}



// ===== Bundle Javscript =====
async function BundleJs() {
	console.info("Bundling Javascript...");

	const webpack = require("webpack");
	const JS_INPUT = path.resolve(__dirname, INPUT_FOLDER, "js", "main.js");
	const JS_OUTPUT = path.resolve(__dirname, OUTPUT_FOLDER, "js");

	let options = {
		entry: JS_INPUT,
		output: {
			path: JS_OUTPUT,
			filename: "bundle.js"
		},
		mode: "development"
	};

	if (options.minify_js) options.mode = "production";
	if (options.create_js_map) options.devtool = "source-map";

	webpack(options, (err, stats) => {
		if (err) {
			if (err.details) console.error(err.details);
			console.error(err.stack || err)
			return "Webpack fatal error";
		}

		const info = stats.toJson();
		if (stats.hasErrors()) {
			for (error of info.errors) {
				console.error(error.message);
			}
			return "Webpack compilation error";
		}

		if (stats.hasWarnings()) console.warn(info.warnings);
	});
}



// ===== Reformat and Resize Images =====
async function ReformatImages() {
	console.log("Reformatting images...");

	const sharp = require("sharp");
	const IMAGE_INPUT_GLOB = path.join(INPUT_FOLDER, "img", "**", "*.+(jpg|jpeg|png|gif|tif|tiff)");
	const IMAGE_OUTPUT = path.join(OUTPUT_FOLDER, "img");

	glob(IMAGE_INPUT_GLOB, {}, (err, files) => {
		if (err) throw err;

		let outFile,
			outWebP,
			outThumb,
			outThumbWebP;

		files.forEach(file => {
			outFile = path.join(OUTPUT_FOLDER, file.substring(INPUT_FOLDER.length));
			if (file.indexOf("favicon.png") != -1) {
				fs.copyFileSync(file, outFile);
				return;
			}

			if (options.create_thumbnails) {
				if (!compileParams.thumbnails.width || !compileParams.thumbnails.quality) {
					throw "If the compile parameter 'thumbnails'  in 'data/compile.json' is set,"
						+ " it must be an object with 'width' and 'quality' properties."
				}
				outThumb = outFile.substring(0, outFile.lastIndexOf(".")) + "_thumb.jpg";
				outThumb = outFile.substring(0, outFile.lastIndexOf(".")) + "_thumb.webp";
				sharp(file)
					.resize({
						width: compileParams.thumbnails.width,
						fit: compileParams.thumbnails.fit
					})
					.toFormat("jpg", { quality: compileParams.thumbnails.quality })
					.toFile(outThumb);
				sharp(file)
					.resize({
						width: compileParams.thumbnails.width,
						fit: compileParams.thumbnails.fit
					})
					.webp({ quality: compileParams.thumbnails.quality })
					.toFile(outWebp);
			}

			outWebP	= outFile.substring(0, outFile.lastIndexOf(".")) + ".webp";
			outFile = outFile.substring(0, outFile.lastIndexOf(".")) + ".jpg";

			if (options.shrink_images) {
				sharp(file)
					.withoutEnlargement()
					.resize({
						width: compileParams.images.width,
						fit: compileParams.images.fit
					})
					.toFormat("jpg", { quality: compileParams.images.quality })
					.toFile(outFile);

				sharp(file)
					.withoutEnlargement()
					.resize({
						width: compileParams.images.width,
						fit: compileParams.images.fit
					})
					.webp({ quality: compileParams.images.quality })
					.toFile(outWebP);
			} else {
				sharp(file)
					.toFormat("jpg", { quality: compileParams.images.quality })
					.toFile(outFile);

				sharp(file)
					.webp({ quality: compileParams.images.quality })
					.toFile(outWebP);
			}
		});
	});
}



// ===== Optimize Svg Files =====
async function OptimizeSvg() {
	console.log("Optimizing svg files...");

	const { optimize } = require("svgo");
	const SVG_INPUT_GLOB = path.join(INPUT_FOLDER, "img", "**", "*.svg");
	const SVG_OUTPUT = path.join(OUTPUT_FOLDER, "img");

	glob(SVG_INPUT_GLOB, {}, (err, files) => {
		if (err) throw err;

		let fileData,
			result,
			outFile;

		files.forEach(file => {
			if (options.optimize_svg) {
				outFile = path.join(OUTPUT_FOLDER, file.substring(INPUT_FOLDER.length));
				fileData = fs.readFileSync(file);
				result = optimize(fileData, { path: file });
				WriteToFile(outFile, result.data);
			} else {
				fs.copyFileSync(file, outFile);
			}
		});
	});
}



// ===== Populate Website Parameters =====
async function PopulateParameters() {
	console.log("Populating Parameters...")

	const IMAGE_SOURCE = path.join(INPUT_FOLDER, "img");

	websiteParams.options = options;

	websiteParams.images = {};

	let remainingFolders = [IMAGE_SOURCE];
	let folder,
		trimmedFolder;
	while (remainingFolders.length > 0) {
		folder = remainingFolders.pop();
		trimmedFolder = folder.substring(folder.indexOf("img"));
		websiteParams.images[trimmedFolder] = [];
		for (let img of GetFilesInPath(folder)) {
			websiteParams.images[trimmedFolder].push(path.join(trimmedFolder, img));
		}
		Array.prototype.push.apply(remainingFolders, GetFoldersInPath(folder));
	}
}
function GetFilesInPath(directory) {
	let allFiles = [];
	let files = fs.readdirSync(directory);
	files.forEach(file => {
		if (!fs.lstatSync(path.resolve(directory, file)).isDirectory() && file.indexOf(".") !== 0) {
			allFiles.push(file);
		}
	});
	return allFiles;
}



// ===== Compile HTML =====
async function CompileHtml() {
	console.log("Compiling HTML...");

	const nunjucks = require("nunjucks");
	const minify = require("@node-minify/core");
	const htmlMinifier = require("@node-minify/html-minifier");
	const HTML_FOLDER = path.join(INPUT_FOLDER, "html", "pages");
	const HTML_TEMPLATES = path.join(HTML_FOLDER, "**", "*.+(ejs|html)");

	let env = nunjucks.configure();
	env.addFilter("stripExtension", (str) => {
		return str.substring(0, str.lastIndexOf("."));
	});

	glob(HTML_TEMPLATES, {}, (err, files) => {
		if (err) throw err;

		let fileData,
			htmlData,
			outFile;

		files.forEach(file => {
			htmlData = nunjucks.render(file, websiteParams);
			outFile = path.join(OUTPUT_FOLDER, file.replace(HTML_FOLDER, ""));
		
			if (options.minify_html) {
				minify({
					compressor: htmlMinifier,
					content: htmlData
				}).then((minHtml) => {
					WriteToFile(outFile, minHtml);
				});
			} else {
				WriteToFile(outFile, htmlData);
			}
		});
	});
}
