'use strict';

var win = GetWindow();

$(document).ready(function(){
	BuildFrame(['close', 'minimize'], win);
});

var socket = global.socket
,	user = global.session.user;

function buildUser(u) {
	var html = '<div class="user_box">';
	html += global.img(global.getImgSrc(u.img, u.imgFormat), null, 'img_60x60 fl');
	html += '<div class="info">';
	html += '<div>' + u.nick + '</div>';
	html += '<div><span class="text_small gray">' + '广东 佛山' + '</span></div>';
	html += '<div class="add" id="' + u.name + '"><b>+</b> 好友</div></div></div>';
	html += '</div>';
	$users.append(html);
	$('#'+u.name).click(function(){
		if (global.onlineStatus != -1) {
			NewWindow('addfriend').user = u;
		} else {
			CreateHint('您目前处于离线状态，请先登录再使用！');
		}
	});
}

var $users = $('#users');

function getUser(page) {
	$.ajax({
		type: 'POST',
		url: global.server + '/find',
		dataType: 'json',
		data: {
			page: page
		},
		timeout: 5000
	})
	.fail()
	.done(function(users){
		if (users) {
			$.map(users, buildUser);
		}
	});
}

$(document).ready(function(){
	getUser(1);
});