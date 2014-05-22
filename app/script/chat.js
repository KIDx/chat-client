'use strict';

var User = require('./models/user')
,	Chatlog = require('./models/chatlog');

var $close = $('#close')
,	$send = $('#send');

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

var $avatar = $('#avatar')
,	$nick = $('#nick')
,	$sig = $('#sig')
,	$T1 = $('#T1')
,	$T2 = $('#T2')
,	$camera = $('#camera');

var win = GetWindow()
,	socket = global.socket
,	user = global.session.user
,	u = win.user
,	video;

/**
 * 退出聊天窗口
 */
$(document).ready(function(){
	win.on('close', function(){
		if (video) {
			video.close();
		}
		win.close(true);
	});
});

/**
 * 打开视频聊天窗口
 */
function openVideo() {
	if (video) {
		video.close();
	}
	video = NewWindow('videochat');
	win.videoOpened = true;
	video.username = u.name;
	video.nick = u.nick;
	video.tx = win.x + win.width + 5; video.ty = win.y;
	video.pid = win.pid;
	video.on('closed', function(){
		$camera.removeClass('disabled');
		video = null;
		win.videoOpened = false;
	});
}

/**
 * 获取本地视频流
 */
function getLocalStream(cb) {
	navigator.webkitGetUserMedia({audio: true, video: true}, function(stream){
		return cb(null, stream);
	}, function(err){
		return cb(err, null);
	});
}

/**
 * 界面初始化1
 */
$(document).ready(function(){
	BindAlert();

	//关闭, 最大化, 最小化
	BuildFrame(['close', 'maximize', 'minimize'], win);

	//改变窗口大小时的响应
	var h = win.height;
	win.on('resize', function(){
		var dh = win.height - h;
		SetDomHeight($T1, GetDomHeight($T1)+dh);
		h = win.height;
	});

	//绑定下方的关闭按钮
	$close.click(function(){
		win.close();
	});
});

/**
 * 聊天窗口顶部的消息显示
 */
var	$alert = $('.alert')
,	$info = $('#info')
,	alertTimeout;

function showAlert(info) {
	$alert.hide();
	clearTimeout(alertTimeout);
	$info.text(info);
	$alert.stop().fadeIn();
	alertTimeout = setTimeout(function(){
		$alert.stop().fadeOut();
	}, 8000);
}

/**
 * 界面初始化2
 */
$(document).ready(function(){
	//头像、昵称、签名
	Show($avatar.attr('src', SRC['left'] = global.getImgSrc(u.img, u.imgFormat)));
	$nick.text(u.nick);
	if (u.signature)
		$sig.text(u.signature);

	//发起视频聊天
	$camera.click(function(){
		if ($camera.hasClass('disabled'))
			return false;
		$camera.addClass('disabled');
		getLocalStream(function(err, stream){
			if (err) {
				showAlert('检测不到摄像头，无法发起视频聊天');
				console.log(err);
				$camera.removeClass('disabled');
				return ;
			}
			openVideo();
			video.stream = stream;
			video.initiator = true;
		});
	});
	Show($camera);

	//显示对方在线状态
	if (win.onlinestatus)
		$avatar.removeClass('img-gray');
});

function buildTimer(p) {
	var html = '<div style="text-align:center;color:gray;font-size:13px;">'+p+'</div>';
	return html;
}

var $hisshow = $('#hisshow')	//对方的QQ秀
,	$video = $('#video');		//接受或拒绝视频聊天的交互界面

/**
 * 界面初始化3
 */
