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


// TEMPORARY
function copyToClipboard(text) {
  if (!navigator.clipboard) {
    printError("no fallback");
    //fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    //printError('Async: Copying to clipboard was successful!');
  }, function(err) {
    printError('Async: Could not copy text: ', err);
  });
}

function printError(message) {
  $("#error").text(message);
  $("#error").show().fadeOut("slow");
}

async function highlight(selector) {
  var element = $(selector);
  if (element.length == 0) {
    currentParams.page = parseInt(currentParams.page, 10) + 1;
    await updateView(true);
    highlight(selector);
    return;
  }
  element.addClass("highlight");
  setTimeout(function () {
    $(element).removeClass('highlight');
  }, 3000);
}

function getSvgElementBoxAsCss(target) {
  var bRect = target[0].getBoundingClientRect();
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

var midiUpdate = function(time) {
  // TODO look up time in midiTimemap
  for (event of midiTimemap) {
    if (event.tstamp === time) {
      var onsets = event.on;
      if (onsets) {
        for (var i=0; i<onsets.length; i++) {
          $("svg").find("#" + onsets[i]).attr("fill", "#c00").attr("stroke", "#c00");
        }
      }
      break;
    }
  }
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
      //} else if (annotations[i] == "facsimile") {
      //  $("#lang").append('<option value="facsimile">Facsimile (second edition)</option>');
      } else if (annotations[i] == "en") {
        $("#lang").append('<option value="en">English (second edition)</option>');
      } else if (annotations[i] == "1st") {
        $("#lang").append('<option value="1st">Deutsch (first edition, Hamburg 1719)</option>');
      } else if (annotations[i] == "comments") {
        $("#lang").append('<option value="comments">Comments</option>');
      }
    }
    $("#available-annotations").append('</select>');
    
    $("option[value='" + annotations[0] + "']")[0].selected = true;
    currentParams.lang = annotations[0];
    
    $("#lang").change(async function() {
      currentParams.lang = $(this).val();
      await Promise.all([updateAnnotations(), renderCurrentPage()]);
      connectReferences();
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
    $("#annotations-view tei-facsimile img").hide();
  });
  

  // load the music examples, if there are any
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
    var bb=svg1.getBBox();
    var bbw=bb.width;
    var bbh=bb.height;
    svg1.setAttribute("viewBox", [bb.x,bb.y,bbw,bbh].join(" "));
    notatedmusic.find("svg").css({
      width: (bbw/1000)*28.34 + "px",
      height: (bbh/1000)*28.34 + "px"
    });
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
    updateView(false);
    return;
  }
  
  midiTimemap = response.timemap;
  midiData = response.midi;
  var piece = 'data:audio/midi;base64,' + midiData;
  $("#player").show();
  $("#player").midiPlayer.load(piece);
  
  var svg = response.svg;
  
  $("#score-view").html(svg);
}

