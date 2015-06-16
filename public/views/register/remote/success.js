(function() {
  'use strict';

  var data = JSON.parse( ($('#data-record').text()));
  try {
    opener.postMessage(data, data.allowDomain);
  }
  catch (e) {
    //alert(e);
  }
}());
