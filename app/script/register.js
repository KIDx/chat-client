'use strict';

var win = GetWindow();

$(document).ready(function(){
	BuildFrame(['close', 'minimize'], win);
});

var $input = $('input')
,	$sex = $('#sex')
,	$submit = $('#submit')
,	$err = $('#err')
,	$psw = $('#psw')
,	$nick = $('#nick')
,	$overlay = $('#overlay')
,	$number = $overlay.find('#number')
,	$loading = $('#loading')
,	err_input
,	err = function(err) {
	ShowAnimate($err, err);
}
,	fix = global.clearSpace;

var data = {};

function judge(id, val) {
	switch(id) {
		case 'nick': {
			val = fix(val);
			$nick.val(val);
			var len = global.getlen(val);
			if (!len) {
				err('昵称不能为空');
				return false;
			}
			if (len > 24) {
				err('昵称不能超过24个字符(一个汉字相当于2个字符)');
				return false;
			}
			break;
		}
		case 'psw': {
			var len = val.toString().length;
			if (len < 6 || len > 16) {
				err('密码长度必须为6～16位');
				return false;
			}
			if ((new RegExp('^[0-9]*$')).test(val)) {
				err('密码不能是纯数字');
				return false;
			}
			break;
		}
		case 'psw_again': {
			if (val != $psw.val()) {
				err('两个密码不一致');
				return false;
			}
			break;
		}
		case 'birthday': {
			if (!val) {
				err('生日不能为空');
				return false;
			}
			break;
		}
	}
	return true;
}

function check() {
	var flg = true;
	$.each($input, function(i, p){
		var $p = $(p), id = $p.attr('id'), val = $p.val();
		if (!judge(id, val)) {
			$p.parent().prev().addClass('error-text');
			$p.focus();
			err_input = id;
			return (flg = false);
		}
		if (id != 'psw_again')
			data[id] = val;
	});
	return flg;
}

/**
 * 禁止输入
 */
function disabled() {
	$input.attr('disabled', true);
	$sex.attr('disabled', true);
	$submit.addClass('disabled');
	$loading.show();
	$err.hide();
}

/**
 * 恢复到输入状态
 */
function resume() {
	$input.attr('disabled', false);
	$sex.attr('disabled', false);
	$submit.removeClass('disabled');
	$loading.hide();
}

$(document).ready(function(){
	$input.blur(function(){
		var id = $(this).attr('id');
		if (judge(id, $(this).val())) {
			$(this).parent().prev().removeClass('error-text');
			if (err_input == id) {
				err_input = '';
				$err.hide();
			}
		} else {
			$(this).parent().prev().addClass('error-text');
			err_input = id;
		}
	});
	$submit.click(function(){
		if ($submit.hasClass('disabled') || !check()) {
			return false;
		}
		disabled();
		data.sex = $sex.val();
		$.ajax({
			type: 'POST',
			url: global.server + '/reg',
			dataType: 'text',
			data: data,
			timeout: 10000
		})
		.done(function(res){
			if (res == '1') {
				err('服务器出错');
				resume();
			} else {
				$number.text(res);
				$overlay.show();
			}
		})
		.fail(function(){
			err('请求超时，请检查您的网络或者本机防火墙设置');
			resume();
		});
	});
	$('#login').click(function(){
		NewWindow('login', true);
	});
});