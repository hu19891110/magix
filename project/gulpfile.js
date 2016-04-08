var wrapTMPL = 'define("${moduleId}",[${requires}],function(require){\r\n/*${vars}*/\r\n${content}\r\n});';
var wrapNoDepsTMPL = 'define("${moduleId}",function(){\r\n${content}\r\n});';
var wrapNoExports = 'seajs.use([${requires}],function(${vars}){${content}});';

var tmplFolder = 'tmpl'; //template folder
var srcFolder = 'src'; //source folder
var buildFolder = 'build'; //build folder
var excludeTmplFolders = [
    'tmpl/libs/'
];
var onlyAllows = {
    '.html': 1,
    '.css': 1,
    '.json': 1
};


var gulp = require('gulp');
var path = require('path');
var watch = require('gulp-watch');
var nano = require('cssnano');
var fs = require('fs');
var buildTool = require('../src/build');

var sep = path.sep;
var sepReg = sep.replace(/\\/g, '\\\\');

tmplFolder = path.resolve(tmplFolder);
srcFolder = path.resolve(srcFolder);

buildFolder = path.resolve(buildFolder);

var tmplFolderName = path.basename(tmplFolder);
var srcFolderName = path.basename(srcFolder);
var buildFolderName = path.basename(buildFolder);
var moduleIdRemovedPath = path.resolve(tmplFolder);
buildTool.config({
    nano: nano,
    excludeTmplFolders: excludeTmplFolders,
    onlyAllows: onlyAllows,
    moduleIdRemoved: moduleIdRemovedPath,
    prefix: 'mp-',
    tmplCommand: /<%[\s\S]+?%>|<%=[\s\S]+?%>|$/g,
    atAttrIf: function(name, tmpl) {
        var cond = tmpl.replace(/<%=([\s\S]+?)%>/g, '$1');
        return '<%if(' + cond + '){%>' + name + '<%}%>';
    },
    generateJSFile: function(o) {
        var tmpl = o.requires.length ? wrapTMPL : wrapNoDepsTMPL;
        // if (!o.hasExports) {
        //     tmpl = wrapNoExports;
        // }
        for (var p in o) {
            var reg = new RegExp('\\$\\{' + p + '\\}', 'g');
            tmpl = tmpl.replace(reg, (o[p] + '').replace(/\$/g, '$$$$'));
        }
        return tmpl;
    }
});

var tmplReg = new RegExp('(' + sepReg + '?)' + tmplFolderName + sepReg),
    srcHolder = '$1' + srcFolderName + sep,
    srcReg = new RegExp('(' + sepReg + '?)' + srcFolderName + sepReg),
    buildHolder = '$1' + buildFolderName + sep;
gulp.task('combine', function() {
    buildTool.walk(tmplFolder, function(filepath) {
        var from = filepath;
        var to = from.replace(tmplReg, srcHolder);
        buildTool.processFile(from, to);
    });
});
gulp.task('watch', ['combine'], function() {
    watch(tmplFolder + '/**/*', function(e) {
        console.log(e.path);
        if (fs.existsSync(e.path)) {
            buildTool.processFile(e.path, e.path.replace(tmplReg, srcHolder), true);
        } else {
            var file = e.path.replace(tmplReg, srcHolder);
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
            buildTool.removeFile(file);
        }
    });
});

var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
gulp.task('build', function() {
    buildTool.walk(srcFolder, function(p) {
        buildTool.copyFile(p, p.replace(srcReg, buildHolder));
    });
    gulp.src(buildFolder + '/**/*.js')
        .pipe(uglify({
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }))
        .pipe(gulp.dest(buildFolder));

    gulp.src(buildFolder + '/**/*.css')
        .pipe(cssnano())
        .pipe(gulp.dest(buildFolder));
});