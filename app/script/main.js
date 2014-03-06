'use strict';

var win = GetWindow()
,	wins = {}
,	user = global.session.user;

/**
 * Socket.
 * data.type --->
 * -1: 对方主动发送在线状态，我方回应在线状态
 *	0: 对方回应的在线状态
 *	1: 他的聊天消息
 *	2: 他的个性签名更新
 *	3: 他的头像更新
 *	4: 他的好友添加请求
 *	5: 他拒绝我添加为好友
 *	6: 他同意我添加为好友
 *	7: 对方发起视频聊天
 *	8: 对方取消视频聊天
 *	9: 对方同意或拒绝我方发起的视频聊天
 * 10: 对方中断了视频聊天
 * 11: 对方与我断绝好友关系
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
		if (wins[id].opened)
			wins[id].focus();
	} else {
		if (!name) name = id;
		var RP = function() {
			wins[id] = NewWindow(name);
			wins[id].opened = true;
			wins[id].on('closed', function(){
				wins[id] = null;
			});
		};
		if (isChat) {
			wins[id] = true;
			User.findOne({name: id}, function(err, user){
				if (err) {
					console.log(err);
				}
				RP();
				wins[id].user = user;
				var m;
				if (m = notice_msg[id]) {
					if (m == 6) {
						wins[id].firstChat = true;
					} else if (m == 7) {
						wins[id].video = 1;
					} else if (m == 8) {
						wins[id].video = 2;
					}
					notice_msg[id] = null;
				}
				if (onlinestatus[id]) {
					wins[id].onlinestatus = onlinestatus[id];
				}
			});
		} else {
			RP();
		}
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
	//选中好友
	var active = function() {
		if ($li.hasClass('active'))
			return false;
		$ul.find('li').removeClass('active');
		$li.addClass('active');
	};
	$li.mousedown(active);
	//打开聊天窗口
	var openChat = function() {
		var id = p.name;
		createWindow(id, 'chat', true);
		if (delNotice(id)) {
			$('#'+id).find('img').removeClass('alive');
			updateNotice();
		}
	};
	$li.dblclick(openChat);
	//绑定右键菜单
	NewMenu(p.name, [{
		label: '发送即时消息',
		icon: 'app/img/talk.png',
		click: function(){
			openChat();
		}
	}, {
		label: '删除好友',
		icon: 'app/img/remove_friend.png',
		click: function(){
			if (!window.confirm('确定删除该好友吗？')) {
				return false;
			}
			socket.json.send({type: 11, to: p.name});
		}
	}]);
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
		socket.on('message', function(d, fn){
			if (!d) return ;
			switch(d.type) {
				case -1: socket.json.send({type: 0, to: d.from, msg: global.onlineStatus});
				case 0: {
					updateStatus(d.from, d.msg);
					break;
				}
				case 1: {
					var id = d.from, msg = d.msg
					,	doc = {
						type: 1,
						from: id,
						msg: msg,
						inDate: d.inDate
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
					var id = d.from;
					if (id == user.name) {
						user.signature = d.msg;	//update session
					}
					$('#'+id).find('.sig').text(global.clearSpace(d.msg));
					//update <d.from>'s signature for his chat window
					PostMessage(wins[id], {type: 2, msg: d.msg});
					//update dbase
					User.update({name: id}, {$set: {signature: d.msg}});
					break;
				}
				case 3: {
					var id = d.from;
					var n = d.msg.name, f = d.msg.format, src = 'avatar/'+f+'/'+n+'.'+f;
					if (id == user.name) {
						user.img = n; user.imgFormat = f;	//update session
						$avatar.attr('src', src);
						//update <this user>'s avatar for each chat window
						for(var i in wins) {
							if (wins[i] && wins[i].user) {
								PostMessage(wins[i], {type: 3, from: id, msg: d.msg});
							}
						}
					} else {
						//update <d.from>'s avatar for his chat window
						PostMessage(wins[id], {type: 3, from: id, msg: d.msg});
					}
					$('#'+id).find('img').attr('src', src);
					//update dbase
					User.update({name: id}, {$set: {img: n, imgFormat: f}});
					break;
				}
				case 4: {
					var doc = {
						type: 4,
						from: d.from,
						msg: d.msg,
						read: 1,
						inDate: d.inDate
					};
					Chatlog.insert(doc, function(err){
						if (err) {
							console.log(err);
							return ;
						}
						if (d.user) {
							User.update({name: d.user.name}, {$set: d.user}, function(err){
								if (err) {
									console.log(err);
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
					if (d.msg && d.msg.name) {
						buildUser($ul, d.msg);
						var id = d.msg.name;
						User.update({name: id}, {$set: d.msg}, function(err){
							if (err) {
								console.log(err);
								return ;
							}
							if (!wins[id]) {
								$('#'+id).find('img.avatar').addClass('alive');
								addNotice(id);
								notice_msg[id] = 6;
							}
						});
					}
					if (fn) fn(global.onlineStatus);
					break;
				}
				case 7:
				case 8: {
					var id = d.from;
					if (wins[id]) {
						if (d.type == 8)
							wins[id].closeVideo = true;
						PostMessage(wins[id], {type: d.type});
					} else {
						addNotice(id);
						notice_msg[id] = d.type;
						$('#'+id).find('img').addClass('alive');
					}
					break;
				}
				case 9: {
					PostMessage(wins[d.from], {type: 9, msg: d.msg});
					break;
				}
				case 10: {
					PostMessage(wins[d.from], {type: 10});
					break;
				}
				case 11: {
					var id = d.from;
					if (wins[id])
						wins[id].close();
					$('#'+id).remove();
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
	$avatar.show();
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