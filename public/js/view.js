const cetei = new CETEI();
let scoreToolkit = new verovio.toolkit();
let vrvToolkit = new verovio.toolkit();

function isUrl(str) {
  const urlRegex = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/;
  return str.match(urlRegex);
}

function generatePDF() {
  let options = {
    fontCallback: function(family, bold, italic, fontOptions) {
      if (family == "VerovioText") {
        return family;
      }
      if (family.match(/(?:^|,)\s*sans-serif\s*$/) || true) {
        if (bold && italic) {return 'Times-BoldItalic';}
        if (bold && !italic) {return 'Times-Bold';}
        if (!bold && italic) {return 'Times-Italic';}
        if (!bold && !italic) {return 'Times-Roman';}
      }
    }
  };

  var doc = new PDFDocument({
    size: 'A4',
    useCSS: true,
    compress: true,
    autoFirstPage: false});
  doc.info['Title'] = number + '. Probstück';

  var stream = doc.pipe(blobStream());
  stream.on('finish', function() {
      var blob = stream.toBlob('application/pdf');
      saveAs(blob, 'probstueck_' + number + '.pdf');
  });

  var buffer = Uint8Array.from(atob(vrvTTF), c => c.charCodeAt(0));
  doc.registerFont('VerovioText', buffer);

  vrvToolkit.setOptions({
    adjustPageHeight: false,
    breaks: "auto",
    mmOutput: true,
    footer: "none",
    pageHeight: 2970,
    pageWidth: 2100,
    scale: 100,
    appXPathQuery: (edition == 'firstEdition') ? "./rdg[contains(@source,'#firstEdition')]" : ""
  });
  vrvToolkit.loadData(mei);
  for (let i=0; i<vrvToolkit.getPageCount(); i++) {
      doc.addPage();
      SVGtoPDF(doc, vrvToolkit.renderToSVG(i+1, {}), 0, 0, options);
  }

  doc.end();
}

function linkTo(place, el) {
  let ref = el.getAttribute('corresp');
  if (!ref) {
    return $('<span/>').html(el.innerHTML)[0];
  }

  return $('<a/>').attr('href', isUrl(ref) ? ref : (place + ref)).html(el.innerHTML)[0];
}

function geoReference(el) {
  let ref = el.getAttribute('ref');
  if (!ref) {
    return $('<span/>').html(el.innerHTML)[0];
  }

  return $('<a>').attr('href', ref).html(el.innerHTML).popover({
    content: function() {
      let mapDiv = $('<div class="popover-map" />');

      $.when($.get(ref + '/about.rdf'), $.getJSON('/maps/europe.geo.json'))
       .done(function(rdfResponse, mapResponse) {
         let rdf = $(rdfResponse[0]);
         let mapData = mapResponse[0];

         // extract latitude and longitude
         let lat = rdf.find('wgs84_pos\\:lat').text();
         let long = rdf.find('wgs84_pos\\:long').text();

         let map = L.map(mapDiv[0]).setView([48.8, 2.6], 4);
         L.geoJson(mapData, {
             clickable: false,
             style: {
               fillColor: '#fff5c7',
               weight: 2,
               opacity: 1,
               color: '#ffffff',
               fillOpacity: 0.7
             }
         }).addTo(map);
         L.marker([lat, long]).addTo(map);
       })
       .fail(function(e) {
         console.log(e);
       });

      return mapDiv;
    },
    trigger: 'hover',
    template: '<div class="popover expandable-popover" role="tooltip"><div class="popover-body"/></div>',
    html: true
  })[0];
}

cetei.addBehaviors({
  handlers: {
    'persName': function(el) {
      return linkTo('/index/persons', el);
    },

    'placeName': geoReference,

    'name': function(el) {
      return linkTo('/index/musicalWorks', el);
    },

    'facsimile': function(el) {
      this.hideContent(el, false);
    },

    'expan': function(el) {
      return $('<sup>expansion</sup>').popover({
          content: el.innerHTML,
          trigger: 'hover',
          html: true
      })[0];
    },

    'ref': [
      ['[type="editorial-note"]', ['']]
    ],

   'note': [
      ['[type="editorial"]', connectEditorialNote]
    ]
  }
});

