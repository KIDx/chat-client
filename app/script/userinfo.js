'use strict';

var win = GetWindow()
,	socket = global.socket
,	user = global.session.user;

$(document).ready(function(){
	BuildFrame(['close', 'minimize'], win);
	BindAlert();
});

var $top = $('#top span')
,	$span = $('td > span')
,	$edit = $('#edit')
,	$save = $('#save')
,	$input = $('input,select')
,	$option = $('select option')
,	$alert = $('.alert')
,	$info = $('#info')
,	alertTimeout;

function showAlert(info) {
	clearTimeout(alertTimeout);
	$info.text(info);
	$alert.stop().fadeIn();
	alertTimeout = setTimeout(function(){
		$alert.stop().fadeOut();
	}, 3000);
}

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
			$info.removeClass('green').addClass('error-text');
			if (!data.nick) {
				showAlert('昵称不能为空');
				$save.removeClass('disabled');
				return false;
			}
			if (data.nick.length > 24) {
				showAlert('昵称不能超过24个字符(一个汉字相当于2个字符)');
				$save.removeClass('disabled');
				return false;
			}
			if (!data.birthday) {
				showAlert('生日不能为空');
				$save.removeClass('disabled');
				return false;
			}
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
					$info.removeClass('error-text').addClass('green');
					showAlert('保存成功');
				} else {
					showAlert('系统错误，请稍后重试');
				}
			});
		});
	}
});