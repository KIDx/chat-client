'use strict';

//设置登录所需最小持续时间，为了延长动画时间
var mins = 3000;

//数据库模型(users)
var Datalist = require('./models/loginDatalist')
,	User = require('./models/user')
,	win = GetWindow();

$(document).ready(function(){
	BuildFrame(['close','minimize'], win);
});

var $name = $('#name')
,	$psw = $('#psw')
,	$rmb_psw = $('#rmb_psw')
,	$login = $('#login')
,	$err = $('#err')
,	$content = $('#content')
,	$left = $content.find('#left')
,	$right = $content.find('#right')
,	$loading = $('#loading')
,	width = GetDomWidth
,	trigger = BtnTrigger
,	err = function(err){
	ShowAnimate($err, err);
};

/**
 * 恢复到登录前的布局
 */
function toResume(str, delay) {
	if (delay < 0) delay = 0;
	setTimeout(function(){
		err(str);
		$left.css({'margin-left': '20px'});
		setTimeout(function(){
			$right.show();
			$name.focus();
			$login.removeClass('disabled');
		}, 800);
		$left.removeClass('img_running');
		$loading.hide();
	}, delay);
}

$(document).ready(function(){
	$login.click(function(){
		if ($login.hasClass('disabled')) {
			return false;
		}
		if (!$name.val() || !$psw.val()) {
			err('用户名或密码不能为空');
			return false;
		}
		$login.addClass('disabled');
		var start = (new Date()).getTime();
		$err.fadeOut(300);
		$right.hide();
		$left.css({'margin-left': (width($content)-width($left))/2 + 'px'});
		$left.addClass('img_running');
		$loading.show();
		$.ajax({
			type: 'POST',
			url: global.server + '/login',
			dataType: 'json',
			data: {
				name: $name.val(),
				psw: $psw.val()
			},
			timeout: 10000
		})
		.done(function(json){
			var delay = mins - ((new Date()).getTime() - start);
			if (json == '1') {
				toResume('帐号或密码错误', delay);
			} else if (json == 'e') {
				toResume('服务器出错', delay);
			} else if (json == 'n') {
				toResume('不允许的操作', delay);
			} else {
				var friends = json.pop()
				,	user = json.pop();
				var doc = {
					name: $name.val(),
					nick: user.nick,
					signature: user.signature,
					visTime: (new Date()).getTime()
				};
				if ($rmb_psw.is(':checked')) {
					doc.psw = $psw.val();
				}
				Datalist.update({name: doc.name}, doc, function(){
					friends.push(user);
					var dfs = function(x) {
						if (x == friends.length) {
							delay = mins - ((new Date()).getTime() - start);
							if (delay < 0)
								delay = 0;
							setTimeout(function(){
								global.session.user = user;
								var w = NewWindow('main');
								w.onlineStatus = 1;
								win.close();
							}, delay);
							return ;
						}
						User.update({name: friends[x].name}, friends[x], function(){
							dfs(x+1);
						});
					};
					dfs(0);
				});
			}
		})
		.fail(function(e){
			toResume('登录超时，请检查您的网络或者本机防火墙设置', mins - ((new Date()).getTime() - start));
		});
	});
	trigger($name, $login);
	trigger($psw, $login);
});

$(document).ready(function(){
	$('#reg').click(function(){
		NewWindow('register', true);
	});
});

var $img = $left.find('img');

function updateImg(name) {
	global.userImgSrc(User, name, function(err, src){
		if (err) {
			console.log(err);
		}
		$img.attr('src', src);
	});
}

$(document).ready(function(){
	var user_psw = {};
	Datalist.get({}, {visTime: -1}, function(err, users){
		if (err) {
			console.log(err);
			return ;
		}
		if (users && users.length) {
			$name.val(users[0].name);
			if (users[0].psw) {
				$psw.val(users[0].psw);
				$rmb_psw.attr('checked', true);
			} else {
				$psw.focus();
			}
			updateImg(users[0].name);
			$name.attr('list', 'users');
			var html = '<datalist id="users">';
			for (var i = 0; i < users.length; i++) {
				html += '<option value="'+users[i].name+'" label="'+users[i].nick+'.">';
				user_psw[users[i].name] = users[i].psw;
			}
			html += '</datalist>';
			$name.after(html);
			$name.bind('input', function(){
				if (user_psw[$name.val()]) {
					$psw.val(user_psw[$name.val()]);
				} else {
					$psw.val('');
				}
				updateImg($name.val());
			});
		}
	});
});