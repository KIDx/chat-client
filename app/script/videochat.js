'use strict';

var win = GetWindow()
,	user = global.session.user
,	socket = global.socket;

$(document).ready(function(){
	win.on('close', function(){
		if (!win.isPassive) {
			socket.json.send({type: 8, to: win.username});
		}
		if (win.stream) {
			win.stream.stop();
		}
		win.close(true);
	});
	win.moveTo(win.tx, win.ty);
	BuildFrame(['close', 'minimize'], win);
});

$(document).ready(function(){
	$('#title').text('正在和'+win.nick+'视频会话');

	var $info = $('#info')
	,	$local = $('#local')
	,	$remote = $('#remote')
	,	$bg = $('#bg');

	if (win.stream) {
		$local.prop('muted', true).prop('src', URL.createObjectURL(win.stream)).fadeIn();
	}

	var isCaller = win.initiator;	//是否视频发起人

	// Connect to PeerServer
	var peer = new Peer({
		host: global.host,
		port: global.port,
		path: '/cc_cat',
		debug: 3
	});

	// Openning
	peer.on('open', function(){
		console.log("peer: "+peer.id);
		if (isCaller) {
			ListenMessage(win, function(d){
				switch(d.type) {
					case 9: {
						$info.text('对方已接受您的请求, 正在建立连接...');
						var call = peer.call(d.pid, win.stream);
						call.on('stream', function(remoteStream){
							$remote.prop('src', URL.createObjectURL(remoteStream));
							//$info.text('');
							//$bg.stop().animate({'bottom': '-38px'});
						});
						break;
					}
					default: break;
				}
			});
		} else {
			$info.text('正在建立连接...');
		}
		socket.json.send({type: (isCaller ? '7' : '9'), to: win.username, msg: peer.id});
	});

	// Listen error
	peer.on('error', function(err){
		console.log(err.message);
	});

	if (!isCaller) {
		// Receiving a call
		peer.on('call', function(call){
			if (call) {
				call.answer(win.stream);
				call.on('stream', function(remoteStream){
					$remote.prop('src', URL.createObjectURL(remoteStream));
				});
			}
		});
	}
});