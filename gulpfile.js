const gulp = require('gulp'),
      zip = require('gulp-zip'),
      exist = require('@existdb/gulp-exist'),
      existConfig = require('./existConfig.json'),
      fs = require('fs'),
      jsdom = require('jsdom'),
      { JSDOM } = jsdom,
      post = require('gulp-post'),
      through2 = require('through2'),
      request = require('request');

const exClient = exist.createClient(existConfig);
const targetOptions = {
    target: '/db/apps/probstuecke-digital/',
    html5AsBinary: true
};

gulp.task('encodings', function() {
  return gulp.src('**/*', {
        cwd: 'probstuecke-data/encodings',
        base: 'probstuecke-data',
        since: gulp.lastRun('encodings')
      })
      .pipe(gulp.dest('./build/'))
});

gulp.task('characteristics', function() {
  return gulp.src('**/*', {
        cwd: 'characteristics-data/mattheson',
        base: 'characteristics-data',
        since: gulp.lastRun('characteristics')
      })
      .pipe(gulp.dest('./build'));
});

gulp.task('xar-structure', function() {
  return gulp.src('**/*', {cwd: 'eXist-app-template'})
      .pipe(gulp.dest('./build'));
});

gulp.task('xslt', function() {
  return gulp.src('src/xslt/*', {})
             .pipe(gulp.dest('./build/xslt'));
});

gulp.task('xql', function() {
  return gulp.src('src/xql/*', {})
             .pipe(gulp.dest('./build/xql'));
});

gulp.task('deploy-xconf', function() {
  return gulp.src('eXist-app-template/collection.xconf', {cwd: '.'})
		.pipe(exClient.dest({
            target: `/db/system/config${targetOptions.target}`
        }))
});

// this task runs for a while. Use sparingly in order to
// save the CAB server from too much stress ...
gulp.task('modernize-tei', function() {
  return gulp.src('**/mattheson/comments_{1st,de}.xml', {
        cwd: 'probstuecke-data/encodings',
        base: 'probstuecke-data',
        since: gulp.lastRun('encodings')})
      .pipe(through2.obj(function (file, enc, callback) {
        if (!file) {
          console.error('Error reading file');
          throw 'Error reading file';
        }
        var clone = file.clone();
        if (file.isBuffer()) {
          request.post({
            url: 'https://www.deutschestextarchiv.de/demo/cab/query?a=default&clean=1&fmt=tei',
            formData: {
              'qd': file.contents.toString('utf8')
            }
          }, (err, response, body) => {
            if (err) {
              console.error('Error:', err);
              throw 'Error when retrieving data from CAB server';
            }
            if (!err) {
              clone.basename = clone.basename.replace(/(\.[\w\d_-]+)$/i, '-modernized$1');
              clone.contents = Buffer.from(body, 'utf8');
              callback(null, clone);
            }
          });
        }
      }))
      .pipe(gulp.dest('probstuecke-data'));
});

gulp.task('frontend', function() {
  return gulp.src('build/**/*', {cwd: 'probstuecke-react'})
             .pipe(gulp.dest('./build'));
});

gulp.task('deploy', function() {
  return gulp.src('**/*', {cwd: './build'})
             .pipe(exClient.newer(targetOptions))
             .pipe(exClient.dest(targetOptions));
});

gulp.task('dist', function() {
  return gulp.src('build/**/*', {
    base: 'build'
  })
  .pipe(zip('probstuecke-digital.xar'))
  .pipe(gulp.dest('./dist'));
});