function connectReferences() {
  $(".indicator").remove();
  
  // -----
  // referencing annotations and score
  // -----
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
  if (!$("#show-tooltips").is(":checked")) {
    return;
  }
  
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
  
  // ----
  // connecting transcription and facsimile
  // ----
  $("tei-body").find("tei-graphic img").on("load", function() {
    let surface = $(this).parent().parent();
    let zoom = $(this)[0].width / surface.attr("lrx");
    let url = $(this).attr("src");
    
    surface.children("tei-zone").each(function() {
      var zone = $(this);
      let ulx = zone.attr("ulx");
      let uly = zone.attr("uly");
      let lrx = zone.attr("lrx");
      let lry = zone.attr("lry");
  
      var corresp = $(this).attr("corresp");
      var prevCorresp = $(this).prev().attr("corresp");
      var target = $("body").find(corresp);
      if (target.length > 0) {
        target.mouseenter(function(e) {
          if (prevCorresp != corresp) {
            $("#facsimile-tooltips").css({
              position: "absolute",
              top: e.pageY+5,
              left: e.pageX+5
            });
          } else {
            $("<div class='system-break'>⤶</div>").appendTo("#facsimile-tooltips");
          }
          var facsWidth = lrx-ulx;
          var facsHeight = lry-uly;
          $("<div class='facsimile-tooltip' />").css({
            backgroundImage: "url(" + url + ")",
            backgroundPosition: (-ulx) + "px " + (-uly) + "px",
            width: facsWidth,
            height: facsHeight
          }).appendTo("#facsimile-tooltips");
          
          if (e.pageX+facsWidth*0.6 > $(window).width()) {
            $("#facsimile-tooltips").css({
              left: e.pageX-facsWidth*0.6-20
            });
          }
          if (e.pageY+facsHeight*0.6 > $(window).height()) {
            $("#facsimile-tooltips").css({
              top: e.pageY-facsHeight*0.6-20
            });
          }
          
          $(this).children().css('fill', "#6F216C");
        }).mouseleave(function() {
          $("#facsimile-tooltips").empty();
          $(this).children().css('fill', "black");
        });
      }
    });
  }).each(function() {
    if(this.complete) { $(this).trigger('load'); }
  });
  
  
  // temporary code for allowing faster MEI editing
  //console.log("removing indicators");
  //$(".indicator").remove();
  //console.log("measures found:" + $("#score-view svg").find(".measure").length);
  //$("#score-view svg").find(".measure").on("click", function() {
  //  copyToClipboard("#" + $(this).attr("id"));
  //  printError("copied to clipboard");
  //});
  //  
  //meiStrings = [];
  //$("#score-view svg").find(".note, .rest").one("click", function() {
  //  console.log(meiStrings);
  //  let id = $(this).attr("id");
  //  printError("note " + id + " recognized");
  //  $("#copyright").empty();
  //  $("#copyright").append("<input type='text' id='figures'>");
  //  $("#figures").focus();
  //  $('#figures').keypress(function (e) {
  //    if (e.which == 13) {
  //      var figures = $(this).val().replace("b", "♭").replace("6/", "6⃥").replace("n", "♮").split(",");
  //      var meiString = "<harm place='above' staff='2' startid='" + id + "'><fb>";
  //      for (var i=0; i<figures.length; i++) {
  //        meiString += "<f>" + figures[i] + "</f>";
  //      }
  //      meiString +="</fb></harm>";
  //      meiStrings.push(meiString);
  //      printError("added");
  //      $(this).val("");
  //      return false;
  //    }
  //  });
  //  $("<button>copy to clipboard</button>").on("click", function() {
  //    copyToClipboard(meiStrings.join("\n"));
  //    printError("copied to clipboard");
  //    meiStrings = [];
  //  }).appendTo("#copyright");
  //});
  
}

async function updateView(resetting) {
  if (currentParams.page < 1) {
    currentParams.page = 1;
  }
  
  if (resetting) {
    await updateDescription();
  }
  await Promise.all([renderCurrentPage(),updateAnnotations()]);
  
  connectReferences();
  connectTooltips();
}

$(document).ready(function() {
  
  $("#player").midiPlayer({
      onUpdate: midiUpdate,
      width: 150
  });
  
  // ------
  // view controls
  // ------
  
  $("#nr").change(function() {
    currentParams.nr = $(this).val();
    currentParams.page = 1;
    updateView(true);
  });
  
  $("#staves-below").change(function() {
    currentParams.emptyStaffsBelow = $(this).val();
    updateView(false);
  });
  
  $("#staves-above").change(function() {
    currentParams.emptyStaffsAbove = $(this).val();
    updateView(false);
  });
  
  $("#show-fb").change(function() {
    $("#score-view svg").find(".fb").toggle($(this).is(':checked'));
  });
  
  $("#show-tooltips").change(function() {
    updateView(false);
  });
  
  $("#previous-page").click(function() {
    currentParams.page = parseInt(currentParams.page, 10) - 1;
    updateView(false);
  });
  
  $("#next-page").click(function() {
    currentParams.page = parseInt(currentParams.page, 10) + 1;
    updateView(false);
  });
  
  $("#modern-clefs").change(function() {
    currentParams.modernClefs = $(this).is(':checked');
    updateView(false);
  });
  
  $("#export").click(function() {
    currentParams.exportFormat = $("#export-format").val();
    window.open("/download?" + $.param(currentParams), "about:blank");
  });
  
  //$("#show-options").click(function(e) {
  //  e.preventDefault();
  //  $("#controls-table").show();
  //  $("#hide-options").show().click(function(e) {
  //    e.preventDefault();
  //    $(this).hide();
  //    $("#controls-table").hide();
  //    $("#show-options").show();
  //  });
  //  $(this).hide();
  //});
  
  updateView(true);
});
