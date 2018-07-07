define(['jquery', '_', 'text!pop'], function ($, _, pophtml) {
	console.log("hello world!");
	console.log($, _);
	$('.ind-fp').css("color", "green");
	$('.ind-temp').append(pophtml);
});