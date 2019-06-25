currentParams = {
  page: 1,
  nr: 1,
  display: [],
  modernClefs: false,
  emptyStaffsBelow: 0,
  emptyStaffsAbove: 0,
  lang: "de",
  exportFormat: "pdf"
};

// ------
// Helper functions
// ------

function printError(message) {
  $("#error").text(message);
  $("#error").show().fadeOut("slow");
}

function highlight(selector) {
  var element = $(selector);
  if (element.length == 0) {
    currentParams.page = parseInt(currentParams.page, 10) + 1;
    updateView(function() {
      highlight(selector);
    });
    return;
  }
  element.addClass("highlight");
  setTimeout(function () {
    $(element).removeClass('highlight');
  }, 3000);
}

function getSvgElementBoxAsCss(target) {
  var targetTop = target.offset().top;
  var targetLeft = target.offset().left;
  var targetWidth = target[0].getBoundingClientRect().width-6;
  var targetHeight = target[0].getBoundingClientRect().height;
  return {
        top: targetTop,
        left: targetLeft,
        width: targetWidth,
        height: targetHeight
  };
}

// ------
// MIDI player
// ------

var midiTimemap = {};
var midiData = {};

var midiUpdate = function(time) {
  // TODO look up time in midiTimemap
  //for (event of midiTimemap) {
  //  if (event.tstamp === time) {
  //    var onsets = event.on;
  //    if (onsets) {
  //      for (var i=0; i<onsets.length; i++) {
  //        $("svg").find("#" + onsets[i]).attr("fill", "#c00").attr("stroke", "#c00");
  //      }
  //    }
  //    break;
  //  }
  //}
}
var midiStop = function() {
  console.log("Stop");
}

function playMIDI() {
   var piece = 'data:audio/midi;base64,' + midiData;
   $("#player").show();
   $("#player").midiPlayer.play(piece);
}


// ------
// update view functions
// ------

let staffLabels = {
  "mattheson": "Matthson's annotations",
  "basse-fondamentale": "<i>basse fondamentale</i> (Rameau)",
  "fundamental-notes": "<i>Grund-Noten</i> (Mattheson)",
  "pfeffer": "by Niels Pfeffer"
};

function displayCheckboxes(block, group) {
  if (block) {
    for (var i=0; i<block.length; i++) {
      var blockName = block[i];
      $("#" + group).append('<br/>');
      
      $('<input type="checkbox" id="' + blockName + '" autocomplete="off">').appendTo("#" + group).change(function() {
        if ($(this).is(':checked')) {
          currentParams.display.push($(this).attr("id"));
        } else {
          currentParams.display.splice($.inArray($(this).attr("id"), currentParams.display), 1);
        }
        updateView();
      });
      $("#" + blockName)[0].checked = currentParams.display.includes(blockName);
      $("#" + group).append('<label for="' + blockName + '">' + staffLabels[blockName] + '</label>');
    }
  }
}

async function updateDescription() {
  let data;
  
  try {
    data = await $.get("description?nr=" + currentParams.nr);
  } catch (error) {
    printError("failed loading description: " + error);
  }
  
  $("#realizations").empty();
  $("#analysis").empty();
  $("#available-annotations").empty();
  
  var realizations = data.realizations;
  var analysis = data.analysis;
  var annotations = data.annotations;
  
  displayCheckboxes(realizations, "realizations");
  displayCheckboxes(analysis, "analysis");
  
  
  if (annotations) {
    $("#available-annotations").append('<select id="lang" name="lang" autocomplete="off">');
    for (var i=0; i<annotations.length; i++) {
      if (annotations[i] == "de") {
        $("#lang").append('<option value="de">Deutsch (second edition, Hamburg 1731)</option>');
      } else if (annotations[i] == "en") {
        $("#lang").append('<option value="en">English (second edition)</option>');
      } else if (annotations[i] == "facsimile") {
        $("#lang").append('<option value="facsimile">Facsimile (second edition)</option>');
      } else if (annotations[i] == "1st") {
        $("#lang").append('<option value="1st">Deutsch (first edition, Hamburg 1719)</option>');
      } else if (annotations[i] == "comments") {
        $("#lang").append('<option value="comments">Comments</option>');
      }
    }
    $("#available-annotations").append('</select>');
    
    $("option[value='" + annotations[0] + "']")[0].selected = true;
    currentParams.lang = annotations[0];
    
    $("#lang").change(function() {
      currentParams.lang = $(this).val();
      updateAnnotations();
      renderCurrentPage();
    });
  }
}

