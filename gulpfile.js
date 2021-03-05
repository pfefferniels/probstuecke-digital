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
      .pipe(gulp.dest('./build'))
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
  return gulp.src('src/xconf/collection.xconf', {cwd: '.'})
		.pipe(exClient.dest({
            target: `/db/system/config${targetOptions.target}`
        }))
});

// this task runs for a while. Use sparingly and to
// save the CAB server from too much stress ...
gulp.task('modernize-tei', function() {
  gulp.src('**/mattheson/comments_*.xml', {
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
      .pipe(gulp.dest('build'));
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


function createAnnotation(on, n, name, resId, resType, resFormat) {
  return {
    "@context": "http://iiif.io/api/presentation/2/context.json",
    "@id": "https://probstuecke-digital.de/iiif/" + n + "/annotation/" + name,
    "@type": "oa:Annotation",
    "motivation": "sc:painting",
    "resource": {
        "@id": resId,
        "@type": resType,
        "format": resFormat
    },
    "on": on
  };
}

function generateIIIFAnnotation(n, edition) {
  let editionId = (edition == '1st') ? 'firstEdition' : 'secondEdition';

  let template = {
    "@context": "http://iiif.io/api/presentation/2/context.json",
    "@id": "https://probstuecke-digital.de/iiif/" + n + "/list/annotations-" + edition,
    "@type": "sc:AnnotationList",
    "resources": []
  };

  // open score.xml
  const scorePath = './probstuecke-data/encodings/' + n + '/mattheson/score.xml';
  if (!fs.existsSync(scorePath)) {
    console.warn('No score.xml found for PS', n);
    return;
  }
  const scoreFile = fs.readFileSync(scorePath);
  const score = new JSDOM(scoreFile.toString(), { contentType: 'text/xml' }).window.document;

  // open comment_[1st|de].xml
  const commentPath = './probstuecke-data/encodings/' + n + '/mattheson/comments_' + edition + '.xml';
  if (!fs.existsSync(commentPath)) {
    console.warn('No comment file found for PS', n, editionId);
    return;
  }
  const commentFile = fs.readFileSync(commentPath);
  const comment = new JSDOM(commentFile.toString(), { contentType: 'text/xml' }).window.document;

  // deal with surfaces in the score
  let facsimile = score.querySelector('facsimile[decls="#' + editionId + '"]');
  if (!facsimile) {
    console.warn('No facsimile that declares', editionId, 'in PS', n);
    return;
  }

  let surfaces = facsimile.querySelectorAll('surface');
  for (let i=0; i<surfaces.length; i++) {
    let surfaceId = surfaces[i].getAttribute('xml:id');
    let pb = score.querySelector('pb[facs="#' + surfaceId + '"]');
    let on = surfaces[i].querySelector('graphic').getAttribute('target');

    if (pb) {
      let pbN = pb.getAttribute('n');

      template.resources.push(
        createAnnotation(on,
                         n,
                         'page-' + pb.getAttribute('n'),
                         'http://probstuecke-digital.de/iiif/' + n + "/score.xml#xpointer(//pb[n='" + pbN + "' and source='#" + editionId + "'])",
                         'dctypes:Text',
                         'text/html'));
    } else {
      console.warn('no corresponding page beginning (<pb />) element found for facsimile surface', surfaceId);
    }

    let zones = surfaces[i].querySelectorAll('zone');
    for (let j=0; j<zones.length; j++) {
      let zoneId = zones[j].getAttribute('xml:id'),
          staff = score.querySelector('staff[facs*="#' + zoneId + '"]');

      if (!staff) {
        console.log('No staff found that refers to the facsimile zone', zoneId);
        continue;
      }

      let staffId = staff.getAttribute('xml:id'),
          x = zones[j].getAttribute('ulx'),
          y = zones[j].getAttribute('uly'),
          w = zones[j].getAttribute('lrx') - x,
          h = zones[j].getAttribute('lry') - y;

      let measureNumber = staff.parentNode.getAttribute('n');
      if (!measureNumber) {
        measureNumber = 'unnumbered';
      }

      template.resources.push(
        createAnnotation(on + '#xywh=' + [x,y,w,h].join(','),
                         n,
                         'measure-' + measureNumber,
                         'http://probstuecke-digital.de/view/' + n + '/mattheson/' + editionId + '#' + staffId,
                         'dctypes:Text',
                         'text/html'));
    }
  }

  // deal with surfaces in the comments
  surfaces = comment.querySelectorAll('surface');
  for (let i=0; i<surfaces.length; i++) {
    let surfaceId = surfaces[i].getAttribute('xml:id');
    let pb = comment.querySelector('pb[facs="#' + surfaceId + '"]');
    let on = surfaces[i].querySelector('graphic').getAttribute('url');

    if (pb) {
      let pbN = pb.getAttribute('n');

      template.resources.push(
        createAnnotation(on,
                         n,
                         'page-' + pb.getAttribute('n'),
                         'http://probstuecke-digital.de/iiif/' + n + "/score.xml#xpointer(//pb[n='" + pbN + "' and source='#" + editionId + "'])",
                         'dctypes:Text',
                         'text/html'));
    } else {
      console.warn('no corresponding page beginning (<pb />) element found for facsimile surface', surfaceId);
    }

    let zones = surfaces[i].querySelectorAll('zone');
    for (let j=0; j<zones.length; j++) {
      let zoneId = zones[j].getAttribute('xml:id'),
          x = zones[j].getAttribute('ulx'),
          y = zones[j].getAttribute('uly'),
          w = zones[j].getAttribute('lrx') - x,
          h = zones[j].getAttribute('lry') - y;

      ['p', 'notatedMusic'].forEach(function (elementName) {
        let element = comment.querySelector(elementName + '[facs*="#' + zoneId + '"]');
        if (!element) {
          return;
        }

        let elementId = element.getAttribute('xml:id');
        if (!elementId) {
          console.log('unnamed', elementName, 'with facsimile zone', zoneId, 'found');
          return;
        }

        template.resources.push(
          createAnnotation(on + '#xywh=' + [x,y,w,h].join(','),
                           n,
                           elementId,
                           'http://probstuecke-digital.de/view/' + n + '/mattheson/' + editionId + '#' + elementId,
                           'dctypes:Text',
                           'text/html'));
      });
    }
  }

  return template;
}

// This task walks through all MEI and TEI files and creates IIIF
// annotations on facsimile of the original print based on the
// facsimile <zones> defined in the MEI/TEI files.
gulp.task('iiif', function(complete) {
  const N_PIECES = 24;

  let promises = [];
  for (let n=1; n <= N_PIECES; n++) {
    let promise1 = new Promise(function(resolve) {
      let annotationList = generateIIIFAnnotation(n, '1st');
      if (annotationList) {
        fs.writeFile('./build/encodings/' + n + '/mattheson/facsimile_1st.json', JSON.stringify(annotationList, null, 2), function (e) {
          if (!e) {
            console.log('IIIF annotation for Probstück ', n, ' successfully generated');
          } else {
            console.error('failed writing IIIF annotation:', e);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });

    let promise2 = new Promise(function(resolve) {
      let annotationList = generateIIIFAnnotation(n, 'de');
      fs.writeFile('./build/encodings/' + n + '/mattheson/facsimile_de.json', JSON.stringify(annotationList, null, 2), function (e) {
        if (!e) {
          console.log('IIIF annotation for Probstück ', n, ' successfully generated');
        } else {
          console.error('failed writing IIIF annotation:', e);
        }
        resolve();
      });
    });

    promises.push(promise1);
    promises.push(promise2);
  }

  Promise.all(promises).then(function() {
    complete();
  });
});
