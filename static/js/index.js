$(function(){
  // Handle login onclick for generating QR code
  $('#login').click(function(){
    $('#login').hide();
    // POST session id, website id to partner web service /authenticate, receive UUID
    $.post('/authenticate', {}, function(data){
      // Create QR Code with UUID, website name
      console.log('Generating QR code for');
      var data_str = JSON.stringify(data['data']);
      console.log(data_str);
      var qrauth = new QRCode($('#qrauth')[0], data_str)
      $('#qrtext').html("<b>Request data</b>: "+data_str)
      // Loop pings for authentication
      check_authentication();
      // Request /authenticate/UUID, receive user_id, shipping address
      // On return POST purchase.html with user_id, user_name, shipping address
    }, "json")
  })
  // Function to check login status by pinging every .5 s
  function check_authentication(){
    $.getJSON('/authenticate', function(data){
      console.log(data);
      $('#qrstatus').html('<b>Auth status</b>: '+JSON.stringify(data['data']));
      if ('authenticated' in data['data']) {
        if (data['data']['authenticated']){
          // Reload page / move on
          location.reload(); 
        } else {
          // Error page or message here
        }
      } else {
        // Call this again
        setTimeout(check_authentication, 500);
      }
    });
  }
})
