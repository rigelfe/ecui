/**
 * @file ecui builder
 * @author treelite(c.xinle@gmail.com)
 */


var path = require('path');
var fs = require('fs');

var sourceDir = path.resolve(__dirname, 'src');
var disDir = path.resolve(__dirname, 'dist');

var sourceFile = path.resolve(sourceDir, 'ecui.js');
var disFile = path.resolve(disDir, 'ecui.js');
var disFileMin = path.resolve(disDir, 'ecui.min.js');

var source = fs.readFileSync(sourceFile, 'UTF-8');

if (!fs.existsSync(disDir)) {
    fs.mkdirSync(disDir);
}

source = source.replace(/\/\/import ([^\r\n]+)/g, function ($0, $1) {
    var file = path.resolve(sourceDir, $1);
    if (fs.existsSync(file)) {
        console.log('combine ' + file + ' ...');
        file = fs.readFileSync(file, 'UTF-8');
    }
    else {
        file = '';
    }
    
    return file;
});

fs.writeFileSync(disFile, source, 'UTF-8');

console.log('minify...');
var UglifyJS = require("uglify-js")
var minSource = UglifyJS.minify(disFile);
fs.writeFileSync(disFileMin, minSource.code, 'UTF-8');

function cpFile(target, source) {
    var data = fs.readFileSync(source);
    fs.writeFileSync(target, data);
}

function cpDir(target, source) {
    var files = fs.readdirSync(source);

    files.forEach(function (file) {
        var stat = fs.statSync(path.resolve(source, file));

        if (stat.isDirectory()) {
            var n = path.resolve(target, file);
            fs.mkdirSync(n);
            cpDir(n, path.resolve(source, file));
        }
        else if (stat.isFile()) {
            cpFile(path.resolve(target, file), path.resolve(source, file));
        }
    });
}

// cp css
console.log('copy css ...');
cpDir(disDir, path.resolve(sourceDir, 'css'));
