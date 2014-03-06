'use strict';

var win = GetWindow()
,	socket = global.socket;

$(document).ready(function(){
	BuildFrame(['close', 'minimize'], win);
	BindAlert();
});

var $msg = $('#msg')
,	User = require('./models/user')
,	Chatlog = require('./models/chatlog');

function buildline() {
	$msg.append(global.div('以上为待处理消息', 'gray center'));
}

function createBox(date, p, func) {
	var html = date ? global.span(date, 'gray') : '', tc = p.read > 1 ? '' : 'box-white';
	var inner = global.div()+global.div(global.nspan(3), 'info')+global.div('', 'item');
	html += global.div(inner, 'box '+tc, p.from+'-'+p.read+'-'+p.inDate);
	$msg[func](html);
	var $box = $msg.find('#'+p.from+'-'+p.read+'-'+p.inDate)
	,	$div = $box.find('div')
	,	$span = $box.find('.info').find('span');
	if (p.msg) {
		$span.eq(2).addClass('gray').text('附加消息: '+p.msg);
	}
	var get = function(n) {
		var tp;
		if (n == 1) {
			tp = '<a class="btn" res="2">同意</a><a class="btn" res="4">忽略</a>';
		} else if (n == 2) {
			tp = global.span('已同意', 'gray');
		} else if (n == 3) {
			tp = global.span('已拒绝', 'gray');
		} else if (n == 4) {
			tp = global.span('已忽略', 'gray');
		}
		return tp;
	};
	$div.eq(2).html(get(p.read));
	if (p.read == 1) {
		$div.eq(2).find('.btn').click(function(){
			if ($(this).hasClass('disabled')) {
				return false;
			}
			$(this).addClass('disabled');
			var v = parseInt($(this).attr('res'), 10);
			socket.emit('message', {type: 5, to: p.from, inDate: p.inDate, msg: {result: v}}, function(res){
				if (res) {
					Chatlog.update({type: 4, from: p.from, read: 1, inDate: p.inDate}, {$set: {read: v}}, function(err){
						if (err) {
							console.log(err);
							return ;
						}
						$div.eq(2).html(get(v));
					});
				}
			});
		});
	}
	User.findOne({name: p.from}, function(err, u){
		if (err) {
			console.log(err);
			return ;
		}
		$div.eq(0).html(global.img(global.getImgSrc(u.img, u.imgFormat), null, 'img_60x60 img-hover avatar'));
		$span.eq(0).addClass('bold').text(u.nick);
		$span.eq(1).text(global.sex(u.sex)+' '+global.age(u.birthday)+'岁');
	});
}

function insert (m) {
	if (m && m.length) {
		var pre;
		for (var i = 0; i < m.length; i++) {
			var cur = global.getFromDate(m[i].inDate);
			createBox(cur == pre ? null : cur, m[i], 'append');
			pre = cur;
		}
		return true;
	}
	return false;
}

$(document).ready(function(){
	Chatlog.get({type: 4, read: 1}, 0, 20, 1, function(err, msgs){
		if (err) {
			console.log(err);
			return ;
		}
		if (insert(msgs)) buildline();
		Chatlog.get({type: 4, read: {$gt: 1}}, 0, 20, 1, function(err, msgs){
			if (err) {
				console.log(err);
				return ;
			}
			insert(msgs);
		});
		var $news = $('#news'), num = 0;
		var pre = $msg.find('span').eq(0).text(), cur;
		var handle = function(d) {
			cur = global.getFromDate(d.inDate);
			if ($('.box-white').length) {
				if (cur == pre) {
					$msg.find('span').eq(0).remove();
				}
			} else {
				buildline();
			}
			createBox(pre=cur, d, 'prepend');
			$news.find('.red').text(++num);
			$news.stop().fadeIn();
		};
		ListenMessage(win, handle);
	});
});