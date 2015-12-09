var autoprefixer = require('gulp-autoprefixer');
var cache = require('gulp-cache');
var colorblind = require('postcss-colorblind');
var concat = require('gulp-concat');
var csswring = require('csswring');
var del = require('del');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var jshint = require('gulp-jshint');
var livereload = require('gulp-livereload');
var minifycss = require('gulp-minify-css');
var mqpacker = require('css-mqpacker');
var notify = require('gulp-notify');
var postcss = require('gulp-postcss');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var sass = require('gulp-ruby-sass');
var styleguide = require('postcss-style-guide');
var uglify = require('gulp-uglify');
var useref = require('gulp-useref');

gulp.task('styles', function() {
  return sass('src/sass/*.scss', { style: 'expanded' })
   .pipe(gulp.dest('src/css'))
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
.pipe(gulpif('*.js', uglify()))
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
