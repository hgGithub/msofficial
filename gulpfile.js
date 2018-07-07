var gulp = require('gulp');
var livereload = require('gulp-livereload'), // 网页自动刷新（文件变动后即时刷新页面）
	webserver = require('gulp-webserver'), // 本地服务器
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	pump = require('pump'),
	babel = require('gulp-babel'),
	sass = require('gulp-sass'),
	postcss = require('gulp-postcss'),
	cssnano = require('cssnano'),
	autofixer = require('autoprefixer'),
	imagemin = require('gulp-imagemin'),
	tiny = require('gulp-tinypng-nokey'),
	tinyPng = require('imagemin-pngquant'),
	clean = require('gulp-clean'),
	changed = require('gulp-changed'),
	sourcemaps = require('gulp-sourcemaps'),
	htmlmin = require('gulp-htmlmin'),
	gulpCopy = require('gulp-copy'),
	minifyCSS = require('gulp-clean-css'),
	runSequence  = require('run-sequence'),
	browserSync = require('browser-sync').create(),
	rev = require('gulp-rev'), // 缓存控制
	spritesmith = require('gulp.spritesmith'),
	revCollector = require('gulp-rev-collector'); // 缓存控制

/**************************开发配置*****************************/
// clean build folder.
gulp.task('cleanbuild', function (cb) {
	var stream = gulp.src('./build/', {read: false}).pipe(clean());

	console.log('build目录删除成功！');
	return stream;

});
// 雪碧图处理（待优化）
gulp.task('imgsprits', function (cb) {
  var stream = gulp.src('./src/static/pc/img/befsprites/*.png')
  		.pipe(spritesmith({
  			imgName: 'sprite.png',
  			cssName: '/static/pc/css/base/_sprite.scss',
  			padding: 5,
  			algorithm:'binary-tree'
  		}))
        .pipe(gulp.dest('./src/static/pc/img/global/'));

  console.log('雪碧图处理成功！');
  return stream;
});
// images 压缩处理.
gulp.task('imgtiny', function (cb) {
  var stream = gulp.src(['./src/static/pc/img/**/*.@(png|jpeg|gif|jpg)', '!./src/static/pc/img/befsprites/*'])
        .pipe(tiny())
        .pipe(gulp.dest('./build/static/pc/img/'));

  console.log('图片压缩成功！');
  return stream;

});
// 源文件scss处理
gulp.task('scsstocss', function () {
	var plugins  = [
		autofixer({browsers: ["last 2 versions", "> 1%", "iOS >= 7","Android >= 4.1", "not ie <= 8"]})
		];

	var stream = gulp.src('./src/static/pc/css/**/*.scss')
				.pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
				.pipe(postcss(plugins))
				.pipe(gulp.dest('./build/static/pc/css/'));

	console.log('自定义scss处理成功！');
	return stream;
});
// 源文件css copy到build目录
gulp.task('devcopycss', function () {
	var stream = gulp.src('./src/static/pc/css/**/*.css')
				.pipe(gulp.dest('./build/static/pc/css/'));

	console.log('源文件css拷贝完成');
	return stream;
});
// 源文件js复制处理,并处理自定义es6文件
gulp.task('devcopyjsfile', function () {
	var stream = gulp.src(['./src/static/pc/js/**/*.js', '!./src/static/pc/js/3rdlibs/**/*.js'])
				.babel()
				.pipe(gulp.dest('./build/static/pc/js/'));

	console.log('源文件js拷贝完成');
	return stream;
});
// 源第三方源文件(不进行es6处理)
gulp.task('devcopyjsfile', function () {
	var stream = gulp.src('./src/static/pc/js/3rdlibs/**/*.js')
				.pipe(gulp.dest('./build/static/pc/js/3rdlibs/'));

	console.log('源文件js拷贝完成');
	return stream;
});
// 源文件fonts复制处理处理
gulp.task('devcopyfonts', function () {
	var stream = gulp.src('./src/static/pc/fonts/**/*')
				.pipe(gulp.dest('./build/static/pc/fonts/'));

	console.log('源文件fonts拷贝完成');
	return stream;
});
// 源文件html copy到build目录
gulp.task('devcopyhtml', function () {
	var stream = gulp.src('./src/templates/pc/**/*.html')
				.pipe(gulp.dest('./build/templates/pc/'));

	console.log('源文件html拷贝完成');
	return stream;
});
// 开发环境启动服务
gulp.task('webserver', function() {
	gulp.src('./build/')
	.pipe(webserver({
	  	host: 'localhost',
	  	port: 8081,
	    livereload: true, // 启用LiveReload
	    open: true, // 服务器启动时自动打开网页
	    proxies: {}
	}))
});
// 监听有关文件改动
gulp.task('watch',function(){
  gulp.watch( './src/templates/pc/*.html', ['devcopyhtml']).on('change', browserSync.reload);
  gulp.watch('./src/static/pc/js/**/*.js', ['devcopyjsfile']).on('change', browserSync.reload);
  gulp.watch('./src/static/pc/css/**/*.scss', ['scsstocss']).on('change', browserSync.reload);
  gulp.watch('./src/static/pc/css/**/*.css', ['devcopycss']).on('change', browserSync.reload);
});

