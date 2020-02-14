const gulp = require('gulp'),
      exist = require('@existdb/gulp-exist'),
      existConfig = require('./existConfig.json');

const exClient = exist.createClient(existConfig);
const targetOptions = {
    target: '/db/apps/probstuecke-digital/'
};

gulp.task('deploy-data', function() {
    return gulp.src('data/**/*', {})
        .pipe(exClient.newer(targetOptions))
        .pipe(exClient.dest(targetOptions));
});

gulp.task('deploy-xslt', function() {
    return gulp.src('src/xslt/*', {})
        .pipe(exClient.newer(targetOptions))
        .pipe(exClient.dest(targetOptions));
});

gulp.task('deploy', gulp.series('deploy-data', 'deploy-xslt'));
