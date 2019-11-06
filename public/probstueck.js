var currentParams = {
  nr: number,
  page: 1,
  display: [],
  modernClefs: false,
  emptyStaffsBelow: 0,
  emptyStaffsAbove: 0,
  lang: "de",
  exportFormat: "pdf"
};

const cetei = new CETEI();

// ------
// Helper functions
// ------


// TEMPORARY
function copyToClipboard(text) {
  if (!navigator.clipboard) {
    printError("no fallback");
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    //printInfo('Async: Copying to clipboard was successful!');
  }, function(err) {
    printError('Async: Could not copy text: ', err);
  });
}

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

async function highlight(element) {
  if (element.length == 0) {
    currentParams.page += 1;
    await updateView(true);
    highlight(element);
    return;
  }
  element.addClass("highlight");
  setTimeout(function () {
    $(element).removeClass('highlight');
  }, 3000);
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

var midiTimemap = {};
var midiData = {};

const midiUpdate = function(time) {
  // TODO time and the tstamps from midiTimemap are not identical.
  // An approximate lookup would be necessary.
}

// ------
// update view functions
// ------

const staffLabels = {
  "mattheson": "Matthson's annotations",
  "basse-fondamentale": "<i>basse fondamentale</i> (Rameau)",
  "fundamental-notes": "<i>Grund-Noten</i> (Mattheson)",
  "pfeffer": "by Niels Pfeffer"
};

function displayCheckboxes(block, group) {
  if (block) {
    $("#" + group).append("<h1>" + group + "</h1>");
    for (var i=0; i<block.length; i++) {
      const blockName = block[i];
      if (i!=0) {
        $("#" + group).append('<br />');
      }

      $('<input type="checkbox" id="' + blockName + '" autocomplete="off">').appendTo("#" + group).change(function() {
        if ($(this).is(':checked')) {
          currentParams.display.push($(this).attr("id"));
        } else {
          currentParams.display.splice($.inArray($(this).attr("id"), currentParams.display), 1);
        }
        updateView(true);
      });
      $("#" + blockName)[0].checked = currentParams.display.includes(blockName);
      $("#" + group).append('<label for="' + blockName + '">' + staffLabels[blockName] + '</label>');
    }
  }
}

async function updateDescription() {
  let data;

  $("#realizations").empty();
  $("#analysis").empty();
  $("#available-annotations").empty();

  try {
    data = await $.get("description?nr=" + number);
  } catch (error) {
    $("#options-table").text("failed loading description: " + error.status + " " + error.statusText);
    return;
  }

  const realizations = data.realizations;
  const analysis = data.analysis;
  const annotations = data.annotations;

  displayCheckboxes(realizations, "realizations");
  displayCheckboxes(analysis, "analysis");


  if (annotations) {
    $("#available-annotations").append('<h1>annotations</h1>');
    $("#available-annotations").append('<select id="lang" name="lang" autocomplete="off">');
    for (var i=0; i<annotations.length; i++) {
      if (annotations[i] == "de") {
        $("#lang").append('<option value="de">German (second edition, Hamburg 1731)</option>');
      } else if (annotations[i] == "en") {
        $("#lang").append('<option value="en">English (second edition)</option>');
      } else if (annotations[i] == "1st") {
        $("#lang").append('<option value="1st">German (first edition, Hamburg 1719)</option>');
      } else if (annotations[i] == "comments") {
        $("#lang").append('<option value="comments">Comments</option>');
      }
    }
    $("#available-annotations").append('</select>');

    $("option[value='" + annotations[0] + "']")[0].selected = true;
    currentParams.lang = annotations[0];

    $("#lang").change(async function() {
      currentParams.lang = $(this).val();
      updateView(false);
    });
  }
}

async function updateAnnotations() {
  $("#annotations-view").html("<center>loading ...</center>");

  let data;

  try {
    data = await $.get("annotations?" + $.param({nr: number, lang: currentParams.lang}));
  } catch (error) {
    $("#annotations-view").text("failed loading annotations: " + error.status + " " + error.statusText);
  }

  cetei.domToHTML5(data, function(html) {
    $("#annotations-view").html(html);
    $("#annotations-view tei-facsimile img").hide();
  });


  // load the music examples, if there are any

  var notatedMusicPromises = [];
  $("tei-notatedmusic").each(async function() {
    var dfd = $.Deferred();
    notatedMusicPromises.push(dfd);

    var notatedmusic = $(this);
    let svg;
    try {
      svg = await $.get("music-example?" + $.param({
        nr: number,
        filename: $(this).find("tei-ptr").attr("target"),
        modernClefs: currentParams.modernClefs
      }));

    } catch (error) {
      printError("failed loading embedded music example: " + error);
    }

    notatedmusic.find("tei-ptr").replaceWith(svg);

    let svg1 = notatedmusic.find("svg")[1];
    const bb = svg1.getBBox();
    const bbw = bb.width;
    const bbh = bb.height;
    svg1.setAttribute("viewBox", [bb.x,bb.y,bbw,bbh].join(" "));

    let svg0 = notatedmusic.find("svg");
    svg0.css({
      width: (bbw/1000)*28.34 + "px",
      height: (bbh/1000)*28.34 + "px"
    });

    // on smaller screen sizes, the svg might too wide.
    var normalParagraph = notatedmusic.parent().find("tei-p");
    if (svg0.width() > normalParagraph.width()) {
      svg0.attr("width", normalParagraph.width());
    }
    dfd.resolve();
  });

  // make sure that loading the annotations is done only when all
  // the notatedMusic elements are resolved.
  await Promise.all(notatedMusicPromises);
}

async function renderCurrentPage() {
  $("#score-view").html("<center>loading ...</center>");

  let response;
  try {
    response = await $.get("render?" + $.param(currentParams));
  } catch (error) {
    $("#score-view").text("failed rendering page: " + error.status + " " + error.statusText);
    return;
  }

  if (currentParams.page > response.pageCount) {
    currentParams.page = 1;
    updateView(false);
    return;
  }

  midiTimemap = response.timemap;
  midiData = response.midi;
  const piece = 'data:audio/midi;base64,' + midiData;
  $("#player").show();
  $("#player").midiPlayer.load(piece);

  $("#score-view").html(response.svg);
}

function reconnectCrossRefs() {
  $("tei-ref").each(function() {
    // find target in SVG
    let targetAttr = $(this).attr("target");
    let target = $("svg").find("#" + targetAttr);
    let teiRef = $(this);
    if (target.length === 0) {
      console.log("corresponding SVG element not found on this page.");
      // In case the user clicks on a reference that is not found in the current SVG,
      // we have to look it up in one of the following pages
      $(this).find("a").off("click").click(async function(e) {
        e.preventDefault();
        currentParams.page += 1;
        await updateScoreView();
        setTimeout(function() {
          $("body").find("tei-ref[target='" + targetAttr + "'] a").trigger("click");
        }, 900);
      });
      return true;
    }

    // highlight the target
    var svg = SVG.get(targetAttr);
    let bbox = svg.bbox();
    let rect = svg.rect(bbox.width,bbox.height).
                   move(bbox.x,bbox.y).
                   fill("#ffe47a").
                   attr("class", "indicator mark_" + targetAttr).
                   back();


    // connect indicator with text
    rect.click(async function() {
      // TODO the same measure might be referenced multiple times. Make sure that in case of a click
      // they other indicators be triggered as well.


      // scroll to reference point and then highlight it
      // portrait mode
      if(window.innerHeight > window.innerWidth) {
        $("html,body").animate({
          scrollTop: teiRef.offset().top-50
        }, 100, function() {
          highlight(teiRef);
        });
      }

      // landscape mode
      if(window.innerWidth > window.innerHeight){
        var annotationView = $("#annotations-view");
        annotationView.animate({
            scrollTop: teiRef.offset().top - annotationView.offset().top + annotationView.scrollTop()
        }, 100, function() {
          highlight(teiRef);
        });
      }
    });


    // connect text with an indicator
    $(this).find("a").off("click").click(function(e) {
      e.preventDefault();

      if (window.innerHeight > window.innerWidth) {
        $("html,body").animate({scrollTop: 0}, 100);
      }

      rect.animate(500).attr({fill: "#ffaa99"}).animate().attr({fill: "#ffe47a"});
    });
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

// connecting key and meter signature with annotations
function connectSignatureTooltips() {
  cleanUpTooltips();

  if (currentParams.page != 1) {
    return;
  }

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

function disconnectFacsimileTooltips() {
  $("tei-zone").each(function() {
    $("body").find($(this).attr("corresp")).each(function() {
      $(this).off("mouseenter");
    });
  });
}

// connecting transcription and facsimile
async function connectFacsimileTooltips() {
  if (!$("#show-tooltips").is(':checked')) {
    return;
  }

  let iiif;
  try {
    iiif = await $.get("iiif/" + number + "/list/" + "facsimile_de");
  } catch(e) {
    printError("Could not loud IIIF AnnotationList");
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
    let imageApiUri = [
      "https://api.digitale-sammlungen.de/iiif/image/v2",
      (identifier + '_' + scan),
      xywhParam,
      "full",
      "0",
      "default.jpg"].join("/"); // here we might define gray or color according to the
                                // users choice.

    // extract what is actually annotating the canvas region
    let rTarget = r.resource["@id"];

    // presuming that the XPath inside xpointer() is always following the same scheme
    let targetMatch = rTarget.match(/xml:id='(.+)'\]/);
    let xmlId = targetMatch[1];
    if (xmlId) {
      var target = $("#" + xmlId);
      target.mouseenter(function(e) {
        $("<img class='tooltip' src='" + imageApiUri + "' />").appendTo("#tooltips");
        positionAtMouse($("#tooltips"), e);
      }).mouseleave(function() {
        $("#tooltips").empty();
      });
    }
  });

  // temporary code for allowing faster MEI editing
  $("svg").find(".measure").on("click", function() {
    copyToClipboard("#" + $(this).attr("id"));
    printError("copied to clipboard");
  });
}

async function updateView(resetting) {
  if (currentParams.page < 1) {
    currentParams.page = 1;
  }

  if (resetting) {
    await updateDescription();
  }
  await Promise.all([renderCurrentPage(),updateAnnotations()]);

  reconnectCrossRefs();
  connectSignatureTooltips();
}

async function updateScoreView() {
  await renderCurrentPage();
  reconnectCrossRefs();
  connectSignatureTooltips();
  connectFacsimileTooltips();
}

$(document).ready(function() {
  $("#player").midiPlayer({
      onUpdate: midiUpdate
  });

  // ------
  // view controls
  // ------

  $("#nr").change(function() {
    number = $(this).val();
    currentParams.page = 1;
    updateView(true);
  });

  $("#staves-below").change(function() {
    currentParams.emptyStaffsBelow = $(this).val();
    updateScoreView();
  });

  $("#staves-above").change(function() {
    currentParams.emptyStaffsAbove = $(this).val();
    updateScoreView();
  });

  $("#show-fb").change(function() {
    $("#score-view svg").find(".fb").toggle($(this).is(':checked'));
  });

  $("#show-tooltips").change(function() {
    if ($(this).is(':checked')) {
      connectFacsimileTooltips();
    } else {
      disconnectFacsimileTooltips();
    }
  });

  $("#previous-page").click(function() {
    if (currentParams.page == 1) {
      printInfo("Already on first page.");
      return;
    }
    currentParams.page -= 1;
    updateScoreView();
  });

  $("#next-page").click(function() {
    currentParams.page += 1;
    updateScoreView();
  });

  $("#modern-clefs").change(function() {
    currentParams.modernClefs = $(this).is(':checked');
    // a change in the cleffing may also affect examples in the annotations,
    // therefore a complete update is performed.
    updateView(false);
  });

  $(".pdf-download").click(function() {
    currentParams.exportFormat = "pdf";
    window.open("/download?" + $.param(currentParams), "about:blank");
  });

  $("#options-control").click(function() {
    $("#contents-table").hide();
    $("#options-table").addClass("visible-table").show();
  });

  $("#contents-control").click(function() {
    $("#options-table").hide();
    $("#contents-table").addClass("visible-table").show();
  });

  updateView(true);
});

$(document).on("touchstart mousemove", function(e) {
    const container = $("#controls");

    // if the target of the click isn't the container nor a descendant of the container
    if (!container.is(e.target) && container.has(e.target).length === 0)
    {
        $(".controls-table").hide();
    }
});