// ------
// Helper functions
// ------

const sleep = m => new Promise(r => setTimeout(r, m))

function printError(message) {
  $("#message").append(message).append("<br/>").css('background-color', 'rgba(200,20,20)');
  $("#message").show().delay(2000).fadeOut("slow").queue(function() {
    $(this).empty().dequeue();
  });
}

async function animateSVG(svgElement) {
  $("html,body").animate({
    scrollTop: svgElement.rbox().y
  }, 100, async function() {
    svgElement.addClass('blink');
    await sleep(4000);
    svgElement.removeClass('blink');
  });
}

function animateText(element) {
  $("html,body").animate({
    scrollTop: element.offset().top-50
  }, 100, async function() {
    element.addClass('blink');
    await sleep(4000);
    element.removeClass('blink');
  });
}

function highlight(target) {
  let svg = SVG(target);
  if (svg == null) {
    console.log("corresponding SVG element for ", target, " not found");
    return;
  }

  const padding = 100;
  let bbox = svg.bbox();

  // draw the box always into g.measure to make
  // sure that it does not hide the staff lines.
  if (!svg.hasClass("measure")) {
    svg = svg.parent(".measure");
  }

  return {
    underlay: svg.rect(bbox.width + padding, bbox.height + padding).
                  move(bbox.x - .5*padding, bbox.y - .5*padding).
                  attr('class', 'underlay').
                  back(),
    overlay: svg.rect(bbox.width + padding, bbox.height + padding).
                 move(bbox.x - .5*padding, bbox.y - .5*padding).
                 attr('class', 'overlay')
  }
}

async function renderComments() {
  cetei.makeHTML5(teiComments, function(html) {
    let comment = $("#comments-view").html(html);

    removeHiddenAttr(comment.find('tei-teiheader')[0]).detach().appendTo('#transcript-info');
  });

  // load the music examples, if there are any
  var notatedMusicPromises = [];
  $("tei-notatedmusic").each(async function() {
    var dfd = $.Deferred();
    notatedMusicPromises.push(dfd);

    // load MEI of the example, transform it to SVG
    // and insert at the right place
    var notatedmusic = $(this);
    let exampleMEI;
    try {
      exampleMEI = await $.get(
        ['/render',
         number,
         author,
         $(this).find('tei-ptr:first').attr('target')].join('/')
        + window.location.search);
    } catch (error) {
      printError("failed loading embedded music example: " + error);
    }
    let svg = vrvToolkit.renderData(exampleMEI, {
      pageHeight: 30000,
      adjustPageHeight: 1,
      footer: 'none',
      header: 'encoded',
      appXPathQuery: (edition == 'firstEdition') ? "./rdg[contains(@source,'#firstEdition')]" : ""
    });
    notatedmusic.find('tei-ptr:first').replaceWith(svg);

    // load corresponding audio of the example,
    // and insert it at the right place
    let audioPtr = $(this).find('tei-ptr[mimetype="audio/ogg"]');
    if (audioPtr.length != 0) {
      let audioPath =
        ['/render',
         number,
         author,
         audioPtr.attr('target')].join('/');

      audioPtr.replaceWith(
        `<audio class='embedded-audio' controls>
           <source src="${audioPath}" type="audio/ogg">
           Your browser does not support the audio element.
         </audio>`);
    }

    dfd.resolve();
  });

  $('#comments-view tei-media[mimetype="audio/ogg"]').each(function() {
      let audioPath =
        ['/render',
         number,
         author,
         this.getAttribute('url')].join('/');

      $(this).replaceWith(
        `<audio class='embedded-audio' controls>
           <source src="${audioPath}" type="audio/ogg">
           Your browser does not support the audio element.
         </audio>`);
  });

  // make sure that loading the comments is done only when all
  // the notatedMusic elements are resolved.
  await Promise.all(notatedMusicPromises);
}

