function makeAnnotatable() {
  anno.reset();
  anno.makeAnnotatable(document.getElementById('mainImage'));
}

function displayPS(number) {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', '/render?' +
    [ 'nr=' + number,
      'page=1',
      'modernClefs=false',
      'emptyStaffsBelow=0',
      'emptyStaffsAbove=0',
      'lang=de',
      'pageHeight=60000'].join('&'));

  xhr.onreadystatechange = function() {
      if(xhr.readyState == 4 && xhr.status == 200) {

        let left = document.getElementById("left");
        let response = JSON.parse(xhr.responseText);
        left.innerHTML = response.svg;
        let staffs = document.getElementsByClassName("staff");
        for (let i=0; i<staffs.length; i++) {
          let staff = staffs[i];
          staffs[i].addEventListener('click', function(e) {
            let idToCopy = staff.getAttribute("id");
            let target = document.getElementsByClassName("annotorious-editor-text");
            target[0].value = idToCopy;

            let saveBtn = document.getElementsByClassName("annotorious-editor-button-save")[0];
            saveBtn.click();
          });
        }
      }
  }
  xhr.send();
}

function sendBoxes() {
  let nr = document.getElementById("psNumber").value;
  let scanPage = document.getElementById("scanId").value;
  let type = document.getElementById("type").value;

  // Set up our HTTP request
  var xhr = new XMLHttpRequest();

  // Setup our listener to process completed requests
  xhr.onload = function () {
    let p = document.getElementById("displayBoxes");
    p.innerHTML = xhr.status;
  }

  xhr.open('POST', '/annotateFile', true);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.onreadystatechange = function() {//Call a function when the state changes.
      if(xhr.readyState == 4 && xhr.status == 200) {
          console.log(xhr.responseText);
      }
  }
  xhr.send(JSON.stringify({
    "regions": anno.getAnnotations(),
    "nr": nr,
    "scanPage": scanPage,
    "type": type
  }));
}

document.addEventListener("DOMContentLoaded", function() {
  let loadPS = document.getElementById("loadPS");
  loadPS.addEventListener('click', function() {
    let psNumber = document.getElementById("psNumber").value;
    if (psNumber) {
      displayPS(psNumber);
    }
  });

  let getScan = document.getElementById("getScan");
  getScan.addEventListener('click', function() {
    var output = document.getElementById('mainImage');
    output.setAttribute("src", ["https://api.digitale-sammlungen.de/iiif/image/v2/",
                  ("bsb10598495_" + document.getElementById("scanId").value.padStart(5, "0")),
                  "/full/full/0/default.jpg"].join(""));
    output.setAttribute("width", "666");
    output.setAttribute("height", "798.66");
    setTimeout(makeAnnotatable, 500); // wait until img is loaded
  }, false);

  let injectBtn = document.getElementById("inject");
  injectBtn.addEventListener('click', sendBoxes);

  let getMEI = document.getElementById("getMEI");
  let getTEI = document.getElementById("getTEI");
  let getIIIF = document.getElementById("getIIIF");

  getMEI.addEventListener('click', function() {
    let nr = document.getElementById("psNumber").value;
    window.open('/annotatedFile?type=music&nr=' + nr);
  });
  getTEI.addEventListener('click', function() {
    let nr = document.getElementById("psNumber").value;
    window.open('/annotatedFile?type=text&nr=' + nr);
  });
  getIIIF.addEventListener('click', function() {
    let nr = document.getElementById("psNumber").value;
    window.open('/annotatedFile?type=iiif&nr=' + nr);
  });
});
