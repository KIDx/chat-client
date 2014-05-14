'use strict';

var win = GetWindow()
,	socket = global.socket
,	user = global.session.user
,	he = win.user;

$(document).ready(function(){
	BuildFrame(['close', 'minimize'], win);
});

var $title = $('#title')
,	$left = $('#left');

$(document).ready(function(){
	$title.text(user.nick+' - 添加好友');
	var html = global.img(global.getImgSrc(he.img, he.imgFormat), null, 'img_110x110 img-hover avatar');
	html +=  global.div(global.span(he.nick, 'bold')+global.span(he.name));
	var sex = '男', age = global.getFromDate(he.birthday, 1);
	if (he.sex) sex = '女';
	var tp =  global.span('性别: '+sex)+global.span('年龄: '+age);
	//tp += global.span('所在地: '));
	html += global.div(tp, 'gray');
	$left.html(html);
});

var $part = $('.part')
,	$next = $('#next')
,	$cancel = $('#cancel')
,	$result = $('#result')
,	$text = $('#text')
,	cur = 0;

$(document).ready(function(){
	$next.click(function(){
		Hide($part.eq(cur));
		Show($part.eq(++cur));
		if (cur == 2) {
			$next.unbind();
			$next.remove();
			$cancel.text('完成');
			var src, txt;
			if (global.onlineStatus != -1) {
				socket.json.send({type: 4, from: user.name, to: he.name, msg: $text.val()});
				src = 'img/yes.png';
				txt = '您的好友添加请求已经发送成功，正在等待对方确认。';
			} else {
				src = 'img/warning.png';
				txt = '您目前处于离线状态，请先登录再添加好友！';
			}
			$result.html(global.span(global.img(src))+global.span(txt));
		}
	});
	$cancel.click(function(){
		win.close();
	});
});