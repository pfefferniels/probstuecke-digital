$(document).ready(function () {
  let doc = new DOMParser().parseFromString(persons, 'text/xml');
  $(doc).find('person').each(function() {
    let el = $(this);
    let locs = el.find('locations').html();
    let ref = el.find('persName').attr('ref');
    if (!ref) {
      return;
    }

    $.ajax({
      url: ref.replace('d-nb.info', 'lobid.org'),
      success: function(response) {
        let collapseId = 'collapse_' + $.now();
$(`
<p>
  <a data-toggle="collapse" href="#${collapseId}" role="button" aria-expanded="false" aria-controls="${collapseId}">
    ${response.preferredName}
  </a>
</p>
<div class="collapse" id="${collapseId}">
  <div class="card card-body">
    <p><small>found in:</small></p>
    ${locs}
  </div>
</div>`).appendTo('#persons');
      }
    });
  });
});
