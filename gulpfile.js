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

gulp.task('styles', function() {
  return sass('sass/*.scss', { style: 'expanded' })
    .pipe(gulp.dest('css'))
    .pipe(livereload());
});

gulp.task('javascript', function() {
  return livereload()
    .pipe(notify({message: 'Javascript file changed'}));
});

gulp.task('reload', function() {
  gulp.src("index.html")
  .pipe(livereload());
});

gulp.task('default', function() {
  gulp.start('styles');
});

// Minifies all js and css into one file.
gulp.task('minify_assets', function() {
  return gulp.src('index.html')
    .pipe(useref())
    .pipe(gulpif('*.js', replace('/src/static/', '/static/')))
    .pipe(gulp.dest('public_html'));
});

gulp.task('copy_static', function() {
  gulp.src(['src/static/**/*'])
    .pipe(gulp.dest('public_html/static'));
});

gulp.task('production', ['copy_static', 'minify_assets']);

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('sass/*.scss', ['styles']);
  gulp.watch('*.html',['reload']);
  // gulp.watch('*.js', ['javascript']);
});
