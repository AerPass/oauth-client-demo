$(function(){
  $("input[type=submit]").attr('disabled','disabled')
  $("form").keyup(function(){
    $("input[type=submit]").removeAttr('disabled');
  });
  // Handle purchase form for generating QR code
  $('form[name="purchase"]').submit(function(event){
    $("input[type=submit]").attr('disabled','disabled')
    event.preventDefault();
    console.log("submit");
    // POST transaction info (amount, partner_id, timestamp) and signature of
    // transaction data to partner web service /transaction, receive UUID
    var transaction_data = {'amount':parseFloat($('input[name="amount"]').val())}
    $.post('/transaction', transaction_data, function(data){
      // Should have success: True, request_id: request_id, qr_img: location of qr
      // Set image src to data["qr_img"]
      $('#qrauth').html("<img src="+data["qr_img"]+">")
      $('#post_result').html(JSON.stringify(data))
      // Set request id
      var request_id = data["request_id"]
      // Loop pings for transaction
      check_transaction();
    });
    return false;
  });
  // Function to check login status by pinging every .5 s
  function check_transaction(request_id){
    $.getJSON('/transaction', function(data){
      console.log(data);
      $('#get_result').html(JSON.stringify(data))
      $('#qrstatus').html('<b>Request status</b>: '+JSON.stringify(data['reason']));
      if (data['success']){
        // Reload page / move on
        $('#qrtext').html("")
        $('#qrstatus').html("")
        $('#transstatus').html('<b>Tranasction status</b>: approved');
        $('#transresults').html('<b>Tranasction results</b>: '+JSON.stringify(data['request']))
      } else {
        // Call this again
        setTimeout(check_transaction, 500, request_id);
      }
    });
  }
})
