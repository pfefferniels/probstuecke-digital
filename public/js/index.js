const cetei = new CETEI();

cetei.addBehaviors({
  handlers: {
    'idno': linkToGND
  }
});

function linkToGND(el) {
  let ref = el.innerText;
  if (!ref) {
    return $('<span/>').html(el.innerHTML)[0];
  }

  return $('<a class="gnd-link">&rarr; link to GND</a>').attr('href', ref)[0];
}

function createElementFromUri(uri) {
  let path = uri.split('/');
  let number = path[4];
  let author = path[5];
  let edition = path[6].match(/\_(.*)\./)[1];

  const url = {
    'de': 'secondEdition',
    '1st': 'firstEdition',
    'en': 'english'
  }

  const readable = {
    'de': 'second edition (1731)',
    '1st': '1st edition (1719)',
    'en': 'English translation'
  };

  let text = '';
  if (author != 'mattheson') {
    const authorCapitalized = author.charAt(0).toUpperCase() + author.slice(1);
    text = `&rarr; ${authorCapitalized}, ${number} (${edition})`;
  } else {
    text = `&rarr; ${number}, ${readable[edition]}`;
  }

  return $('<a/>').attr('class', 'reference')
                  .attr('href', `/view/${number}/${author}/${url[edition]}`)
                  .html(text)
}

async function loadReferences(personId, referencesEl) {
  let references = '';
  try {
    references = await $.get('/references?ref=' + personId);
  } catch (error) {
    console.error('failed loading references');
    return;
  }

  let xml = $.parseXML(references);
  $(xml).find('ref').each(function() {
    createElementFromUri($(this).text()).appendTo(referencesEl);
  });

}

$(document).ready(function () {
  cetei.makeHTML5(tei, function(html) {
    $('#main').html(html);
  });

  $('tei-person').each(function() {
    $(this).append('<button type="button" class="btn btn-link view-occurences">view occurences</button>');
  });

  $('.view-occurences').click(async function() {
    let parent = $(this).parent('tei-person');
    let personId = parent.attr('id');

    if (!parent.find('.references').length) {
      let referencesEl = $('<div class="references"/>').appendTo(parent);
      loadReferences(personId, referencesEl);
      return;
    };

    let referencesEl = parent.find('.references');
    referencesEl.toggle();
  });
});
