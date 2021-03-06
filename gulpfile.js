/* globals require */
var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');
    useref = require('gulp-useref');
    replace = require('gulp-replace');
    gulpif = require('gulp-if');
    var rm = require('gulp-rm');

gulp.task('clean:production', function() {
  return gulp.src('public_html/**/*', {read: false})
    .pipe(rm());
});

gulp.task('clean:css', function() {
  return gulp.src('src/css/**/*', {read: false})
    .pipe(rm());
});

gulp.task('clean', ['clean:production', 'clean:css']);

gulp.task('styles', function() {
  return sass('src/sass/*.scss', { style: 'expanded' })
    .pipe(gulp.dest('src/css'))
    .pipe(livereload());
});

gulp.task('scripts', function() {
	return gulp.src('./src/js/pvis/*.js')
	.pipe(concat('PVisualiser.js'))
	.pipe(gulp.dest('./src/js/'));
});

gulp.task('reload', function() {
  gulp.src("/src/index.html")
  .pipe(livereload());
});

gulp.task('default', function() {
  gulp.start('styles');
});

// Minifies all js and css into one file.
gulp.task('minify_assets', function() {
  gulp.src('src/*.html')
    .pipe(useref())
    .pipe(gulpif('*.js', replace('/src/static/', '/static/')))
    // .pipe(gulpif('*.js', uglify()))
    .pipe(gulp.dest('public_html'));
});

gulp.task('copy_prov_examples', function() {
  gulp.src(['prov-examples/**/*'])
    .pipe(gulp.dest('public_html/prov-examples'));
});

gulp.task('copy_static', function() {
  gulp.src(['src/static/**/*'])
    .pipe(gulp.dest('public_html/static'));
  gulp.src(['.htaccess'])
    .pipe(gulp.dest('public_html/'));
});

gulp.task('production', ['styles', 'copy_static', 'copy_prov_examples', 'minify_assets']);

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('src/sass/*.scss', ['styles']);
  gulp.watch('**/*.html',['reload']);
  gulp.watch('**/*.js', ['scripts']);
});
