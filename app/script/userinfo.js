'use strict';

var win = GetWindow()
,	socket = global.socket
,	user = global.session.user;

$(document).ready(function(){
	BuildFrame(['close', 'minimize'], win);
});

var $top = $('#top span')
,	$span = $('td > span')
,	$edit = $('#edit')
,	$save = $('#save')
,	$input = $('input,select')
,	$option = $('select option');

function display(u) {
	$.each($span, function(i, p){
		var field = $(p).attr('id'), v;
		$(p).attr('disabled', false);
		if (String(u[field])) {
			if (field == 'sex') {
				v = global.sex(u[field]);
			} else if (field == 'birthday') {
				v = global.date(u[field]);
			} else {
				v = u[field];
			}
			$(p).text(v);
		}
	});
}

$(document).ready(function(){
	if (win.user) {
		$top.text(win.user.nick+'的个人资料');
		display(win.user);
	} else if (user) {
		$top.text('我的个人资料');
		display(user);
		Show($edit);
		$edit.click(function(){
			$.each($input, function(i, p){
				var field = $(p).attr('name'), v;
				if (user[field]) {
					v = user[field];
					if (field == 'sex') {
						if (v) {
							$option.eq(1).attr('selected', true);
						} else {
							$option.eq(0).attr('selected', true);
						}
					} else if (field == 'birthday') {
						v = global.date(user[field]);
					}
					$(p).val(v);
				}
			});
			Hide($span);
			Show($span.eq(0));
			Show($input);
			Hide($edit);
			Show($save);
		});
		$save.click(function(){
			if ($(this).hasClass('disabled')) {
				return false;
			}
			if (global.onlineStatus == -1) {
				CreateHint('您目前处于离线状态，请先登录再修改个人资料！');
				return false;
			}
			$save.addClass('disabled');
			var data = {};
			$.each($input, function(i, p){
				var field = $(p).attr('name');
				if (field == 'birthday') {
					data[field] = (new Date($(p).val())).getTime();
				} else {
					data[field] = $(p).val();
				}
			});
			socket.emit('changeInfo', data, function(res){
				Hide($save);
				Show($edit);
				//update session
				$.each($input, function(i, p){
					var field = $(p).attr('name');
					user[field] = data[field];
				});
				display(user);
				Hide($input);
				Show($span);
				$save.removeClass('disabled');
				if (res) {
					CreateHint('保存成功！');
				} else {
					CreateHint('系统错误，请稍后重试！');
				}
			});
		});
	}
});