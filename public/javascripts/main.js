$(document).ready(function () {

	var loc = window.location.href; // returns the full URL

	if (/register/.test(loc)) {
		$('#register').addClass('active');
	} else if (/vote/.test(loc)) {
		$('#vote').addClass('active');
	} else if (/results/.test(loc)) {
		$('#results').addClass('active');
	} else if (/admin/.test(loc)) {
		$('#admin').addClass('active');
	}
	
	/*
	For polling agent
	dashboard page
	*/
	var pollAgent_statistics_view_btn_flag = false;
	$('#pollAgent_statistics_view_btn').click(function(){
		if(pollAgent_statistics_view_btn_flag == true){
			$('#pollAgent_stats').hide();
			pollAgent_statistics_view_btn_flag = false;
		}
		else{
			$('#pollAgent_stats').show();
			pollAgent_statistics_view_btn_flag = true;
		}
	})
	/*
	Done
	*/


});


