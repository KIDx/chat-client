var Datastore = require('nedb')
,	path = require('path')
,	db = new Datastore({ filename: path.join(global.gui.App.dataPath, 'users.db'), autoload: true });

function User() {
}

User.update = function(Q, H, callback) {
	db.update(Q, H, {upsert: true}, function(err){
		if (err) {
			console.log('User.update Error!');
		}
		if (callback)
			return callback(err);
	});
};

User.get = function(Q, sq, callback) {
	db.find(Q).sort(sq).exec(function(err, docs){
		if (err) {
			console.log('User.get Error!');
		}
		return callback(err, docs);
	});
};

User.findOne = function(Q, callback){
	db.findOne(Q, function(err, doc){
		if (err) {
			console.log('User.findOne Error!');
		}
		return callback(err, doc);
	});
};

module.exports = User;