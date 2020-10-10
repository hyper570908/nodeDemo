var express = require('express');
var router = express.Router();
var settings = require('../settings');
var JsonFileTools =  require('../models/jsonFileTools.js');
var path = './public/data/finalList.json';
var path2 = './public/data/checkMap.json';
var hour = 60*60*1000;
var test = true;


module.exports = function(app) {
  app.get('/', function (req, res) {
		var now = new Date().getTime();
		var event = null,
			finalList = null;
		try{
	        finalList = JsonFileTools.getJsonFromFile(path);
	    } catch(e) {
	        console.log('Get finalList error : ' + e);
	        finalList = {};
	        JsonFileTools.saveJsonToFile(path, finalList);
	    }
	    if (finalList === null) {
	        finalList = {};
	    }

		var keys = Object.keys(finalList);
		if (keys.length > 0) {
			event = finalList[keys[0]];
		}
		res.render('index', {
			title: '首頁',
			event: event,
			finalList: finalList
		});
  });

  app.get('/setting', function (req, res) {
		res.render('setting', {
			title: '設定'
		});
  });

  // Jason add on 2017.11.16
  app.get('/finalList', function (req, res) {
		var events = {},
		    selectedType = null,
			finalList = null;
		try{
	        finalList = JsonFileTools.getJsonFromFile(path);
	    } catch(e) {
	        console.log('Get finalList error : ' + e);
	        finalList = {};
	        JsonFileTools.saveJsonToFile(path, finalList);
	    }
	    if (finalList === null) {
	        finalList = {};
		}
		var checkMap = {};
		try {
			checkMap = JsonFileTools.getJsonFromFile(path2);
		}
		catch (e) {
			checkMap = {};
			JsonFileTools.saveJsonToFile(finalPath, checkMap);
		}
		var maps = Object.values(checkMap);
		var keys2 = Object.keys(finalList);
		for(let i=0;i < keys2.length; i++) {
			let mac = keys2[i];
			
			let obj = finalList[mac];
			let type = obj.type;
			if(i==0){
				selectedType = type;
			}
			if(events[type] === undefined) {
				events[type] = [];
			}
			events[type].push(obj);
		}

		res.render('finalList', {
			title: '最新資訊',
			finalList: events[selectedType],
			devices: events,
			maps: maps
		});
  });

  app.get('/map', function (req, res) {
	const dbMap = require('../models/mongoMap.js');
	var postType = req.flash('type').toString();
	var successMessae,errorMessae;
	errorMessae = req.flash('error').toString();
	
	dbMap.find({}).then(function(docs) {
        /*if(docs) {
            for(let i=0; i<docs.length;++i){
                let map = docs[i];
                checkMap[map.deviceType] = map;
            }
            JsonFileTools.saveJsonToFile(path2, checkMap);
		}*/
		console.log(docs);
		return res.render('map', { title: '裝置類型',
			user:req.session.user,
			target:null,//current map
			maps: docs,//All maps
			error: errorMessae,
			success: successMessae
		});
        
    }, function(reason) {
		console.log(getCurrentTime() + ' init err : ' + reason);
		return res.redirect('/login');//返回登入頁
    });
	
	/*myapi.getMapList(name, function(err, result){
		if(err) {
			return res.redirect('/login');//返回登入頁
		}
		return res.render('map', { title: 'Map',
			user:req.session.user,
			target:null,//current map
			maps: result,//All maps
			error: errorMessae,
			success: successMessae
		});
	});*/
	});

  app.post('/map', function (req, res) {
	const dbMap = require('../models/mongoMap.js');
	var	postType = req.body.postType;
	var postSelect = req.body.postSelect;
	
	var error = '';
	var mapObj = {};
	var fieldNameObj = {};
	if (postSelect == 'new' || postSelect == 'edit') {
		try {
			var field = req.body.field;
			var start = req.body.start;
			var	end = req.body.end;
			var method = req.body.method;
			var fieldName = req.body.fieldName;

			if (field) {
				if (field && typeof(field) === 'string') {
					mapObj[field] = [Number(start), Number(end), method];
					fieldNameObj[field] = fieldName;
				} else {
					for (let i=0; i<field.length; ++i) {
						//New map if exist has same data
						if(mapObj[field]) {
							req.flash('error', '輸入感測類型重複');
							return res.redirect('/map');
						}
						mapObj[field[i]] = [Number(start[i]), Number(end[i]), method[i]];
						fieldNameObj[field[i]] = fieldName[i];
					}
				}
			}
		} catch (error) {
			console.log(error);
			req.flash('error', error);
			return res.redirect('/map');
			return;
		}

	}

	console.log('postType:' + postType);
	console.log('postSelect:' + postSelect);
	var url = settings.api_server + settings.api_get_map_list;

	if(postSelect == "del"){//Delete mode
		//Del map
		let query = {deviceType: postType};
		dbMap.remove(query).then(function(docs) {
			console.log('docs : ' + JSON.stringify(docs));
			return res.redirect('/map');
		}, function(reason) {
			console.log('err : ' + reason);
			req.flash('error', reason);
			return res.redirect('/map');
		});

	}else if(postSelect == "new"){//New account
		let myobj = {
			deviceType: postType,
			typeName: req.body.typeName,
			map: mapObj,
			fieldName:fieldNameObj,
			createUser: "test",
  			createTime:  new Date()
		};
		
		dbMap.create(myobj).then(function(docs) {
			console.log('docs : ' + JSON.stringify(docs));
			return res.redirect('/map');
		}, function(reason) {
			console.log('err : ' + reason);
			req.flash('error', reason);
			return res.redirect('/map');
		});

	}else if(postSelect == "edit"){
		let myobj = {
			typeName: req.body.typeName,
			map: mapObj,
			fieldName:fieldNameObj
		};
		let query = {deviceType: postType};
		dbMap.update(query, myobj).then(function(docs) {
			console.log('docs : ' + JSON.stringify(docs));
			return res.redirect('/map');
		}, function(reason) {
			console.log('err : ' + reason);
			req.flash('error', reason);
			return res.redirect('/map');
		});
	} else {
		//Select map
		req.flash('error', '');
		return res.redirect('/map');
	}
 });

  app.get('/devices', function (req, res) {
		var	mac = req.query.mac;
		var	date = req.query.date;
		var	option = req.query.option;
		var checkMap = null;
		var finalList = null;
		try{
			finalList = JsonFileTools.getJsonFromFile(path);
	    } catch(e) {
	        console.log('Get finalList error : ' + e);
	        finalList = {};
	        JsonFileTools.saveJsonToFile(path, finalList);
	    }
	    if (finalList === null) {
	        finalList = {};
		}
		checkMap = JsonFileTools.getJsonFromFile(path2);
		let obj = finalList[mac];
		var keys = Object.keys(obj.information);
		let type = obj.type;
		let field = [];
		if(checkMap[type]) {
			let fieldName = checkMap[type]['fieldName'];
			
			for(let i=0; i<keys.length;i++) {
				field.push(fieldName[keys[i]]);
			}
		}

		res.render('devices', {
			title: '裝置列表',
			field: field,
			mac:mac,
			date: date,
			test: test,
			option: option
		});
  });
};