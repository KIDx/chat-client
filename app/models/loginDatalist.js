var Datastore = require('nedb')
,	path = require('path')
,	db = new Datastore({ filename: path.join(global.gui.App.dataPath, 'loginDatalist.db'), autoload: true });

function Datalist() {
}

Datalist.update = function(Q, H, callback) {
	db.update(Q, H, {upsert: true}, function(err){
		if (err) {
			console.log('Datalist.update Error!');
		}
		if (callback)
			return callback(err);
	});
};

Datalist.get = function(Q, sq, callback) {
	db.find(Q).sort(sq).exec(function(err, docs){
		if (err) {
			console.log('Datalist.get Error!');
		}
		return callback(err, docs);
	});
};

module.exports = Datalist;