// 开发环境一键处理(如有特别需求，请具体任务执行)
gulp.task('dev', function (callback) {
	runSequence(['devcopyhtml', 'imgsprits','imgtiny','devcopyfonts', 'devcopycss', 'devcopyjsfile'], 'scsstocss', 'webserver', 'watch', callback);

	console.log('开发环境启动成功！');
}).on('task_err',function(err){
    console.log('开发环境启动失败：', err);
});

/**************************生产配置*****************************/
// 删除dist下重新复制
gulp.task('cleandist', function (cb) {
	var stream = gulp.src('./dist/static/pc/', {read: false})
	.pipe(clean({force: true}));
	console.log('dist文件夹删除成功！');
	return stream;
})
// css压缩md5处理
gulp.task('prodcssmd5', function () {
	var stream = gulp.src(['./build/static/pc/**/*.css'])
				.pipe(minifyCSS({
					compatibility: 'ie8',
					keepSpecialComments: '*'
				}))
				.pipe(rev())
				.pipe(gulp.dest('./dist/static/pc/'))
				.pipe(rev.manifest())
				.pipe(gulp.dest('./build/static/pc/css/rev/'));

	console.log('生产环境css md5处理完毕');
	return stream;
});
// 生产环境版本控制js,md5处理
// gulp.task('prodjsmd5', function () {
// 	var stream = gulp.src(['./build/static/**/flexiblefit.js'])
// 				.pipe(uglify())
// 				.pipe(rev())
// 				.pipe(gulp.dest('../resources/webpage/assets/'))
// 				.pipe(rev.manifest())
// 				.pipe(gulp.dest('./build/assets/js/rev/'));

// 	console.log('生产环境css md5处理完毕');
// 	return stream;
// });
// 第三方js，图片字体文件处理
gulp.task('prod3thjscopy', function () {
	var stream = gulp.src(['./build/static/pc/**/*.min.js', './build/static/pc/**/+(fonts|img)/*'])
				.pipe(gulp.dest('./dist/static/'));

	console.log('第三方已压缩js、图片、字体等文件复制处理');
	return stream;
});
// js第三方未压缩插件压缩处理(*.min.js文件除外)
gulp.task('prod3thcomcopy', function (cp) {
	pump([
		gulp.src(['./build/static/pc/js/3rdlibs/**/*.js', '!./build/static/pc/js/3rdlibs/**/*.min.js']),
		uglify(),
		gulp.dest('./dist/static/pc/js/3rdlibs/')
	], cp);
})
// 拷贝压缩处理js, 不包括第三方及需要版本控制的js ***
gulp.task('prodjscopy', function (cp) {
	pump([
		gulp.src(['./build/static/pc/**/*.js', '!./build/static/pc/js/3rdlibs/**/*.js']),
		babel(),
		uglify({
                mangle: { reserved: ['require', 'exports', 'module', '$'] },
                compress: true
            }),
		gulp.dest('./dist/static/pc/')
	], cp);
});
// 复制hml并替换css链接
gulp.task('htmlcopy', function () {
	// var hanlePages = ['./build/assets/+(css|js)/rev/*.json','./build/views/*.html', '!./build/views/(cusSearch-li|cusSearch|finaDiff|lfInfo|yiBeiInfo|yingBeiInfo).html'];
	var stream = gulp.src(['./build/static/pc/+(css|js)/rev/*.json','./build/templates/pc/**/*.html'])
				.pipe(revCollector({
					replaceReved: true
				}))
				.pipe(gulp.dest('./dist/templates/pc/'))

	console.log('html模板压缩及文件版本替换');
	return stream;
});
// 生产环境一键处理
gulp.task('prod', function (callback) {
	runSequence('cleandist','prodjscopy', 'prod3thcomcopy', 'prod3thjscopy',
		'prodcssmd5', 'htmlcopy')
});