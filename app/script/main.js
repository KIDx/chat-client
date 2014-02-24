'use strict';

var win = GetWindow()
,	wins = {}
,	user = global.session.user;

/**
 * Socket.
 * data.type: (0: 在线状态, 1: 聊天消息, 2: 个性签名更新, 3: 头像更新, 4: 好友添加请求, 5: 好友添加验证结果)
 */
var socket;

/**
 * 存放好友在线状态
 */
var onlinestatus = {};

/**
 * 初始化1 (窗口初始化)
 */
$(document).ready(function(){
	win.moveTo(global.width-global.win_option.main.width-20, 30);
	BuildFrame(['close', 'minimize'], win);
});

var User = require('./models/user')
,	Chatlog = require('./models/chatlog')
,	notice = new Array()
,	notice_msg = {}
,	$head_left = $('#head_left')
,	$avatar = $head_left.find('img')
,	$content = $('#content')
,	$notice = $head_left.find('#notice');

function createWindow(id, name, isChat) {
	if (wins[id]) {
		wins[id].focus();
	} else {
		if (!name) name = id;
		wins[id] = NewWindow(name);
		if (isChat) {
			wins[id].user = id;
			if (notice_msg[id]) {
				wins[id].firstChat = true;
				notice_msg[id] = null;
			}
			if (onlinestatus[id]) {
				wins[id].onlinestatus = onlinestatus[id];
			}
		}
		wins[id].on('closed', function(){
			wins[id] = null;
		});
	}
}

function removeNotice() {
	$notice.unbind();
	$notice.remove();
}

function updateNotice() {
	removeNotice();
	if (notice.length) {
		var name = notice[notice.length-1], src;
		if (name == 'sysmsg') {
			src = 'img/msg.png';
		} else {
			src = $('#'+name).find('img').attr('src');
		}
		$head_left.append(global.img(src, 'notice', 'img_30x30'));
		$notice = $head_left.find('#notice');
		$notice.click(function(){
			if (name == 'sysmsg') {
				createWindow('sysmsg');
			} else {
				createWindow(name, 'chat', true);
			}
			if (notice.length)
				$('#'+notice.pop()).find('img').removeClass('alive');
			updateNotice();
		});
	}
}

function delNotice(name) {
	for (var i = 0; i < notice.length; i++) {
		if (notice[i] == name) {
			notice.splice(i, 1);
			return true;
		}
	}
	return false;
}

function addNotice(name) {
	delNotice(name);
	notice.push(name);
	updateNotice();
}

function buildUser($ul, p) {
	if (!p) return '';
	var html = '<li id="'+p.name+'">';
	html += global.img(global.getImgSrc(p.img, p.imgFormat), null, 'img_40x40 img-gray fl avatar');
	html += '<div class="li_right">';
	html += '<div>'+p.nick+'</div>';
	html += '<div class="sig gray ellipsis">'+(p.signature ? p.signature : '')+'</div>';
	html += '</div></li>';
	$ul.append(html);
	var $li = $ul.find('#'+p.name);
	$li.click(function(){
		if ($(this).hasClass('active'))
			return false;
		$ul.find('li').removeClass('active');
		$(this).addClass('active');
	});
	$li.dblclick(function(){
		var id = $(this).attr('id');
		createWindow(id, 'chat', true);
		if (delNotice(id)) {
			$('#'+id).find('img').removeClass('alive');
			updateNotice();
		}
	});
}

/**
 * 建立用户列表、建立socket连接、监听所有socket事件
 */
