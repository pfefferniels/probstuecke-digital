const cetei = new CETEI();

function refToHref(el) {
  let ref = el.getAttribute('ref');
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
    let svg;
    try {
      svg = await $.get(['/render', number, label, $(this).find('tei-ptr').attr('target')].join('/'));
    } catch (error) {
      printError("failed loading embedded music example: " + error);
    }
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

function connectEditorialNote(el) {
  let note = $(el);
  this.hideContent(el, false);

  let ref = $(note.attr('corresp'));
  if (ref.length != 0) {
    ref.popover({
        content: note.html(),
        trigger: 'hover',
        html: true
    });
  } else {
    return $('<sup>editorial note</sup>').popover({
        content: note.html(),
        trigger: 'hover',
        html: true
    })[0];
  }
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
      content: $('<p>' + el.innerHTML + '</p>'),
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
    content: $('<p>' + el.innerHTML + '</p>'),
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
    let xywhParam = "";
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
    let scanMatch = canvasUri.match(/canvas\/((\d)+)#/);
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

    // presuming that the XPath inside xpointer() is always following the same scheme
    let targetMatch = rTarget.match(/xml:id='(.+)'\]/);
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

function normalizeOrthography() {
  $('.indicator').remove();

  // normalizing long s and Umlaut
  normalizeOption($('#normalize-s').is(':checked'), 'ſ', 's');
  normalizeOption($('#normalize-umlaut').is(':checked'), 'aͤ', 'ä');
  normalizeOption($('#normalize-umlaut').is(':checked'), 'oͤ', 'ö');
  normalizeOption($('#normalize-umlaut').is(':checked'), 'uͤ', 'ü');
  normalizeOption($('#normalize-abbreviations').is(':checked'), 'm̃', 'mm');
  normalizeOption($('#normalize-abbreviations').is(':checked'), 'ñ', 'nn');

  // hiding linebreaks and normalizing hyphens at linebreaks.
  if ($('#ignore-lb').is(':checked')) {
    $('tei-lb').replaceWith('<wbr>');
    // in case of following the DTA-Bf rules strictily,
    // <lb />s are found at the end of lines
    $('tei-text')[0].innerHTML = $('tei-text')[0].innerHTML.replace(/[-]<wbr>(\n|\s)+/g, '&shy;');
    // in case of following the TEI Guidelines, <lb />s are
    // found in the beginning of lines
    $('tei-text')[0].innerHTML = $('tei-text')[0].innerHTML.replace(/[-](\n|\s)+<wbr>/g, '&shy;');
  } else {
    $('tei-text')[0].innerHTML = $('tei-text')[0].innerHTML.replace(/\u00AD/g, '-<wbr>');
    $('wbr').replaceWith('<tei-lb data-origname="lb" />');
  }

  // ignore pagination
  if ($('#ignore-pagination').is(':checked')) {
    $('tei-fw[type="catch"]').hide();
    $('tei-pb').hide();
  } else {
    $('tei-fw[type="catch"]').show();
    $('tei-pb').show();
  }

  // After having modified the innerHTML, all reference event listeners will be gone.
  // Therefore, we reconnect them here.
  Array.prototype.forEach.call($('tei-ref')[0], connectCrossRefs);
}

$(document).ready(async function() {
  if (teiComments) {
    await renderComments();
  }

  $('tei-ref[target]').each(function() {
    connectCrossRefs(this);
  });

  normalizeOrthography();

  if (midi) {
    $("#player").midiPlayer();
    const piece = 'data:audio/midi;base64,' + midi;
    $("#player").show();
    $("#player").midiPlayer.load(piece);
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

  $('#update-orthography').on('click', normalizeOrthography);

  $("#pdf-download").on('click', function() {
    window.location += '/pdf';
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
