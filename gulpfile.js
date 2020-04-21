const gulp = require('gulp'),
      exist = require('@existdb/gulp-exist'),
      existConfig = require('./existConfig.json'),
      fs = require('fs'),
      jsdom = require('jsdom'),
      { JSDOM } = jsdom;

const exClient = exist.createClient(existConfig);
const targetOptions = {
    target: '/db/apps/probstuecke-digital/'
};

gulp.task('deploy-data', function() {
    return gulp.src('probstuecke-data/encodings/**/*', {})
        .pipe(exClient.newer(targetOptions))
        .pipe(exClient.dest(targetOptions));
});

gulp.task('deploy-characteristics', function() {
  return gulp.src('characteristics-data/mattheson/**/*.xml', {})
      .pipe(exClient.newer(targetOptions))
      .pipe(exClient.dest(targetOptions));
});

gulp.task('deploy-xslt', function() {
  return gulp.src('src/xslt/*', {})
      .pipe(exClient.newer(targetOptions))
      .pipe(exClient.dest(targetOptions));
});

gulp.task('deploy-xql', function() {
  return gulp.src('src/xql/*', {})
      .pipe(exClient.newer(targetOptions))
      .pipe(exClient.dest(targetOptions));
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
          staff = score.querySelector('staff[facs*="#' + zoneId + '"]'),
          staffId = staff.getAttribute('xml:id'),
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
gulp.task('generate-iiif-annotations', function(complete) {
  const N_PIECES = 24;

  let promises = [];
  for (let n=1; n <= N_PIECES; n++) {
    let promise1 = new Promise(function(resolve) {
      let annotationList = generateIIIFAnnotation(n, '1st');
      if (annotationList) {
        fs.writeFile('./probstuecke-data/encodings/' + n + '/mattheson/facsimile_1st.json', JSON.stringify(annotationList, null, 2), function (e) {
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
      fs.writeFile('./probstuecke-data/encodings/' + n + '/mattheson/facsimile_de.json', JSON.stringify(annotationList, null, 2), function (e) {
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

gulp.task('deploy', gulp.series('generate-iiif-annotations',
                    gulp.parallel('deploy-data',
                                  'deploy-characteristics',
                                  'deploy-xslt')));
