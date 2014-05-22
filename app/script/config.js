/**
 * config.js
 * 全局变量设置，只需初始时运行一次即可获取，不必每个窗口都包含
 */
'use strict';

/**
 * 服务器地址
 */
global.server = 'http://172.22.27.1:5000';
//global.server = 'http://localhost:5000';

/**
 * 视频通话服务器地址
 */
global.webrtcServer = 'http://172.22.27.1:8888';
global.host = '172.22.27.1';
global.port = '9000';

/**
 * 存储当前会话信息
 */
global.session = {};
global.session.user = {};

/**
 * 屏幕分辨率
 */
global.width = window.screen.width;
global.height = window.screen.height;

/**
 * 当前用户在线状态
 * -1, 真离线
 *	0, 假离线
 *	1, 在线
 */
global.onlineStatus = -1;

/**
 * title提示内容设置
 */
global.tips = {
	minimize 	: '最小化',
	maximize 	: '最大化',
	close 		: '关闭'
};

/**
 * 窗口设置
 */
global.win_option = {
	login: {
		frame 		: false,
		toolbar 	: false,
		position 	: "center",
		width 		: 380,
		height 		: 295,
		resizable 	: false,
		show 		: false,
	},
	register: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 380,
		height 		: 430,
		resizable 	: false,
		show		: false
	},
	main: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 280,
		height 		: 720,
		resizable 	: false,
		show 		: false
	},
	chat: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 550,
		height 		: 535,
		resizable 	: false,
		show 		: false
	},
	find: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 900,
		height 		: 600,
		resizable 	: false,
		show 		: false
	},
	avatar: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 625,
		height 		: 465,
		resizable 	: false,
		show 		: false
	},
	hint: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 340,
		height 		: 155,
		resizable 	: false,
		show 		: false
	},
	sysmsg: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 600,
		height 		: 480,
		resizable 	: false,
		show 		: false
	},
	addfriend: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 460,
		height 		: 360,
		resizable 	: false,
		show 		: false
	},
	videochat: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 540,
		height 		: 435,
		resizable 	: false,
		show 		: false
	},
	userinfo: {
		frame 		: false,
		toolbar 	: false,
		position 	: 'center',
		width 		: 350,
		height 		: 366,
		resizable 	: false,
		show 		: false
	}
};

/**
 * 判断某变量类型是否为"undefined"
 */
global.nil = function(n) {
	return (typeof(n) == 'undefined');
};

/**
 * 去掉字符串头尾的空字符
 */
global.trim = function(s) {
	if (global.nil(s)) return '';
	return String(s).replace(/(^\s*)|(\s*$)/g, '');
};

/**
 * 将字符串中的连续空字符段替换成一个空格
 */
global.drim = function(s) {
	if (global.nil(s)) return '';
	return String(s).replace(/(\s+)/g, ' ');
};

/**
 * delete unuseful ' ', '\t', '\n' ect...
 * eg: "	 a   b " ---> "a b"
 */
global.clearSpace = function(s) {
	return global.drim(global.trim(s));
};

/**
 * 获取字符串字符个数
 */
global.getlen = function(s) {
	s = String(s);
	var len = s.length;
	for (var i = 0; i < len; i++) {
		var asc = s.charCodeAt(i);
		if (asc < 0 || asc > 128) {
			++len;
		}
	}
	return len;
};

/**
 * "月、日、时、分、秒"前补零
 */
global.deal = function (s) {
	s = parseInt(s, 10);
	if (!s) return '00';
	if (s < 10) return '0'+s;
	return s;
};

/**
 * 参数: n(格式：毫秒), type
 *
 * type
 * | 1: 传入出生日期，返回年龄
 * | 2: 传入日期，返回该日期的大概描述
 * | 3: 传入日期，返回年月日格式
 */
global.getFromDate = function(n, type) {
	n = parseInt(n);
	if (!n) return '';

	var b = new Date(n), now = new Date();
	var y = b.getFullYear(), ty = now.getFullYear()
	,	m = b.getMonth(), tm = now.getMonth()
	,	d = b.getDate(), td = now.getDate();

	if (type == 1) {
		var age = ty - y;
		if (tm < m || (tm == m && td < d))
			--age;
		return age > 0 ? age : 0;
	} else if (type == 2) {
		if (y != ty) {
			return y+'年'+global.deal(m)+'月'+global.deal(d)+'日';
		} else if (m != tm || d - td > 2) {
			return global.deal(m+1)+'月'+global.deal(d)+'日';
		} else {
			if (d == td) {
				return '今天';
			} else if (td - d == 1) {
				return '昨天';
			} else if (td - d == 2) {
				return '前天';
			}
		}
		return '未知';
	} else if (type == 3) {
		return y+'-'+global.deal(m+1)+'-'+global.deal(d);
	}
};

/**
 * 传入出生日期，返回年龄
 */
global.age = function(n) {
	return global.getFromDate(n, 1);
};

/**
 * 传入日期，返回年月日格式
 */
global.date = function(n) {
	return global.getFromDate(n, 3);
};

/**
 * 返回中文性别
 */
global.sex = function(n) {
	n = parseInt(n, 10);
	return n ? '女' : '男';
};

/**
 * 返回指定tagname, innerhtml, class, id的HTML代码
 */
global.tag = function(tag, html, c, id) {
	var res = '<'+tag;
	if (c) res += ' class="'+c+'"';
	if (id) res += ' id="'+id+'"';
	res += '>';
	if (html) res += html;
	res += '</'+tag+'>';
	return res;
};

/**
 * 返回指定innerhtml, class, id的<div>HTML代码
 */
global.div = function(html, c, id) {
	return global.tag('div', html, c, id);
};

/**
 * 返回指定innerhtml, class, id的<span>HTML代码
 */
global.span = function(html, c, id) {
	return global.tag('span', html, c, id);
};

/**
 * 返回n个<span>的HTML代码
 */
global.nspan = function(n) {
	var html = '';
	for (var i = 0; i < n; i++)
		html += global.span();
	return html;
};

/**
 * 返回指定innerhtml, class, id的<a>HTML代码
 */
global.a = function(html, c, id) {
	return global.tag('a', html, c, id);
};

/**
 * 返回指定src，id，class的<img>HTML代码
 */
global.img = function(src, id, c) {
	var html = '<img ';
	if (id) html += 'id="'+id+'"';
	if (c) html += ' class="'+c+'" ';
	html += 'src="'+src+'">';
	return html;
};

/**
 * 返回指定文件名和文件格式的头像路径
 */
global.getImgSrc = function(name, format) {
	return 'avatar/' + (name && format ? (format+'/'+name+'.'+format) : 'jpg/01.jpg');
};

/**
 * 返回指定用户的头像路径
 * PS: User是本地数据库模型
 */
global.userImgSrc = function(User, name, callback) {
	User.findOne({name: name}, function(err, user){
		if (err) {
			console.log(err);
		}
		var n, f;
		if (user) {
			n = user.img; f = user.imgFormat;
		}
		return callback(err, global.getImgSrc(n, f));
	});
};

/**
 * 返回不包含后缀的文件名
 */
global.fixFileName = function(name) {
	var s = String(name);
	for (var i = s.length - 1; i >= 0; i--) {
		if (s.charAt(i) == '.') {
			var str = '';
			for (var j = 0; j < i; j++) {
				str += s.charAt(j);
			}
			return str;
		}
	}
	return s;
};