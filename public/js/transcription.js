const cetei = new CETEI();

var currentParams = {};

function updatePage() {
  window.location.search = $.param(currentParams);
}

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

function printInfo(message) {
  $("#message").append(message).append("<br/>").css('background-color', 'rgba(200,200,200)');
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
  let svg = SVG.get(targetAttr);
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

function adjustToBBox(svgElement) {
  const bb = svgElement[1].getBBox();
  const bbw = bb.width;
  const bbh = bb.height;
  svgElement[1].setAttribute("viewBox", [bb.x,bb.y,bbw,bbh].join(" "));

  svgElement.css({
    width: (bbw/1000)*28.34 + "px",
    height: (bbh/1000)*28.34 + "px"
  });
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
      modernClefs: currentParams.modernClefs
    } catch (error) {
      printError("failed loading embedded music example: " + error);
    }
    notatedmusic.find("tei-ptr").replaceWith(svg);

    adjustToBBox(notatedmusic.find("svg"));

    // on smaller screen sizes, the svg might too wide.
    var normalParagraph = notatedmusic.parent().find("tei-p");
    if (notatedmusic.find("svg").width() > normalParagraph.width()) {
      svg0.attr("width", normalParagraph.width());
    }
    dfd.resolve();
  });

  // make sure that loading the comments is done only when all
  // the notatedMusic elements are resolved.
  await Promise.all(notatedMusicPromises);
}

function connectTEIRefAndSVG(teiRef, targetAttr) {
  let target = $('#score-view').find(targetAttr);
  if (target.length === 0) {
    console.log("corresponding SVG element not found.");
    return;
  }

  let rect = drawSVGIndicator(targetAttr);

  // connect indicator with text
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

function positionAtMouse(el, e) {
  el.css({
    position: "absolute",
    left: e.pageX+5,
    top: e.pageY+5
  });

  if (e.pageX+el.width()*0.6 > $(window).width()) {
    el.css({
      left: e.pageX-el.width()*0.6-20
    });
  }
  if (e.pageY+el.height()*0.6 > $(window).height()) {
    el.css({
      top: e.pageY-el.height()*0.6-20
    });
  }
}

function cleanUpTooltips() {
  $("#tooltips").empty();
  $(".tooltip-overlay").remove();
}

// connecting key and meter signature with comments
function connectSignatureTooltips() {
  cleanUpTooltips();

  var keySig = $("#score-view svg").find(".keySig");
  var signatureBox;
  if (keySig.length == 0) {
    // In that case we are probably dealing with a key without any signature, A minor or C major.
    // Taking the first clef instead and shifting the box for some pixels to the right.
    keySig = $("#score-view svg").find(".clef");
    signatureBox = getSvgElementBoxAsCss(keySig);
    signatureBox.left += signatureBox.width;
  } else {
    signatureBox = getSvgElementBoxAsCss(keySig)
  }

  if (keySig.length != 0) {
    let annotation = $("tei-note[type='on-key-signature'] span[data-original='']");

    $("<div class='tooltip-overlay' />").appendTo("body").css(signatureBox).mouseenter(function(e) {
      let tooltips = $("#tooltips");
      $("<div class='tooltip tooltip-text' />").append(annotation.removeAttr("hidden")).appendTo("#tooltips");
      positionAtMouse(tooltips, e);
    }).mouseleave(function(e) {
      $("#tooltips").empty();
    });

    annotation.parent().hide();
  }

  var meterSig = $("#score-view svg").find(".meterSig");
  if (meterSig.length != 0) {
    let annotation = $("tei-note[type='on-meter'] span[data-original='']");

    $("<div class='tooltip-overlay' />").appendTo("body").css(getSvgElementBoxAsCss(meterSig)).mouseenter(function(e) {
      let tooltips = $("#tooltips");
      $("<div class='tooltip tooltip-text' />").append(annotation.removeAttr("hidden")).appendTo("#tooltips");
      positionAtMouse(tooltips, e);
    }).mouseleave(function(e) {
      $("#tooltips").empty();
    });

    annotation.parent().hide();
  }
}

var tooltipTargets = [];

function disconnectFacsimileTooltips() {
  for (let i=0; i<tooltipTargets.length; i++) {
    tooltipTargets[i].off("mouseenter");
  }
}

// connecting transcription and facsimile
async function connectFacsimileTooltips() {
  if (!$("#display-facsimile").is(':checked')) {
    return;
  }

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
      let target = $("#" + xmlId);
      tooltipTargets.push(target);
      target.mouseenter(function(e) {
        $("<img class='tooltip' src='" + imageApiUri + "' />").appendTo("#tooltips");
        positionAtMouse($("#tooltips"), e);
      }).mouseleave(function() {
        $("#tooltips").empty();
      });
    }
  });
}

function reconnectFacsimileTooltips() {
  disconnectFacsimileTooltips();
  connectFacsimileTooltips();
}

$(document).ready(async function() {
  adjustToBBox($('#score-view').find('svg'));

  $("#player").midiPlayer({
      onUpdate: midiUpdate
  });
  const piece = 'data:audio/midi;base64,' + midi;
  $("#player").show();
  $("#player").midiPlayer.load(piece);

  // ------
  // view controls
  // ------

  $("#staves-below").change(function() {
    currentParams.below = $(this).val();
  });

  $("#staves-above").change(function() {
    currentParams.above = $(this).val();
  });

  $("#modern-clefs").change(function() {
    currentParams.modernClefs = this.checked;
  });

  $("#update-page").click(updatePage);

  $("#display-facsimile").change(function() {
    if ($(this).is(':checked')) {
      connectFacsimileTooltips();
    } else {
      disconnectFacsimileTooltips();
    }
  });

  $("#facsimile-size").change(function() {
    if ($("#display-facsimile").is(':checked')) {
      reconnectFacsimileTooltips();
    }
  });

  $("#facsimile-quality").change(function() {
    if ($("#display-facsimile").is(':checked')) {
      reconnectFacsimileTooltips();
    }
  });

  $(".pdf-download").click(function() {
    window.location += '/pdf';
  });

  $("#options-control").click(function() {
    $("#contents-table").hide();
    $("#options-table").addClass("visible-table").show();
  });

  $("#contents-control").click(function() {
    $("#options-table").hide();
    $("#contents-table").addClass("visible-table").show();
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

$(document).on("touchstart mousemove", function(e) {
    const container = $("#controls");

    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0)
    {
        $(".controls-table").hide();
    }
});