function start() {
	var $ul = $content.find('ul');
	User.get({name: {$in: user.friends}}, {name: 1}, function(err, users){
		if (err) {
			console.log(err);
			return ;
		}
		buildUser($ul, user);
		for (var i = 0; i < users.length; i++)
			buildUser($ul, users[i]);
		// Start Socket.
		socket = StartSocket();
		var updateStatus = function(id, status) {
			var $li = $('#'+id), $p = $li.find('img.avatar');
			if (status) {
				$p.removeClass('img-gray');
				if (id != user.name)
					$li.insertAfter($('#'+user.name));
			} else {
				$p.addClass('img-gray');
				if (id != user.name)
					$li.appendTo($ul);
			}
			onlinestatus[id] = status;
			PostMessage(wins[id], {type: 0, msg: status});
		};
		socket.on('message', function(data, fn){
			if (!data) return ;
			switch(data.type) {
				case -1: socket.json.send({type: 0, to: data.from, msg: global.onlineStatus});
				case 0: {
					updateStatus(data.from, data.msg);
					break;
				}
				case 1: {
					var id = data.from, msg = data.msg
					,	doc = {
						type: 1,
						from: id,
						msg: msg,
						inDate: data.inDate
					};
					if (wins[id]) {
						PostMessage(wins[id], {type: 1, msg: msg});
						doc.read = 1;
						Chatlog.insert(doc);
					} else {
						doc.read = 0;
						Chatlog.insert(doc, function(err){
							if (err) {
								console.log(err);
							}
							addNotice(id);
							$('#'+id).find('img').addClass('alive');
						});
					}
					break;
				}
				case 2: {
					var id = data.from;
					if (id == user.name) {
						user.signature = data.msg;	//update session
					}
					$('#'+id).find('.sig').text(global.clearSpace(data.msg));
					//update <data.from>'s signature for his chat window
					PostMessage(wins[id], {type: 2, msg: data.msg});
					//update database
					User.update({name: id}, {$set: {signature: data.msg}});
					break;
				}
				case 3: {
					var id = data.from;
					var n = data.msg.name, f = data.msg.format, src = 'avatar/'+f+'/'+n+'.'+f;
					if (id == user.name) {
						user.img = n; user.imgFormat = f;	//update session
						$avatar.attr('src', src);
						//update <this user>'s avatar for each chat window
						for(var i in wins) {
							if (wins[i] && wins[i].user) {
								PostMessage(wins[i], {type: 3, from: id, msg: data.msg});
							}
						}
					} else {
						//update <data.from>'s avatar for his chat window
						PostMessage(wins[id], {type: 3, from: id, msg: data.msg});
					}
					$('#'+id).find('img').attr('src', src);
					//update database
					User.update({name: id}, {$set: {img: n, imgFormat: f}});
					break;
				}
				case 4: {
					var doc = {
						type: 4,
						from: data.from,
						msg: data.msg,
						read: 1,
						inDate: data.inDate
					};
					Chatlog.insert(doc, function(err){
						if (err) {
							console.log(err);
							return ;
						}
						if (data.user) {
							User.update({name: data.user.name}, {$set: data.user}, function(err){
								if (err) {
									console.log(err);
									return ;
								}
								if (wins['sysmsg']) {
									PostMessage(wins['sysmsg'], doc);
								} else {
									addNotice('sysmsg');
								}
							});
						}
					});
					break;
				}
				case 5: {
					break;
				}
				case 6: {
					if (data.msg && data.msg.name) {
						buildUser($ul, data.msg);
						var id = data.msg.name;
						User.update({name: id}, {$set: data.msg}, function(err){
							if (err) {
								console.log(err);
								return ;
							}
							if (!wins[id]) {
								$('#'+id).find('img.avatar').addClass('alive');
								addNotice(id);
								notice_msg[id] = true;
							}
						});
					}
					if (fn) fn(global.onlineStatus);
					break;
				}
				default: break;
			}
		});
		socket.on('connect', function(data){
			console.log('socket is connected.'); 
			socket.json.send({type: -1, msg: global.onlineStatus = win.onlineStatus});
		});
		socket.on('disconnect', function(data){
			console.log('socket is disconnected.');
			global.onlineStatus = -1;
			updateStatus(user.name, 0);
			for (var i = 0; i < users.length; i++)
				updateStatus(users[i].name, 0);
		});
		
	});
}

/**
 * 初始化2 (初始化用户信息)
 */
var $nick = $('#nick')
,	$sig = $('#sig')
,	$signature = $('#signature');

$(document).ready(function(){
	$avatar.attr('src', global.getImgSrc(user.img, user.imgFormat));
	$nick.text(user.nick);
	$sig.text(user.signature);
	$sig.click(function(){
		$signature.val($sig.text());
		$sig.hide();
		$signature.show();
		$signature.focus();
	});
	var toggle = function() {
		$sig.text($signature.val());
		$signature.hide();
		$sig.show();
	};
	$signature.blur(function(){
		var sig = global.clearSpace($signature.val());
		$signature.val(sig);
		if ($sig.text() != sig) {
			$.ajax({
				type: 'POST',
				url: global.server + '/updateSig',
				data: {
					sig: sig
				},
				timeout: 5000
			})
			.done(function(){
				socket.json.send({type: 2, msg: sig});
			});
		}
		toggle();
	});
	$signature.keyup(function(e){
		if (e.keyCode == 13) {
			$signature.blur();
		}
	});
});

/**
 * 初始化3 (建立用户列表、建立socket连接、监听所有socket事件)
 */
$(document).ready(function(){
	start();
});

/**
 * 打开 "查找、添加好友" 窗口
 */
var $find = $('#find');

$(document).ready(function(){
	$find.click(function(){
		if (global.onlineStatus != -1) {
			createWindow('find');
		} else {
			CreateHint('您目前处于离线状态，请先登录再使用"查找"！');
		}
	});
});

/**
 * 打开 "更换头像" 窗口
 */
$(document).ready(function(){
	$avatar.click(function(){
		if (global.onlineStatus != -1) {
			createWindow('avatar');
		} else {
			CreateHint('您目前处于离线状态，请先登录再更换头像！');
		}
	});
});

/**
 * 打开 "系统消息" 窗口
 */
var $sysmsg = $('#sysmsg');

$(document).ready(function(){
	$sysmsg.click(function(){
		createWindow('sysmsg');
	});
});

/**
 * 退出程序
 */
$(document).ready(function(){
	win.on('close', function(){
		for (var i in wins) {
			if (wins[i]) {
				wins[i].close();
			}
		}
		win.close(true);
	});
});