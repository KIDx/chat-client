var Datastore = require('nedb')
,	path = require('path')
,	db = new Datastore({ filename: path.join(global.gui.App.dataPath, global.session.user.name), autoload: true });

function Chatlog() {
}

Chatlog.insert = function(doc, callback) {
	db.insert(doc, function(err){
		if (err) {
			console.log('Chatlog.insert Error!');
		}
		if (callback)
			return callback(err);
	});
};

Chatlog.get = function(Q, a, d, i, callback) {
	db.find(Q).sort({inDate: -1}).skip(i > 1 ? a+(i-2)*d : 0).limit(a+(i-1)*d).exec(function(err, docs){
		if (err) {
			console.log('Chatlog.get Error!');
		}
		return callback(err, docs);
	});
};

Chatlog.multiUpdate = function(Q, H, callback){
	db.update(Q, H, {multi: true}, function(err){
		if (err) {
			console.log('Chatlog.multiUpdate Error!');
		}
		if (callback)
			return callback(err);
	});
};

Chatlog.update = function(Q, H, callback){
	db.update(Q, H, function(err){
		if (err) {
			console.log('Chatlog.update Error!');
		}
		if (callback)
			return callback(err);
	});
};

Chatlog.clear = function() {
	db.remove({}, {multi: true}, function(err){
		console.log("clear finished.");
	});
};

module.exports = Chatlog;