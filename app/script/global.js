'use strict';

window.ondragstart = function() {
	return false;
};

var GUI = require('nw.gui');
global.gui = GUI;

/**
 * 获取剪切板内容
 */
function GetClipboard() {
	return GUI.Clipboard.get().get('text');
}

/**
 * 设置剪切板内容
 */
function SetClipboard(text, type) {
	GUI.Clipboard.get().set(text, type);
}

/**
 * 获取当前窗口
 */
function GetWindow() {
	return GUI.Window.get();
}

/**
 * 打开一个新的窗口
 * 关闭原来的窗口（可选）
 */
function NewWindow(name, isClose) {
	var nw = GUI.Window.open(name+'.html', global.win_option[name]);
	if (isClose) {
		GetWindow().close();
	}
	return nw;
}

/**
 * 新建并绑定右键菜单
 */
function NewMenu(id, ary) {
	var menu = new GUI.Menu();
	if (ary && ary.length) {
		for (var i = 0; i < ary.length; i++) {
			if (ary[i])
				menu.append(new GUI.MenuItem(ary[i]));
		}
	}
	document.getElementById(id).addEventListener('contextmenu', function(e){
		e.preventDefault();
		menu.popup(e.x, e.y);
		return false;
	})
}

/**
 * 新建一个提示窗口
 */
function CreateHint(content) {
	NewWindow('hint').content = content;
}

/**
 * 元素插入信息并显示
 */
function ShowAnimate($p, txt) {
	if ($p) {
		if (txt) $p.text(txt);
		$p.stop().fadeIn();
	}
}

/**
 * 显示指定的dom元素
 */
function Show($p) {
	if ($p) {
		$p.removeClass('hide');
	}
}

/**
 * 隐藏指定的dom元素
 */
function Hide($p) {
	if ($p) {
		$p.addClass('hide');
	}
}

/**
 * 设置某dom元素的高度
 */
function SetDomHeight($p, w) {
	if ($p && $p.css) {
		$p.css({'height': w+'px'});
	}
}

/**
 * 获取某dom元素的高度
 */
function GetDomHeight($p) {
	if (!$p || !$p.css)
		return 0;
	return parseFloat($p.css('height'), 10);
}

/**
 * 设置某dom元素的宽度
 */
function SetDomWidth($p, w) {
	if ($p && $p.css) {
		$p.css({'width': w+'px'});
	}
}

/**
 * 获取某dom元素的宽度
 */
function GetDomWidth($p) {
	if (!$p || !$p.css)
		return 0;
	return parseFloat($p.css('width'), 10);
}

/**
 * 表单回车触发按钮点击事件
 */
function BtnTrigger($input, $btn) {
	$input.keyup(function(e){
		if (e.keyCode == 13) {
			$btn.click();
		}
	});
}

/**
 * 创建最小化、最大化、关闭等按钮
 */
function BuildFrame(tools, win) {
	if (!tools || !tools.length)
		return ;
	var html = '<div class="fr">', tmp = '';
	$.each(tools, function(i, p){
		html += '<a title="'+global.tips[p]+'" class="top_icon i_'+p;
		if (i > 0)
			html += ' top_icon-'+i;
		html += '"><img src="img/'+p+'.png">';
		html += '</a><span class="divide"></span>';
	});
	html += '</div>';
	$('#top').prepend(html+tmp);

	var	$icon = $('.top_icon');
	$.each($icon, function(i, p){
		$(p).click(function(){
			if ($(this).hasClass('i_minimize')) {
				win.minimize();
			} else if ($(this).hasClass('i_close')) {
				win.close();
			} else if ($(this).hasClass('i_maximize')) {
				win.maximize();
			}
		});
	});

	win.on('loaded', function(){
		win.show();
		win.focus();
	});
}

/**
 * 绑定alert的关闭事件
 */
function BindAlert() {
	$('.alert').find('.close').click(function(){
		$(this).parent().stop().fadeOut();
	});
}

/**
 * run socket
 */
function StartSocket() {
	global.socket = io.connect(global.server);
	console.log('socket start.');
	return global.socket;
}

/**
 * 向其他窗口发送消息
 */
function PostMessage(win, data) {
	if (win) {
		if (win.isLoaded) {
			win.window.postMessage(data, "*");
		} else {
			if (!win.msg)
				win.msg = new Array();
			win.msg.push(data);
		}
	}
}

/**
 * 监听并处理来自其他窗口的消息
 */
function ListenMessage(win, handle) {
	win.window.addEventListener('message', function(e){
		handle(e.data);
	});
	win.isLoaded = true;
	if (win.msg && win.msg.length) {
		for (var i = 0; i < win.msg.length; i++) {
			handle(win.msg[i]);
		}
		win.msg = null;
	}
}