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
  return sass('./main.scss', { style: 'expanded'})
    .pipe(autoprefixer('last 2 versions'))
    .pipe(gulp.dest('./'))
    .pipe(rename({suffix: '.min'}))
    .pipe(minifycss())
    .pipe(gulp.dest('./'))
    .pipe(livereload())
    .pipe(notify({message: 'Syles task complete'}));
});

gulp.task('default', function() {
  gulp.start('styles');
});

gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('*.scss', ['styles']);
});