$(document).ready(function(){
	//是否被邀请视频聊天
	if (win.video == 1) {
		Hide($hisshow);
		Show($video);
	} else if (win.video == 2) {
		showAlert('对方取消了视频请求');
	}
	
	//等待聊天框准备完毕
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

		//读取并显示聊天记录
		Chatlog.get({type: 1, read: 1, $or: [{from: u.name}, {from: user.name, to: u.name}]}, 3, 10, 1, function(err, cs){
			if (err) {
				console.log(err);
			}
			if (cs && cs.length) {
				for (var i = cs.length-1; i >= 0; i--)
					build(E1, cs[i].from, cs[i].msg, (cs[i].from == u.name ? 'left' : 'right'));
				E1.append(buildTimer('以上是历史消息'));
			}
			Chatlog.get({type: 1, from: u.name, read: 0}, 10, 10, 1, function(err, cs){
				if (err) {
					console.log(err);
				}
				if (cs && cs.length) {
					for (var i = cs.length-1; i >= 0; i--)
						build(E1, cs[i].from, cs[i].msg, 'left');
					Chatlog.multiUpdate({type: 1, from: u.name, read: 0}, {$set: {read: 1}});
				}
			});
		});

		//消息响应
		ListenMessage(win, function(d){
			switch(d.type) {
				case 0: {
					if (d.msg) $avatar.removeClass('img-gray');
					else {
						if (video) {
							video.close();
							showAlert('对方中断了视频聊天');
						}
						$avatar.addClass('img-gray');
					}
					break;
				}
				case 1: {
					build(E1, u.name, d.msg, 'left');
					break;
				}
				case 2: {
					$sig.text(d.msg);
					break;
				}
				case 3: {
					if (d.from == u.name) {
						$avatar.attr('src', global.getImgSrc(d.msg.name, d.msg.format));
						E1.updateAvatar(global.getImgSrc(d.msg.name, d.msg.format), 'left');
					}
					if (d.from == user.name) {
						E1.updateAvatar(global.getImgSrc(d.msg.name, d.msg.format), 'right');
					}
					break;
				}
				case 7: {
					Hide($hisshow);
					Show($video);
					win.pid = d.msg;
					showAlert('对方正在和您视频，注意警惕视频诈骗，勿轻信汇款信息。');
					break;
				}
				case 8: {
					if (video) {
						video.isPassive = true;
						video.close();
						showAlert('对方中断了视频聊天');
					} else {
						Hide($video);
						Show($hisshow);
						showAlert('对方取消了视频请求');
					}
					break;
				}
				case 9: {
					if (video) {
						if (d.msg) {
							PostMessage(video, {type: 9, pid: d.msg});
						} else {
							video.isPassive = true;
							video.close();
							showAlert('对方拒绝了您的视频请求');
						}
					}
					break;
				}
				case 12: {
					$nick.text(d.msg);
					break;
				}
				default: break;
			}
		});

		//发送消息
		$send.click(function(){
			var data = E2.getData();
			if (!data) {
				return false;
			}
			build(E1, user.name, data, 'right');
			E2.clear();
			socket.emit('message', {type: 1, to: u.name, msg: data}, function(res){
				if (res) {
					Chatlog.insert({type: 1, from: user.name, to: u.name, msg: data, inDate: res, read: 1});
				}
			});
		});

		//加载表情
		var $show_smiley = $('#show_smiley')
		,	$smiley = $('#smiley');
		$show_smiley.click(function(){
			Show($smiley);
			$smiley.focus();
		});
		$smiley.blur(function(){
			Hide($smiley);
		});
		for (var i = 1; i <= 67; i++)
			$smiley.append(global.img('img/smiley/'+i+'.gif', null, 'img-hover avatar'));
		$smiley.find('img').click(function(){
			Hide($smiley);
			E2.append(global.img($(this).attr('src')));
		});
	});
});


var $accept = $('#accept')
,	$reject = $('#reject');

$(document).ready(function(){
	$accept.click(function(){
		Hide($video);
		Show($hisshow);
		getLocalStream(function(err, stream){
			if (err) {
				showAlert('检测不到摄像头，无法发起视频聊天');
				console.log(err);
				$camera.removeClass('disabled');
				return ;
			}
			openVideo();
			video.stream = stream;
		});
	});
	$reject.click(function(){
		Hide($video);
		Show($hisshow);
		socket.json.send({type: 9, to: u.name, msg: null});
	});
});