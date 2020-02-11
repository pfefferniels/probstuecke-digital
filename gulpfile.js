const gulp = require('gulp'),
      exist = require('@existdb/gulp-exist'),
      existConfig = require('./existConfig.json');
// override defaults
const connectionOptions = {
    basic_auth: {
        user: 'admin',
        pass: ''
    }
};

const exClient = exist.createClient(existConfig);
const targetOptions = {
    target: '/db/apps/probstuecke-digital/'
};

gulp.task('deploy', function() {
    return gulp.src('data/**/*', {})
        .pipe(exClient.newer(targetOptions))
        .pipe(exClient.dest(targetOptions));
});
