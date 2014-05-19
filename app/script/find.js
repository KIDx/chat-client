'use strict';

var win = GetWindow();

$(document).ready(function(){
	BuildFrame(['close', 'minimize'], win);
});

var socket = global.socket
,	user = global.session.user;

var $users = $('#users')
,	$query = $('#query')
,	$search = $('#search')
,	$warning = $('#warning');

function buildUser(u) {
	var html = '<div class="user_box">';
	html += global.img(global.getImgSrc(u.img, u.imgFormat), null, 'img_60x60 fl');
	html += '<div class="info">';
	html += '<div>' + u.nick + '</div>';
	html += '<div><span class="text_small gray"><img class="sex" src="img/' + (u.sex ? 'fe' : '') + 'male.png"> ' + (u.city || '未知') + '</span></div>';
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

$(document).ready(function(){
	$search.click(function(){
		if ($(this).hasClass('disabled')) {
			return false;
		}
		$search.addClass('disabled');
		socket.emit('find', {query: $query.val()}, function(users){
			$users.html('');
			if (users && users.length) {
				Hide($warning);
				for (var i = 0; i < users.length; i++) {
					buildUser(users[i]);
				}
			} else {
				Show($warning);
			}
			$search.removeClass('disabled');
		});
	});
	BtnTrigger($query, $search);
	$search.click();
});