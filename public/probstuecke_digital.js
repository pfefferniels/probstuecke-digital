currentParams = {
  page: 1,
  nr: 1,
  showRealizedAnnotations: false,
  basseFondamentale: false,
  decolorizedBass: false,
  exampleRealization1: false,
  modernClefs: false,
  hideVariants: true,
  emptyStaffsBelow: 0,
  emptyStaffsAbove: 0,
  lang: "de",
  exportFormat: "pdf"
};

currentPage = 1;

$(document).ready(function() {
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
     var song = 'data:audio/midi;base64,' + midiData;
     $("#player").show();
     $("#player").midiPlayer.play(song);
  }
  
  $("#player").midiPlayer({
      onUpdate: midiUpdate,
      onStop: midiStop,
      width: 150
  });
  
  // -------
  // the monumental update view function
  // -------
  
  function updateView(onFinish) {
    if (currentParams.page < 1) {
      currentParams.page = 1;
    }
    
    $.get("annotations?" + $.param({
      nr: currentParams.nr,
      lang: currentParams.lang
    }), function(data) {
      var cetei = new CETEI();
      cetei.domToHTML5(data, function(html) {
        $("#annotations-view").html(html);
      });
    }).fail(function() {
      printError("failed loading annotations");
    });
    
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
        
      $(".indicator").remove();
      $(".tooltip").remove();
      
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
          svg2.setAttribute("viewBox", "0 0 21000 " + Math.floor(height*60));
          svg1.style.height = height;
        });
      });
      
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
      
      if (typeof onFinish === "function") {
        onFinish();
      }
    }).fail(function() {
      printError("failed loading SVG");
    });
  }
  
  
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
  
  
  $("#lang").change(function() {
    currentParams.lang = $(this).val();
    updateView();
  });
  
  $("#show-realized-annotations").change(function() {
    console.log($(this).val());
    currentParams.showRealizedAnnotations = $(this).is(':checked');
    updateView();
  });
  
  $("#modern-clefs").change(function() {
    currentParams.modernClefs = $(this).is(':checked');
    updateView();
  });
  
  $("#basse-fondamentale").change(function() {
    currentParams.basseFondamentale = $(this).is(':checked');
    updateView();
  });
  
  $("#example-realization-1").change(function() {
    currentParams.exampleRealization1 = $(this).is(':checked');
    updateView();
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
