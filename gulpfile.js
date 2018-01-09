var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var nodemon = require('gulp-nodemon');
var bs = require('browser-sync').create();
//var cache = require('gulp-file-cache');

var sassPaths = [
  'bower_components/normalize.scss/sass',
  'bower_components/foundation-sites/scss',
  'bower_components/motion-ui/src'
];

gulp.task('sass', function () {
  var stream = gulp.src('scss/app.scss')
    .pipe($.sass({
        includePaths: sassPaths,
        outputStyle: 'compressed' // if css compressed **file size**
      })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe(gulp.dest('public/css'));

  return stream;
});

gulp.task('js', function () {
  var stream = gulp.src("bower_components/js/app.js")
    .pipe(gulp.dest('public/js'));

  return stream;
});

gulp.task('default', ['sass', 'js'], function () {
  gulp.watch(['scss/**/*.scss'], ['sass']);
  gulp.watch(['bower_components/js/*.js'], ['js']);
});


// Fuck me running.
gulp.task('watch', ['compile'], function () {
  var stream = nodemon({
    script: 'server.js',
    ignore: ['public'],
    tasks: ['compile'],
  });
  /* stream.on('start', function() {
      bs.init({
          proxy: "http://127.0.0.1:3000/"
      });
  }); */
  return stream;

});


/* var browserSyncWatchFiles = [
  './css/*.css',
  './js/*.js',
  './templates/*.twig'
]; */