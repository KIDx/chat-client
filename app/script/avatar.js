'use strict';

var win = GetWindow()
,	fs = require('fs')
,	user = global.session.user;

$(document).ready(function(){
	BuildFrame(['close', 'minimize'], win);
});

var $left = $('#left')
,	$img = $('#right').find('img')
,	name, format;

$(document).ready(function(){
	fs.readdir('app/avatar/jpg', function(err, files){
		if (err) {
			console.log(err);
		}
		if (files && files.length) {
			files.forEach(function(p){
				$left.append(global.img('avatar/jpg/'+p, global.fixFileName(p), 'img_40x40 avatar img-hover'));
			});
			$left.find('img').click(function(){
				name = $(this).attr('id');
				format = 'jpg';
				$img.attr('src', 'avatar/'+format+'/'+name+'.'+format);
			});
		}
	});
	$img.attr('src', global.getImgSrc(user.img, user.imgFormat));
});

var $ok = $('#ok')
,	$cancle = $('#cancle')
,	socket = global.socket;

$(document).ready(function(){
	$ok.click(function(){
		if (global.onlineStatus == -1) {
			CreateHint(win, '您目前处于离线状态，请先登录再更换头像！');
			win.close();
			return false;
		}
		if (!name || !format|| (name == user.img && format == user.imgFormat)) {
			win.close();
			return false;
		}
		$.ajax({
			type: 'POST',
			url: global.server + '/updateImg',
			data: {
				name: name,
				format: format
			},
			timeout: 5000
		})
		.done(function(){
			socket.json.send({type: 3, msg: {name: name, format: format}});
			win.close();
		});
	});
	$cancle.click(function(){
		win.close();
	});
});