function connectCrossRefs(el) {
  let targetAttrs = el.getAttribute("target").split(" ");
  for (let i=0; i<targetAttrs.length; i++) {
    connectTEIRefWithTarget($(el), targetAttrs[i]);
  }
}

function reconnectCrossRefs() {
  $('tei-ref[target]').each(function() {
    let target = $(this).attr('target');
    if (isUrl(target)) {
      $(this).wrap(`<a href="${target}" />`);
    } else {
      connectCrossRefs(this);
    }
  });
}

function connectEditorialNote(el) {
  this.hideContent(el, false);

  let ref = $(el.getAttribute('corresp'));
  if (ref.length != 0) {
    ref.popover({
        content: removeHiddenAttr(el),
        trigger: 'hover',
        html: true
    });
  } else {
    return $('<sup>editorial note</sup>').popover({
        content: removeHiddenAttr(el),
        trigger: 'hover',
        html: true
    })[0];
  }
}

function removeHiddenAttr(el) {
  return $(el).find('span').first().removeAttr('hidden');
}

function renderKeyOverlay(el) {
  if (!keyCharacteristics) {
    return;
  }

  let keySigHighlight = highlight('.keySig');
  if (!keySigHighlight) {
    // In that case we are probably dealing with a key without any signature.
    // Taking the meter instead and shifting the box to the left.
    keySigHighlight = highlight('.meterSig');
    keySigHighlight.overlay.dx(-1.33*keySigHighlight.width());
    keySigHighlight.underlay.dx(-1.33*keySigHighlight.width());
  }
  keySigHighlight.underlay.addClass('signature-overlay');

  cetei.makeHTML5(keyCharacteristics, function(html) {
    $(html).attr('id', 'key-characteristics').hide().appendTo('body');
    $(keySigHighlight.overlay.node).popover({
        content: function() {
          return $('#key-characteristics').clone().show();
        },
        trigger: 'click',
        html: true
    });
  });
}

function renderMeterOverlay(el) {
  if (!meterCharacteristics) {
    return;
  }

  let meterSigHighlight = highlight('.meterSig');
  meterSigHighlight.underlay.addClass('signature-overlay');

  cetei.makeHTML5(meterCharacteristics, function(html) {
    $(html).attr('id', 'meter-characteristics').hide().appendTo('body');
    $(meterSigHighlight.overlay.node).popover({
        content: function() {
          return $('#meter-characteristics').clone().show();
        },
        trigger: 'click',
        html: true
    });
  });
}

function connectTEIRefWithTarget(teiRef, target) {
  if ($(target).parents('svg').length != 0) {
    // connecting with SVG element
    let rect = highlight(target);

    rect.overlay.click(async function() {
      animateText(teiRef);
    });

    teiRef.on('click', function() {
      animateSVG(rect.underlay);
    });
  } else if ($('tei-tei').has(target).length != 0) {
    // connecting with TEI element
    teiRef.on('click', function() {
      animateText($(target))
    });
  } else {
    // if no corresponding element exists, gray it out and remove the link
    teiRef.addClass('disabled-reference').find('a').contents().unwrap();
  }
}

