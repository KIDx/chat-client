'use strict';

var User = require('./models/user')
,	Chatlog = require('./models/chatlog');

var win = GetWindow()
,	h = win.height
,	$avatar = $('#avatar')
,	$nick = $('#nick')
,	$sig = $('#sig')
,	$close = $('#close')
,	$send = $('#send');

$(document).ready(function(){
	win.on('resize', function(){
		var dh = win.height - h;
		SetDomHeight($T1, GetDomHeight($T1)+dh);
		h = win.height;
	});
});

$(document).ready(function(){
	$close.click(function(){
		win.close();
	});
});

/**
 * 热键回调函数
 */
var hotKeyHandle = function(e) {
	if (e.altKey) {
		switch(e.keyCode) {
			case 67: $close.click(); break;
			case 83: $send.click(); break;
			default: break;
		}
	}
};

/**
 * 绑定热键回调函数
 */
$(document).keyup(hotKeyHandle);

/**
 * 用来存放我方以及对方的头像路径
 */
var SRC = {};

/**
 * 返回聊天气泡HTML
 */
function buildChatUnit(pos, src, msg) {
	var html = '<div class="unit unit-'+pos+'">';
	html += '<span>'+global.img(src, null, 'img_30x30 avatar')+'</span>';
	html += '<span class="box">'+msg+'</span></div>';
	return html;
}

/**
 * 插入聊天气泡HTML
 */
function build(E, name, msg, pos) {
	E.append(buildChatUnit(pos, '', msg));
	if (!SRC[pos]) {
		global.userImgSrc(User, name, function(err, src){
			E.updateAvatar(SRC[pos]=src, pos);
		});
	} else {
		E.updateAvatar(SRC[pos], pos);
	}
}

var socket = global.socket
,	user = global.session.user;

/**
 * 界面初始化1 (头像、昵称、签名)
 */
$(document).ready(function(){
	User.findOne({name: win.user}, function(err, user){
		if (err) {
			console.log(err);
			return ;
		}
		$avatar.attr('src', SRC['left'] = global.getImgSrc(user.img, user.imgFormat));
		$nick.text(user.nick);
		if (user.signature)
			$sig.text(user.signature);
	});
	if (win.onlinestatus) {
		$avatar.removeClass('img-gray');
	}
});

/**
 * 界面初始化2 (初始化窗口)
 */
$(document).ready(function(){
	BuildFrame(['close', 'maximize', 'minimize'], win);
});

function buildTimer(p) {
	var html = '<div style="text-align:center;color:gray;font-size:13px;">'+p+'</div>';
	return html;
}

/**
 * 界面初始化3 (初始化聊天框)
 */
$(document).ready(function(){
	var $T1 = $('#T1'), $T2 = $('#T2');
	$T1.load(function() {
		var E1 = new Editor('T1', false, {'cursor': 'default'})
		,	E2 = new Editor('T2', true);
		E2.event('keydown', hotKeyHandle);
		win.on('focus', function(){
			E2.focus();
		});
		if (win.firstChat) {
			E1.append(buildTimer('我们已经是好友了，现在开始对话吧！'));
		}
		Chatlog.get({type: 1, read: 1, $or: [{from: win.user}, {from: user.name, to: win.user}]}, 3, 10, 1, function(err, cs){
			if (err) {
				console.log(err);
			}
			if (cs && cs.length) {
				for (var i = cs.length-1; i >= 0; i--)
					build(E1, cs[i].from, cs[i].msg, (cs[i].from == win.user ? 'left' : 'right'));
				E1.append(buildTimer('以上是历史消息'));
			}
			Chatlog.get({type: 1, from: win.user, read: 0}, 10, 10, 1, function(err, cs){
				if (err) {
					console.log(err);
				}
				if (cs && cs.length) {
					for (var i = cs.length-1; i >= 0; i--)
						build(E1, cs[i].from, cs[i].msg, 'left');
					Chatlog.multiUpdate({type: 1, from: win.user, read: 0}, {$set: {read: 1}});
				}
			});
		});
		var handle = function (d) {
			switch(d.type) {
				case 0: {
					if (d.msg) $avatar.removeClass('img-gray');
					else $avatar.addClass('img-gray');
					break;
				}
				case 1: {
					build(E1, win.user, d.msg, 'left');
					break;
				}
				case 2: {
					$sig.text(d.msg);
					break;
				}
				case 3: {
					if (d.from == win.user) {
						$avatar.attr('src', global.getImgSrc(d.msg.name, d.msg.format));
						E1.updateAvatar(global.getImgSrc(d.msg.name, d.msg.format), 'left');
					}
					if (d.from == user.name) {
						E1.updateAvatar(global.getImgSrc(d.msg.name, d.msg.format), 'right');
					}
					break;
				}
				default: break;
			}
		};
		ListenMessage(win, handle);
		//发送消息
		$send.click(function(){
			var data = E2.getData();
			if (!data) {
				return false;
			}
			build(E1, user.name, data, 'right');
			E2.clear();
			socket.emit('message', {type: 1, to: win.user, msg: data}, function(res){
				if (res) {
					Chatlog.insert({type: 1, from: user.name, to: win.user, msg: data, inDate: res, read: 1});
				}
			});
		});
		//加载表情
		var $show_smiley = $('#show_smiley')
		,	$smiley = $('#smiley');
		$show_smiley.click(function(){
			$smiley.show();
			$smiley.focus();
		});
		$smiley.blur(function(){
			$smiley.hide();
		});
		for (var i = 1; i <= 67; i++)
			$smiley.append(global.img('img/smiley/'+i+'.gif', null, 'img-hover'));
		$smiley.find('img').click(function(){
			$smiley.hide();
			E2.append(global.img($(this).attr('src')));
		});
	});
});