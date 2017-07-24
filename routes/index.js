var express = require('express');
var router = express.Router();
var DeviceDbTools = require('../models/deviceDbTools.js');
var ListDbTools = require('../models/listDbTools.js');
var UnitDbTools = require('../models/unitDbTools.js');
var settings = require('../settings');
var JsonFileTools =  require('../models/jsonFileTools.js');
var path = './public/data/finalList.json';
var path2 = './public/data/test.json';
var unitPath = './public/data/unit.json';
var hour = 60*60*1000;
var type = 'gps';

function findUnitsAndShowSetting(req,res,isUpdate){
	UnitDbTools.findAllUnits(function(err,units){
		var successMessae,errorMessae;
		var macTypeMap = {};

		if(err){
			errorMessae = err;
		}else{
			if(+units.length>0){
				successMessae = '查詢到'+units.length+'筆資料';
			}
		}
		req.session.units = units;

		console.log( "successMessae:"+successMessae );
		res.render('setting', { title: 'Setting',
			units:req.session.units,
			user:req.session.user,
			success: successMessae,
			error: errorMessae
		});
	});
}

module.exports = function(app) {
  app.get('/', function (req, res) {
  	    var now = new Date().getTime();
		finalList = JsonFileTools.getJsonFromFile(path);
	
		//var unitObj = JsonFileTools.getJsonFromFile(unitPath);

		//console.log('finalList :'+JSON.stringify(finalList));
		if(finalList){
			var keys = Object.keys(finalList);
			console.log('Index finalList :'+keys.length);
			for(var i=0;i<keys.length ;i++){
				//console.log( i + ') mac : ' + keys[i] +'=>' + JSON.stringify(finalList[keys[i]]));
				//console.log(i+' result : '+ ((now - finalList[keys[i]].timestamp)/hour));
				finalList[keys[i]].overtime = true;
				if( ((now - finalList[keys[i]].timestamp)/hour) < 24 )  {
					finalList[keys[i]].overtime = false;
				}
				//finalList[keys[i]].name = '';
				//console.log(i+' keys[i] : '+ keys[i]);
				//console.log(i+' unitObj[keys[i]] : '+ unitObj[keys[i]]);
				/*if( unitObj[keys[i]] )  {
					finalList[keys[i]].name = unitObj[keys[i]];
				}*/
			}
		}else{
			finalList = null;
		}

		res.render('index', { title: 'Index',
			success: null,
			error: null,
			finalList:finalList,
			type:type,
			co:settings.co
		});
  });

  app.get('/devices', function (req, res) {
	var mac = req.query.mac;
	var type = req.query.type;
	var date = req.query.date;
	var option = req.query.option;
	req.session.type = type;
	DeviceDbTools.findDevicesByDate(date,mac,Number(0),'desc',function(err,devices){
		if(err){
			console.log('find name:'+find_mac);
			return;
		}
		var length = 15;
		if(devices.length<length){
			length = devices.length;
		}

		/*devices.forEach(function(device) {
			console.log('mac:'+device.date + ', data :' +device.data);
		});*/

		res.render('devices', { title: 'Device',
			devices: devices,
			success: req.flash('success').toString(),
			error: req.flash('error').toString(),
			type:req.session.type,
			mac:mac,
			date:date,
			option:option,
			length:length,
			co:settings.co
		});
	});
  });

  app.get('/setting', function (req, res) {
		console.log('render to setting.ejs');
		findUnitsAndShowSetting(req,res,true);
  });

  app.post('/setting', function (req, res) {
		var	post_mac = req.body.mac;
		var post_name = req.body.name;
		var post_type = req.body.type_option;
		var post_mode = req.body.mode;
		var typeString = req.body.typeString;
		console.log('mode : '+post_mode);
		if(post_mode == 'new'){
			if(	post_mac && post_name && post_mac.length==8 && post_name.length>=1){
				console.log('post_mac:'+post_mac);
				console.log('post_name:'+post_name);
				UnitDbTools.saveUnit(post_mac,post_name,post_type,typeString,function(err,result){
					if(err){
						req.flash('error', err);
						return res.redirect('/setting');
					}
					findUnitsAndShowSetting(req,res,true);
				});
				var unitObj = JsonFileTools.getJsonFromFile(unitPath);
				unitObj[post_mac] = post_name;
				JsonFileTools.saveJsonToFile(unitPath,unitObj);
				return res.redirect('/setting');
			}
		}else if(post_mode == 'del'){//Delete mode
			post_mac = req.body.postMac;
			UnitDbTools.removeUnitByMac(post_mac,function(err,result){
				if(err){
					req.flash('error', err);
					console.log('removeUnitByMac :'+post_mac + err);
					return res.redirect('/setting');
				}else{
					req.flash('error', err);
					console.log('removeUnitByMac :'+post_mac + 'success');
				}
				findUnitsAndShowSetting(req,res,false);
			});
			var unitObj = JsonFileTools.getJsonFromFile(unitPath);
			if(unitObj[post_mac]){
				delete unitObj[post_mac];
			}
			
			JsonFileTools.saveJsonToFile(unitPath,unitObj);

		}else{//Edit mode
			post_mac = req.body.postMac;
			UnitDbTools.updateUnit(post_type,post_mac,post_name,null,typeString,function(err,result){
				if(err){
					req.flash('error', err);
					console.log('edit  :'+post_mac + err);
					return res.redirect('/setting');
				}else{
					console.log('edit :'+post_mac + 'success');
				}
				findUnitsAndShowSetting(req,res,false);
			});
     		var unitObj = JsonFileTools.getJsonFromFile(unitPath);
			unitObj[post_mac] = post_name;
			JsonFileTools.saveJsonToFile(unitPath,unitObj);
		}
  	});
};