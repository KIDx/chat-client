'use strict';

function Editor(id, editable, css) {
	var win =  document.getElementById(id).contentWindow
	,	doc = win.document
	,	$html = $('#'+id).contents().find('html')
	,	$body = $html.find('body');

	if (editable) {
		doc.designMode = 'On';
	}

	$html.css({
		'font-size': '14px',
		'font-family': 'Arial',
		'word-break': 'break-all'
	});
	if (css) $html.css(css);

	doc.onpaste = function(e) {
		SetClipboard(GetClipboard(), 'text');
	};

	doc.onmousewheel = function(e) {
		//doc.documentElement.scrollTop -= (e.wheelDelta)/12;
		//return false;
	};

	$html.click(function(){
		$body.focus();
		win.focus();
	});

	this.prepend = function(html) {
		$body.prepend(html);
	};

	this.append = function(html) {
		$body.append(html);
		doc.documentElement.scrollTop = $body.height();
	};

	this.event = function(event, callback) {
		if (event) {
			if (callback) {
				$body.bind(event, callback);
			} else if ($body[event]) {
				$body[event]();
			}
		}
	};

	this.focus = function() {
		$body.focus();
		win.focus();
	};

	this.css = function(style) {
		if (style) {
			$html.css(style);
		}
	};

	this.getData = function() {
		return $body.html();
	};

	this.clear = function() {
		$body.html('');
	};

	this.updateAvatar = function(src, pos) {
		$body.find('.unit-'+pos+' img.avatar').attr('src', src);
	};
}