async function updateAnnotations() {
  let data;
  
  try {
    data = await $.get("annotations?" + $.param({nr: currentParams.nr, lang: currentParams.lang}));
  } catch (error) {
    printError("failed updating annotations: " + error);
  }
  
  var cetei = new CETEI();
  cetei.domToHTML5(data, function(html) {
    $("#annotations-view").html(html);
  });
  
  // load the music examples subsequently
  $("tei-notatedmusic").each(async function() {
    var notatedmusic = $(this);
    let svg;
    
    try {
      svg = await $.get("music-example?" + $.param({
        nr: currentParams.nr,
        filename: $(this).find("tei-ptr").attr("target"),
        modernClefs: currentParams.modernClefs
      }));
    } catch (error) {
      printError("failed loading embedded music example: " + error);
    }
    
    notatedmusic.find("tei-ptr").replaceWith(svg);
    
    var svg1 = notatedmusic.find("svg")[1];
    var svgDiv = notatedmusic.find("svg")[0];
    var bb=svg1.getBBox();
    var bbx=bb.x;
    var bby=bb.y;
    var bbw=bb.width;
    var bbh=bb.height;
    svg1.setAttribute("viewBox", [bbx,bby,bbw,bbh].join(" ") );
    svgDiv.style.width=(bbw/1000)*28.34;
    svgDiv.style.height=(bbh/1000)*28.34;
  });
}

async function renderCurrentPage() {
  let response;
  
  try {
    response = await $.get("render?" + $.param(currentParams));
  } catch (error) {
    printError("failed rendering page: " + error);
  }
  
  if (currentParams.page > response.pageCount) {
    currentParams.page = 1;
    updateView();
    return;
  }
  
  midiTimemap = response.timemap;
  midiData = response.midi;
  
  var svg = response.svg;
  
  $("#score-view").html(svg);
}

function connectReferences() {
  $(".indicator").remove();
  
  $("tei-ref").each(function() {
    // connect text with an indicator
    $(this).find("a").click(function(e) {
      e.preventDefault();
      highlight(".indicator[data-ref='" + ref + "']");
    });
    
    // find target in SVG and underlay it colorfully
    var ref = $(this).attr("target");
    
    target = $("#score-view svg").find("#" + ref);
    if (target.length === 0) {
      console.log("corresponding SVG element for ref=" + ref + " not found on this page.");
      return true; // nothing found, continue with next reference
    }
    $("<div class='indicator' data-ref='" + ref + "'></div>").appendTo("body").css(getSvgElementBoxAsCss(target)).click(function() {
      // scroll to reference point and then highlight it
      var refSelector = "tei-ref[target='" + $(this).attr("data-ref") + "']";
      referencePoint = $(refSelector);
      annotationView = $("annotations-view")
      $("#annotations-view").animate({
          scrollTop: referencePoint.offset().top - $("#annotations-view").offset().top + $("#annotations-view").scrollTop()
      }, 100, function() {
        highlight(refSelector);
      });
    });
  });
}

function connectTooltips() {
  $(".tooltip").remove();
  
  var keySig = $("#score-view svg").find(".keySig");
  if (keySig.length != 0) {
    var keySigAnnotation = $("tei-note[type='on-key-signature'] span[data-original='']");
    
    $("<div class='tooltip' id='key-signature-tooltip'></div>").appendTo("body").css(getSvgElementBoxAsCss(keySig)).tooltip({
      content: keySigAnnotation.text(),
      items: "#key-signature-tooltip",
      classes: {
        "ui-tooltip": "tooltip-text"
      }
    });
    
    keySigAnnotation.parent().remove();
  }
  
  
  var meterSig = $("svg").find(".meterSig");
  if (meterSig.length != 0) {
    var meterSigAnnotation = $("tei-note[type='on-meter'] span[data-original='']");
    
    $("<div class='tooltip' id='meter-signature-tooltip'></div>").appendTo("body").css(getSvgElementBoxAsCss(meterSig)).tooltip({
      content: meterSigAnnotation.text(),
      items: "#meter-signature-tooltip",
      classes: {
        "ui-tooltip": "tooltip-text"
      }
    });
    
    meterSigAnnotation.parent().remove();
  }
}

async function updateView() {
  if (currentParams.page < 1) {
    currentParams.page = 1;
  }
  
  await updateDescription()
  await updateAnnotations();
  await renderCurrentPage();
  connectReferences();
  connectTooltips();
}

$(document).ready(function() {
  
  $("#player").midiPlayer({
      onUpdate: midiUpdate,
      onStop: midiStop,
      width: 150
  });
  
  // ------
  // view controls
  // ------
  
  $("#nr").change(function() {
    currentParams.nr = $(this).val();
    currentParams.page = 1;
    updateView();
  });
  
  $("#staves-below").change(function() {
    currentParams.emptyStaffsBelow = $(this).val();
    updateView();
  });
  
  $("#staves-above").change(function() {
    currentParams.emptyStaffsAbove = $(this).val();
    updateView();
  });
  
  $("#previous-page").click(function() {
    currentParams.page = parseInt(currentParams.page, 10) - 1;
    updateView();
  });
  
  $("#next-page").click(function() {
    currentParams.page = parseInt(currentParams.page, 10) + 1;
    updateView();
  });
  
  
  $("#modern-clefs").change(function() {
    currentParams.modernClefs = $(this).is(':checked');
     // clefs in the music examples of the annotations should be updated as well
    updateAnnotations();
    renderCurrentPage();
  });
  
  $("#export").click(function() {
    currentParams.exportFormat = $("#export-format").val();
    window.open("/download?" + $.param(currentParams), "about:blank");
  });
  
  $("#midiPlayer_play").click(function() {
    playMIDI();
  });

  updateView();
});
