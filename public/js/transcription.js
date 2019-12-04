const cetei = new CETEI();

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

function highlightSVG(svgElement) {
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

function getSvgElementBoxAsCss(target) {
  const bRect = target[0].getBoundingClientRect();
  return {
        top: bRect.top,
        left: bRect.left,
        width: bRect.width,
        height: bRect.height
  };
}

// ------
// MIDI player
// ------

const midiUpdate = function(time) {
  // TODO time and the tstamps from midiTimemap are not identical.
  // An approximate lookup would be necessary.
}

async function renderComments() {
  cetei.makeHTML5($("#comments-view").html(), function(html) {
      $("#comments-view").html(html);
      $("#comments-view tei-facsimile img").hide();
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

function connectTEIRefAndSVG(teiRef, targetAttr) {
  // connect indicator with text
  let rect = drawSVGIndicator(targetAttr);
  rect.click(async function() {
    // TODO the same measure might be referenced multiple times. Make sure that in case of a click
    // they other indicators be triggered as well.

    highlightText(teiRef);
  });

  // connect text with an indicator
  teiRef.find("a").on("click", function(e) {
    e.preventDefault();
    highlightSVG(rect);
  });
}

function reconnectCrossRefs() {
  $("tei-ref").each(function() {
    let targetAttrs = $(this).attr("target").split(" ");
    for (let i=0; i<targetAttrs.length; i++) {
      connectTEIRefAndSVG($(this), targetAttrs[i]);
    }
  });
}

// connecting key and meter signature with comments
function connectSignatureTooltips() {
  let keySig = $("#score-view svg").find(".keySig");
  var signatureBox;
  if (keySig.length == 0) {
    // In that case we are probably dealing with a key without any signature, A minor or C major.
    // Taking the first clef instead and shifting the box for some pixels to the right.
    keySig = $("#score-view svg").find(".clef");
    signatureBox = getSvgElementBoxAsCss(keySig);
    signatureBox.left += signatureBox.width;
  } else {
    signatureBox = getSvgElementBoxAsCss(keySig);
  }

  if (keySig.length != 0) {
    let annotation = $("tei-note[type='on-key-signature'] span[data-original='']").removeAttr('hidden');

    if (annotation.length != 0) {
      $('#key-overlay').css(signatureBox).popover({
          content: annotation,
          trigger: 'hover',
          html: true
      });
      annotation.parent().hide();
    }
  }

  let meterSig = $("#score-view svg").find(".meterSig");
  if (meterSig.length != 0) {
    signatureBox = getSvgElementBoxAsCss(meterSig);
    let annotation = $("tei-note[type='on-meter'] span[data-original='']").removeAttr('hidden');

    if (annotation.length != 0) {
      $('#meter-overlay').css(signatureBox).popover({
          content: annotation,
          trigger: 'hover',
          html: true
      });
      annotation.parent().hide();
    }
  }
}

// connecting transcription and facsimile
async function reloadFacsimileTooltips() {
  $('.facsimile-popover').removeAttr('data-content').popover('dispose');

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
      let target = $("#" + xmlId).addClass('facsimile-popover');

      // Often, measures and paragraphs are interrupted by system breaks or
      // page breaks. This will be indicated by a ||-symbol in the tooltip.
      let dataContent = target.attr('data-content');
      if (dataContent) {
        target.attr('data-content', dataContent +
          '<i class="fas fa-grip-lines-vertical"></i>' +
          '<img class="img-fluid" src="' + imageApiUri + '" />');
      } else {
        target.attr('data-content', '<img class="img-fluid" src="' + imageApiUri + '" />');
      }

      target.popover({
        html: true,
        trigger: 'hover'
      }).popover('disable');
    }
  });
}

$(document).ready(async function() {
  $("#player").midiPlayer({
      onUpdate: midiUpdate
  });
  const piece = 'data:audio/midi;base64,' + midi;
  $("#player").show();
  $("#player").midiPlayer.load(piece);

  $("#update-page").click(function() {
    $('#options-form').submit();
  });

  $('#update-facsimile').click(async function() {
    if ($('#display-facsimile').is(':checked')) {
      await reloadFacsimileTooltips();
      $('.facsimile-popover').popover('enable');
    } else {
      $('.facsimile-popover').popover('disable');
    }
  });

  $("#pdf-download").click(function() {
    window.location += '/pdf';
  });

  await renderComments();
  reconnectCrossRefs();
  connectSignatureTooltips();

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