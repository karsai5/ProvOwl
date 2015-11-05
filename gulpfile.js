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

gulp.task('styles', function() {
  return sass('sass/*.scss', { style: 'expanded' })
    .pipe(gulp.dest('css'))
    .pipe(livereload());
});

gulp.task('javascript', function() {
  return livereload()
    .pipe(notify({message: 'Javascript file changed'}));
});

gulp.task('default', function() {
  gulp.start('styles');
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('sass/*.scss', ['styles']);
  // gulp.watch('*.js', ['javascript']);
});
