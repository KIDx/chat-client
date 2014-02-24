'use strict';

var win = GetWindow();

$(document).ready(function(){
	BuildFrame(['close'], win);
	$('#close').click(function(){
		win.close();
	});
});

var $msg = $('#msg');

$(document).ready(function(){
	$msg.html(win.content);
});