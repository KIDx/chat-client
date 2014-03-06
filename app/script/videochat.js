'use strict';

var win = GetWindow();

$(document).ready(function(){
	if (win.parent) {
		win.parent.on('closed', function(){
			win.close();
		});
	}
	win.moveTo(win.tx, win.ty);
	BuildFrame(['close', 'maximize', 'minimize'], win);
});

var webrtc;

function joinWebrtc(name, callback) {
	webrtc = new SimpleWebRTC({
		//url: global.webrtcServer,
		// the id/element dom element that will hold "our" video
		localVideoEl: 'local',
		// the id/element dom element that will hold remote videos
		remoteVideosEl: 'remote',
		// immediately ask for camera access
		autoRequestMedia: true
	});
	// we have to wait until it's ready
	webrtc.on('readyToCall', function(){
		// you can name it anything
		webrtc.joinRoom(name, function(err){
			if (err) {
				console.log(err);
			}
			return callback();
		});
	});
}

$(document).ready(function(){
	$('#title').text('正在和'+win.nick+'视频会话');

	var $info = $('#info'), $local = $('#local')
	,	$bg = $('#bg');

	//建立P2P连接并进行视频
	var runWebrtc = function() {
		joinWebrtc('test', function(){
			$info.text('');
			$bg.stop().animate({'bottom': '-38px'});
			$local.fadeIn();
		});
	};

	//如果是视频发起者
	if (win.initiator) {
		ListenMessage(win, function(d){
			switch (d.type) {
				case 9: {
					$info.text('对方已接受您的请求, 正在建立连接...');
					runWebrtc();
					break;
				}
				default: break;
			}
		});
	} else {
		$info.text('正在建立连接...');
		runWebrtc();
	}
});