// connecting view and facsimile
async function reloadFacsimileTooltips() {
  $('.has-facsimile-popover').removeAttr('data-content').popover('dispose');

  let iiif;
  try {
    iiif = await $.get("/iiif/" + number + "/list/" + "facsimile_de");
  } catch(e) {
    printError("Could not load IIIF AnnotationList");
    return;
  }

  iiif.resources.forEach(async function(r) {
    let canvasUri = r.on;
    if (!canvasUri) {
      return;
    }

    // extract the X, Y, width and height from the annotation
    // if no region is given, we are dealing with full page annotation on a <pb>
    let xywhParam = 'full';
    let xywhMatch = canvasUri.match(/#xywh=((\d)+,(\d)+,(\d)+,(\d)+)/);
    if (xywhMatch) {
      xywhParam = xywhMatch[1];
    }

    // extract the identifier from the annotation
    let idMatch = canvasUri.match(/\/(bsb(\d)+)\//);
    if (!idMatch) {
      return;
    }
    let identifier = idMatch[1];

    // extract scan number
    let scanMatch = canvasUri.match(/canvas\/((\d)+)/);
    if (!scanMatch) {
      return;
    }
    let scan = scanMatch[1].padStart(5, "0");

    // create an Image API URI from the given information
    // and from the user's choice.
    let imageApiUri = [
      "https://api.digitale-sammlungen.de/iiif/image/v2",
      (identifier + '_' + scan),
      xywhParam,
      ("pct:" + $("#facsimile-size").val()),
      "0",
      ($("#facsimile-quality").val() + ".jpg")].join("/");

    // extract what is actually annotating the canvas region
    let rTarget = r.resource["@id"];
    let targetMatch = rTarget.match(/#.+/);
    if (targetMatch) {
      let referredElement = targetMatch[0];
      if (referredElement) {
        let target = $(referredElement).addClass('has-facsimile-popover');

        // Often, measures and paragraphs are interrupted by system breaks or
        // page breaks. This will be indicated by a ||-symbol in the tooltip.
        let dataContent = target.attr('data-content');
        if (dataContent) {
          target.attr('data-content', dataContent +
            '<i class="fas fa-grip-lines-vertical"></i>' +
            '<img src="' + imageApiUri + '" />');
        } else {
          target.attr('data-content', '<img src="' + imageApiUri + '" />');
        }

        target.popover({
          html: true,
          trigger: 'hover',
          template: '<div class="popover expandable-popover" role="tooltip"><div class="popover-body"/></div>'
        });
      }
    }

    // Matching page breaks.
    targetMatch = rTarget.match(/pb\[n='((\d)+?)'/);
    if (targetMatch) {
      let pbNumber = targetMatch[1];
      if (pbNumber) {
        $('tei-pb[n=' + pbNumber + ']').popover({
          content: '<img src="' + imageApiUri + '" />',
          html: true,
          trigger: 'hover'
        }).addClass('has-facsimile-popover');
      }
    }
  });
}

function normalizeOption(replace, orig, replacement) {
  if (replace) {
    $('tei-text').each(function() {
      findAndReplaceDOMText(this, {
        find: orig,
        replace: replacement,
        wrap: 'span',
        wrapClass: 'replaced-by-' + replacement
      });
    });
  } else {
    $('.replaced-by-' + replacement).replaceWith(orig);
  }
}

async function renderWithNormalizedOrthography() {
  $('.underlay').remove();
  $('.overlay').remove();

  // hide line beginnings and normalize hyphens at line breaks.
  if ($('#ignore-lb').is(':checked')) {
    const lbWithHyphen = /\-(\n|\s)*<lb(\s)*\/>([a-z]|ſ)/g;
    teiComments = teiComments.replace(lbWithHyphen, '$3&#xAD;');
    keyCharacteristics = keyCharacteristics.replace(lbWithHyphen, '$3&#xAD;');
    meterCharacteristics = meterCharacteristics.replace(lbWithHyphen, '$3&#xAD;');

    await Promise.all([renderComments(), reconnectCrossRefs(), renderKeyOverlay(), renderMeterOverlay()]);
    $('tei-lb').hide();
  } else {
    const softHyphen = /\&#xAD;/g;
    teiComments = teiComments.replace(softHyphen, '-<lb/>');
    keyCharacteristics = keyCharacteristics.replace(softHyphen, '-<lb/>');
    meterCharacteristics = meterCharacteristics.replace(softHyphen, '-<lb/>');

    await Promise.all([renderComments(), reconnectCrossRefs(), renderKeyOverlay(), renderMeterOverlay()]);
    $('tei-lb').show();
  }

  // normalizing long s and Umlaut
  normalizeOption($('#normalize-s').is(':checked'), 'ſ', 's');
  normalizeOption($('#normalize-umlaut').is(':checked'), 'aͤ', 'ä');
  normalizeOption($('#normalize-umlaut').is(':checked'), 'oͤ', 'ö');
  normalizeOption($('#normalize-umlaut').is(':checked'), 'uͤ', 'ü');
  normalizeOption($('#normalize-abbreviations').is(':checked'), 'm̃', 'mm');
  normalizeOption($('#normalize-abbreviations').is(':checked'), 'ñ', 'nn');

  // ignore pagination
  if ($('#ignore-pagination').is(':checked')) {
    $('tei-fw[type="catch"]').hide();
    $('tei-pb').hide();
  } else {
    $('tei-fw[type="catch"]').show();
    $('tei-pb').show();
  }
}

$(document).ready(async function() {
  $('[data-toggle="popover"]').popover({
    trigger: 'hover'
  });

  if (mei) {
    scoreToolkit.setOptions({
      pageHeight: 30000,
      adjustPageHeight: true,
      footer: 'none',
      appXPathQuery: (edition == 'firstEdition') ? "./rdg[contains(@source,'#firstEdition')]" : ""
    });
    scoreToolkit.loadData(mei);
    let svg = scoreToolkit.renderToSVG(1, {});
    $("#score-view").html(svg);

    $("#player").midiPlayer({
      onUpdate: midiUpdate
    });
    const piece = 'data:audio/midi;base64,' + scoreToolkit.renderToMIDI();
    $("#player").show();
    $("#player").midiPlayer.load(piece);
  }

  if (teiComments || keyCharacteristics || meterCharacteristics) {
    renderWithNormalizedOrthography();
  }

  $("#update-page").on('click', function() {
    $('#options-form').submit();
  });

  $('#update-facsimile').on('click', async function() {
    if ($('#display-facsimile').is(':checked')) {
      await reloadFacsimileTooltips();
      $('.has-facsimile-popover').popover('enable');
    } else {
      $('.has-facsimile-popover').popover('disable');
    }
  });

  $('#hideSupplied').on('change', function() {
    $('.supplied:has(.accid)').toggle();
  });

  $('#originalAccidentals').on('change', function() {
    $('.orig:has(.accid)').toggle();
  });

  $('#update-orthography').on('click', renderWithNormalizedOrthography);

  $("#pdf-download").on('click', function() {
    generatePDF();
  });

  $('#mei-download').on('click', function() {
    saveAs(new Blob([mei], {type: "text/xml;charset=utf-8"}),
      `probstueck_${number}_score.xml`);
  });

  $('#tei-download').on('click', function() {
    saveAs(new Blob([teiComments], {type: "text/xml;charset=utf-8"}),
      `probstueck_${number}_comment.xml`);
  });

  // highlighting the element that might be given in the URL
  let hash = window.location.hash;
  if (hash) {
    let target = $('body').find(hash);
    if (target.parents('svg').length != 0) {
      let rect = highlight(hash);
      animateSVG(rect.underlay);
    } else {
      animateText(target);
    }
  }
});

let midiUpdate = function(time) {
  let vrvTime = Math.max(0, time - 800);
  let elements = scoreToolkit.getElementsAtTime(vrvTime);
  let notes = elements.notes;

  if (elements.page == 0 || notes.length == 0) {
    return;
  }

  for (let i=0; i<notes.length; i++) {
    let svg = SVG('#' + notes[i]);
    if (svg != null) {
      svg.opacity(0.1).animate().opacity(1);
    } else {
      console.warn('no corresponding element', notes[i]);
    }
  }
}
