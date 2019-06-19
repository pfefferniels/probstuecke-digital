currentParams = {
  page: 1,
  nr: 1,
  showRealizedAnnotations: false,
  basseFondamentale: false,
  decolorizedBass: false,
  exampleRealization: -1,
  modernClefs: false,
  hideVariants: true,
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
  console.log("trying to highlight " + selector);
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

function updateDescription() {
  $.get("description?nr=" + currentParams.nr, function(data) {
    $("#realizations").empty();
    $("#analysis").empty();
    $("#available-annotations").empty();
    
    var realizations = data.realizations;
    var analysis = data.analysis;
    var annotations = data.annotations;
    
    if (realizations) {
      for (var i=0; i<realizations.length; i++) {
        $("#realizations").append('<br/>');
        $("#realizations").append('<input type="checkbox" id="example-realization-' + i + '" autocomplete="off">');
        $("#realizations").append('<label for="example-realization-' + i + '"> by ' + realizations[i] + '</label>');
        
        if (i == currentParams.exampleRealization) {
          $("#example-realization-" + i)[0].checked = true;
        }
        $("#example-realization-" + i).change(function() {
          if ($(this).is(':checked')) {
            currentParams.exampleRealization = i;
            console.log("currentParams.exampleRealization=" + currentParams.exampleRealization);
          } else {
            currentParams.exampleRealization = -1;
          }
          updateAnnotations();
          renderCurrentPage();
        });
      }
    }
    
    if (analysis) {
      for (var i=0; i<analysis.length; i++) {
        $("#analysis").append('<br/>');
        $("#analysis").append('<input type="checkbox" id="' + analysis[i] + '" autocomplete="off">');
        $("#analysis").append('<label for="' + analysis[i] + '">' + analysis[i] + '</label>');
      }
      
      $("#basse-fondamentale")[0].checked = currentParams.basseFondamentale;
      $("#basse-fondamentale").change(function() {
        currentParams.basseFondamentale = $(this).is(':checked');
        updateAnnotations();
        renderCurrentPage();
      });
    }
    
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
      
      $("option[value='" + currentParams.lang + "']")[0].selected = true;
      $("#lang").change(function() {
        currentParams.lang = $(this).val();
        updateAnnotations();
        renderCurrentPage();
      });
    }
    
  }).fail(function() {
    printError("failed loading description");
  });
}

function updateAnnotations() {
  $.get("annotations?" + $.param({
    nr: currentParams.nr,
    lang: currentParams.lang
  }), function(data) {
    var cetei = new CETEI();
    cetei.domToHTML5(data, function(html) {
      $("#annotations-view").html(html);
    });
    
    // load the music examples subsequently
    $("tei-notatedmusic").each(function() {
      var notatedmusic = $(this);
      $.get("music-example?" + $.param({
        nr: currentParams.nr,
        filename: $(this).find("tei-ptr").attr("target"),
        modernClefs: currentParams.modernClefs
      }), function(svg) {
        notatedmusic.find("tei-ptr").replaceWith(svg);
        
        // TODO: this is quite hacky ...
        var svg1 = notatedmusic.find("svg")[0];
        var svg2 = notatedmusic.find("svg")[1];
        var height = svg1.getBBox().height;
        svg2.setAttribute("viewBox", "0 0 21000 " + Math.floor(height*65));
        svg1.style.height = height;
      });
    });
    
  }).fail(function() {
    printError("failed loading annotations");
  });
}

function renderCurrentPage(onFinish) {
  $.get("render?" + $.param(currentParams), function(response) {
    if (currentParams.page > response.pageCount) {
      currentParams.page = 1;
      updateView();
      return;
    }
    
    midiTimemap = response.timemap;
    midiData = response.midi;
    
    var svg = response.svg;
    
    $("#score-view").html(svg);
    
    connectReferences();
    connectTooltips();
    
    if (typeof onFinish === "function") {
      onFinish();
    }
  }).fail(function() {
    printError("failed loading SVG");
  });
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
    
    target = $("svg").find("#" + ref);
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
  
  var keySig = $("svg").find(".keySig");
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

function updateView(onFinish) {
  if (currentParams.page < 1) {
    currentParams.page = 1;
  }
  
  updateDescription();
  updateAnnotations();
  renderCurrentPage(onFinish);
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
    updateAnnotations();
    renderCurrentPage();
  });
  
  $("#staves-above").change(function() {
    currentParams.emptyStaffsAbove = $(this).val();
    updateAnnotations();
    renderCurrentPage();
  });
  
  $("#previous-page").click(function() {
    currentParams.page = parseInt(currentParams.page, 10) - 1;
    updateAnnotations();
    renderCurrentPage();
  });
  
  $("#next-page").click(function() {
    currentParams.page = parseInt(currentParams.page, 10) + 1;
    updateAnnotations();
    renderCurrentPage();
  });
  
  
  $("#show-realized-annotations").change(function() {
    console.log($(this).val());
    currentParams.showRealizedAnnotations = $(this).is(':checked');
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
