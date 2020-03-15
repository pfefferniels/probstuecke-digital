const cetei = new CETEI();
let scoreToolkit = new verovio.toolkit();
let vrvToolkit = new verovio.toolkit();

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
    scale: 100
  });
  vrvToolkit.loadData(mei);
  for (let i=0; i<vrvToolkit.getPageCount(); i++) {
      doc.addPage();
      SVGtoPDF(doc, vrvToolkit.renderToSVG(i+1, {}), 0, 0, options);
  }

  doc.end();
}

function refToHref(el) {
  let ref = el.getAttribute('ref');
  if (!ref) {
    return $('<span/>').html(el.innerHTML)[0];
  }

  let newRef = ref.replace('d-nb.info', 'lobid.org');
  return $('<a>').attr('href', ref).html(el.innerHTML).popover({
    content: function() {
      let span = $('<span><i class="fas fa-spinner fa-spin" /></span>');
      $.ajax({
        url: newRef,
        success: function(response) {
          span.html(response.preferredName);
        }
      });
      return span;
    },
    trigger: 'hover',
    html: true
  })[0];
}

cetei.addBehaviors({
  handlers: {
    'persName': refToHref,
    'placeName': refToHref,
    'name': refToHref,

    'teiHeader': function(el) {
      $('#transcript-info').html(el.innerHTML);
      this.hideContent(el, false);
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
      ['[type="editorial"]', connectEditorialNote],
      ['[type="on-key-signature"]', connectKeyOverlay],
      ['[type="on-meter"]', connectMeterOverlay]
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

async function highlightSVG(svgElement) {
  $("html,body").animate({
    scrollTop: svgElement.rbox().y
  }, 100, function() {
    svgElement.animate(500).attr({fill: "#ffaa99"}).animate().attr({fill: "#ffe47a"});
  });
}

function highlightText(element) {
  $("html,body").animate({
    scrollTop: element.offset().top-50
  }, 100, async function() {
    element.addClass("highlight");
    await sleep(3000);
    $(element).removeClass('highlight');
  });
}

function drawSVGIndicator(targetAttr) {
  let svg = SVG(targetAttr);
  if (svg == null) {
    console.log("corresponding SVG element for ", targetAttr, " not found");
    return;
  }
  let bbox = svg.bbox();

  // draw the box always into g.measure to make
  // sure that it does not hide the staff lines.
  if (!svg.hasClass("measure")) {
    svg = svg.parent(".measure");
  }

  return svg.rect(bbox.width,bbox.height).
             move(bbox.x,bbox.y).
             fill("#ffe47a").
             attr("class", "indicator").
             attr("id", "indicate_" + targetAttr.substr(1)).
             back();
}

async function renderComments() {
  cetei.makeHTML5(teiComments, function(html) {
      $("#comments-view").html(html);
  });

  // load the music examples, if there are any
  var notatedMusicPromises = [];
  $("tei-notatedmusic").each(async function() {
    var dfd = $.Deferred();
    notatedMusicPromises.push(dfd);

    var notatedmusic = $(this);
    let exampleMEI;
    try {
      exampleMEI = await $.get(
        ['/render',
         number,
         label,
         $(this).find('tei-ptr').attr('target')].join('/')
        + window.location.search);
    } catch (error) {
      printError("failed loading embedded music example: " + error);
    }
    let svg = vrvToolkit.renderData(exampleMEI, {
      pageHeight: 30000,
      adjustPageHeight: 1,
      footer: "none"
    });
    notatedmusic.find("tei-ptr").replaceWith(svg);

    dfd.resolve();
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
  const uriRegex = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/;
  $('tei-ref[target]').each(function() {
    let target = $(this).attr('target');
    if (target.match(uriRegex)) {
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
        content: visibleContentOfTEINote(el),
        trigger: 'hover',
        html: true
    });
  } else {
    return $('<sup>editorial note</sup>').popover({
        content: visibleContentOfTEINote(el),
        trigger: 'hover',
        html: true
    })[0];
  }
}

function visibleContentOfTEINote(el) {
  return $(el).find('span').first().removeAttr('hidden')[0];
}

function connectKeyOverlay(el) {
  let keySigIndicator = drawSVGIndicator('.keySig');
  if (!keySigIndicator) {
    // In that case we are probably dealing with a key without any signature.
    // Taking the meter instead and shifting the box to the left.
    keySigIndicator = drawSVGIndicator('.meterSig');
    keySigIndicator.dx(-1.33*keySigIndicator.width());
  }
  keySigIndicator.addClass('signature-overlay');

  $(keySigIndicator.node).popover({
      content: function() {
        return visibleContentOfTEINote(el);
      },
      trigger: 'click',
      html: true
  });
  if (this.hideContent) {
    this.hideContent(el, false);
  }
}

function connectMeterOverlay(el) {
  let meterSigOverlay = drawSVGIndicator('.meterSig');
  meterSigOverlay.addClass('signature-overlay');

  $(meterSigOverlay.node).popover({
      content: function() {
        return visibleContentOfTEINote(el);
      },
      trigger: 'click',
      html: true
  });
  if (this.hideContent) {
    this.hideContent(el, false);
  }
}

function connectTEIRefWithTarget(teiRef, target) {
  if ($(target).parents('svg').length != 0) {
    // connecting with SVG element
    let rect = drawSVGIndicator(target);

    rect.click(async function() {
      highlightText(teiRef);
    });

    teiRef.on('click', function() {
      highlightSVG(rect);
    });
  } else if ($('tei-tei').has(target).length != 0) {
    // connecting with TEI element
    teiRef.on('click', function() {
      highlightText($(target))
    });
  } else {
    // if no corresponding element exists, gray it out and remove the link
    teiRef.addClass('disabled-reference').find('a').contents().unwrap();
  }
}

// connecting transcription and facsimile
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

    // presuming that the XPath inside xpointer() is always following
    // the same scheme
    let targetMatch = rTarget.match(/xml:id='(.+)'\]/);
    if (targetMatch) {
      let xmlId = targetMatch[1];
      if (xmlId) {
        let target = $("#" + xmlId).addClass('has-facsimile-popover');

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
          template: '<div class="popover facsimile-popover" role="tooltip"><div class="popover-body"/></div>'
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
    findAndReplaceDOMText($('tei-text')[0], {
      find: orig,
      replace: replacement,
      wrap: 'span',
      wrapClass: 'replaced-by-' + replacement
    });
  } else {
    $('.replaced-by-' + replacement).replaceWith(orig);
  }
}

async function renderWithNormalizedOrthography() {
  $('.indicator').remove();

  // hiding linebreaks and normalizing hyphens at linebreaks.
  if ($('#ignore-lb').is(':checked')) {
    // T5 Guidelines has <lb>s in the beginning of lines.
    teiComments = teiComments.replace(/\-(\n|\s)*<lb(\s)*\/>([a-z]|ſ)/g, '$3&#xAD;');
    // DTA-Bf recommends <lb>s in the end of lines.
    teiComments = teiComments.replace(/\-<lb(\s)*\/>(\n|\s)*([a-z]|ſ)/g, '$3&#xAD;');

    await renderComments();
    $('tei-lb').hide();
  } else {
    teiComments = teiComments.replace(/\&#xAD;/g, '-<lb/>');

    await renderComments();
    $('tei-lb').show();
  }
  reconnectCrossRefs();

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
      footer: 'none'
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

  if (teiComments) {
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
      let rect = drawSVGIndicator(hash);
      highlightSVG(rect);
    } else {
      highlightText(target);
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
    console.log(notes[i]);
    let svg = SVG('#' + notes[i]);
    if (svg != null) {
      svg.opacity(0.1).animate().opacity(1);
    } else {
      console.warn('no corresponding element', notes[i]);
    }
  }
}
