var moment = require('moment-timezone');
var config = require('../settings');
var debug = config.debug;
var axios = require('axios');
var JsonFileTools =  require('./jsonFileTools.js');
//Jason modify on 2018.05.06 for switch local and cloud db -- start
var dbMap = require('./mongoMap.js');
var JsonFileTools =  require('./jsonFileTools.js');
var path = './public/data/finalList.json';
var path2 = './public/data/checkMap.json';
var path3 = './public/data/setting.json';
var userPath = './public/data/user.json';
var settings = require('../settings');
var linebot = require('linebot');

//Jason modify on 2018.05.06 for switch local and cloud db -- end
var finalList = {};
var checkEvent = {};
var checkMap= {};
init()

module.exports = {
    init,
    saveSetting,
    getSetting,
    getTabledata,
    parseMsgd,
    createMap,
    isDebug,
    addJSON,
    getCurrentTime,
    DateTimezone,
    getISODate,
    getMacString,
    getType,
    getCurrentUTCDate,
    sendLineMessage
}

function init() {
    dbMap.find({}).then(function(docs) {
        if(docs) {
            for(let i=0; i<docs.length;++i){
                let map = docs[i];
                checkMap[map.deviceType] = map;
            }
            JsonFileTools.saveJsonToFile(path2, checkMap);
        }
        
    }, function(reason) {
        console.log(getCurrentTime() + ' init err : ' + reason);
    });
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
}

function isDebug () {
    return config.debug;
}

function saveSetting (max, callback) {
    var json = {tempMax : Number(max)};
    try {
        JsonFileTools.saveJsonToFile(path3, json);
    }
    catch (e) {
        return callback(e.message);
    }
    return callback(null,'ok');
}

function getSetting () {
    try {
        var setting = JsonFileTools.getJsonFromFile(path3);
    }
    catch (e) {
        var setting = {};
        JsonFileTools.saveJsonToFile(path3, json);
    }
    return setting;
}

function parseMsgd(message) {
    var obj = null;
    try {
        if (getType(message) === 'string') {
            var mesObj = JSON.parse(message);
            if (getType(mesObj) === 'array') {
                obj = mesObj[0];
            } else if (getType(mesObj) === 'object') {
                obj = mesObj;
            }
        } else if (getType(message) === 'array'){
            obj = message[0];
        } else if (getType(mesObj) === 'object') {
            obj = message;
        }
        var mData = obj.data;
        var mMac  = obj.macAddr;
        var fport = '1';
        var utcMoment = null;
        var mRecv = '';
        var mExtra = {'gwip': obj.gwip,
                  'gwid': obj.gwid,
                  'rssi': obj.rssi,
                  'snr' : obj.snr,
                  'fport': obj.fport+'',
                  'frameCnt': obj.frameCnt,
                  'channel': obj.channel};
        if(obj.fport) {
            fport = obj.fport.toString();
            utcMoment = moment.utc(obj.time);
            mRecv = obj.time;
            mExtra = {'gwip': obj.gwip,
                  'gwid': obj.gwid,
                  'rssi': obj.rssi,
                  'snr' : obj.snr,
                  'fport': obj.fport+''};
        } else {
            utcMoment = moment.utc(obj.recv);
            mRecv = obj.recv;
            mExtra = obj.extra;
            mExtra.fport = parseInt(mData.substring(0,2),16) + '';
        }
        var timestamp = utcMoment.valueOf();
        var tMoment = (moment.unix(timestamp/1000)).tz(config.timezone);
        var mDate = tMoment.format('YYYY-MM-DD HH:mm:ss');
        
        //Get data attributes
        
        
        if(debug != true) {
            if (checkEvent[mMac] === undefined) {
                checkEvent[mMac] = obj;
            } else if (isRepeatEvent(checkEvent[mMac], obj)) {
                // It's repeat event 
                console.log('Repeat event drop!!!');
                return null;
            }
        }
    
        // console.log('mRecv : '+  mRecv);
        // console.log('mDate : '+ mDate);
        
    } catch (error) {
        return callback(error.message);
    }

    //Parse data
    if(mExtra.fport){
        var mType = mExtra.fport.toString();
        let map = checkMap[mType];
        if(map) {
            var mInfo = getTypeData(mData, map);
            if (debug) {
                console.log(getCurrentTime() + ' parsers : ' + JSON.stringify(mInfo));
            }
            
            if(mInfo){
                var msg = {macAddr: mMac, data: mData, timestamp: timestamp, recv: mRecv, date: mDate, type: mExtra.fport, typeName: map.typeName};
                console.log('**** '+msg.date +' mac:'+msg.macAddr+' => data:'+msg.data+'\ninfo:'+JSON.stringify(mInfo));
                msg.information=mInfo;
                
                if (debug) {
                    console.log(getCurrentTime() + ' parseMsgd message : ' + JSON.stringify(msg));
                }
                // sendLineMessage(mDate + ' newmessage');
                /*if (doc.profile) {
                    toCheckNotify(mInfo, doc.profile, mMac);
                }*/
                finalList[mMac]=msg;
                saveFinalListToFile ();
                return msg;
            } else {
                if (debug) {
                    console.log(new Date() + 'parseMsgd info is not exist');
                }
                return null;
            }
        } else {
            console.log(new Date() + 'No map for type '+ mType);
            return null;
        }
    } else {
        console.log(new Date() + 'parseMsgd fport is not exist');
        return null;
    }
}

function saveFinalListToFile () {
    JsonFileTools.saveJsonToFile(path,finalList);
}

function createMap (myobj) {
    
    dbMap.create(myobj).then(function(docs) {
        console.log('docs : ' + JSON.stringify(docs));
        console.log('init() ');
        init();
    }, function(reason) {
        console.log('err : ' + reason);
    });
}

function getTypeData(data,mapObj) {
    if (mapObj === undefined|| mapObj === null) {
        return null;
    }
    try {
        var obj = mapObj.map;
        var info = {};
        var keys = Object.keys(obj);
        var count = keys.length;
        for(var i =0;i<count;i++){
            //console.log( keys[i]+' : '+ obj[keys[i]]);
            let parseData =  getIntData(keys[i], obj[keys[i]],data);
            info[keys[i]] = parseData.toFixed(2);

            //info[keys[i]] = getIntData(keys[i], keys[i], obj[keys[i]],data);
            // console.log(keys[i] + ' : ' + info[keys[i]]);
        }
        return info;
    } catch (error) {
        return null;
    }
}

function getIntData(key, arrRange,initData){
    var ret = {};
    var start = arrRange[0];
    var end = arrRange[1];
    var diff = arrRange[2];
    var str = initData.substring(start,end);
    var data = parseInt(str,16);
    
    return eval(diff);
}

function parse(hex) {
    // 0000 03FC –> 1020 
    // FFFF FF68 –> -152 
    hex= parseInt(hex, 16); 
    hex= hex| 0xFFFFFFFF00000000; 
    // node.warn('hex:=' + hex);
    return hex;

}

function convertTime(dateStr){
    //method 1 - use convert function
    //var d = new Date();
    var d = new Date(dateStr);
    var d_ts = d.getTime(); //Date.parse('2017-09-12 00:00:00'); //get time stamp
    // console.log("showSize :"+ d);
    // console.log("showPos d_ts : " + d_ts);
    return d_ts;
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

function saveMsgToDB (msg) {
    mongoEvent.create(msg).then(function(docs) {
        console.log('saveMsgToDB docs : ' + JSON.stringify(docs));
    }, function(reason) {
        console.log('saveMsgToDB err : ' + reason);
    });
}

function addJSON(obj1, obj2) {
    let keys = Object.keys(obj2);
    for (let i=0;i<keys.length; i++) {
        obj1[keys[i]] = obj2[keys[i]];
    }
    return obj1;
}

function getCurrentTime() {
    var utcMoment = moment.utc();
    var timestamp = utcMoment.valueOf();
    var tMoment = (moment.unix(timestamp/1000)).tz(config.timezone);
    var time = tMoment.format('YYYY-MM-DD HH:mm:ss');
    return time;
}

function getCurrentUTCDate() {
    // var utcMoment = moment.utc();
    // return new Date( utcMoment.format("YYYY-MM-DDTHH:mm:ss") );
    var utcMoment = moment.utc();
    return utcMoment.format('YYYY-MM-DDTHH:mm:ss'); 
}

//var utcMoment = moment.utc(obj.time);
//var timestamp = utcMoment.valueOf();
//var tMoment = (moment.unix(timestamp/1000)).tz(config.timezone);
//var mDate = tMoment.format('YYYY-MM-DD HH:mm:ss');

function DateTimezone(offset) {

    // 建立現在時間的物件
    var d = new Date();
    
    // 取得 UTC time
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

    // 新增不同時區的日期資料
    return new Date(utc + (3600000*offset));

}

function getISODate(dateStr) {
    var utcMoment = moment.utc(dateStr);
    return new Date( utcMoment.format("YYYY-MM-DDTHH:mm:ss") );
}

function getMacString(mac) {
    if(mac.length === 8) {
        mac = '00000000' + mac;
    }
    return mac.toLowerCase();
}

function getUTCDate () {
    var utcMoment = moment.utc();
    return new Date( utcMoment.format("YYYY-MM-DDTHH:mm:ss") );
 }

function getMyDate (dateStr) {
    var myMoment = moment(dateStr, "YYYY-MM-DDTHH:mm:ss");
    var utcMoment = myMoment.utc(dateStr);
    return new Date( utcMoment.format("YYYY-MM-DDTHH:mm:ss") );
 }

 // sendLineMessage(mDate + ' newmessage');
 function  toCheckNotify(info, profile, mac) {
    if (config.channelId ==='' || config.channelSecret ==='' || config.channelAccessToken ==='') {
        return;
    }
    var keys = Object.keys(info);
    var message = '';
    var recv = getCurrentUTCDate();
    var time = getCurrentTime();
    var hStr = '超過';
    var lStr = '低於';
    for (let i = 0; i < keys.length; ++i) {
        let obj = profile[keys[i]];
        let data = info[keys[i]];
        if (obj.high !== '' && data > Number(obj.high) ) {
            message = message + ' ' + obj.title + hStr + obj.high;
        }
        if (obj.low !== '' && data < Number(obj.low) ) {
            message = message + ' ' + obj.title + lStr + obj.low;
        }
    }
    if (message !== '') {
        var sqlStr = 'select * from api_device_info where device_type = "LoRaM"';
        mysqlTool.query(sqlStr, function(err, result){
            if (err) {
                console.log(err);
                return;
            } else if (result === undefined || result === null) {
                console.log('unable get device');
                return;
            }

            var name = '';
            var cpId = '';
            if (err || result.length === 0) {
                name = mac;
            } else {
                for (let i = 0; i < result.length; ++i) {
                    if (result[i].device_mac === mac) {
                        cpId = result[i].device_cp_id;
                        break;
                    }
                }
                if (name === '') {
                    name = mac;
                }
            }
            //Jason fix cpId is null unable conert to string cause crash issue on 2018.04.29
            if (cpId === '') {
                return;
            } 
            var json = {type:'notify', subject:'異常通知', content: message, createUser: name, cpId: cpId.toString()};
            message = time + ' 裝置:' + name + message;
            sendLineMessage(message);
        });
    }
 }

function isRepeatEvent(checkObj, obj) {
    if (checkObj.frameCnt === obj.frameCnt) {
        var timestamp1 = moment.utc(checkObj.time).valueOf();
        var timestamp2 = moment.utc(obj.time).valueOf();
        var time = Math.abs(timestamp1 - timestamp2)/(60*1000);
        var checkTime = 10;
        if (time < checkTime) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
    return false;
}

function sendLineMessage (msg) {
    var bot = linebot({
        channelId: settings.channelId,
        channelSecret: settings.channelSecret,
        channelAccessToken: settings.channelAccessToken
    });
    var user = JsonFileTools.getJsonFromFile(userPath);
    if (user.friend.length > 0) {
        bot.multicast(user.friend, msg).then(function (data) {
            // success 
            console.log('push line :' + JSON.stringify(data));
        }).catch(function (error) {
            // error 
            console.log('push line error :' + error);
        });
    }
}

function getTabledata (lists) {
    var rows = 0;
    var mItem = 1;
    var array = [];
    console.log( 'Last Device Information \n '+JSON.stringify( lists[lists.length-1]));

    for (var i=0;i<lists.length;i++)
    {
        array.push(getArray(lists[i],mItem));
        
        mItem++;
    }
    return array;
}

function getArray (obj,item){
    var arr = [];
    if(item<10){
        arr.push('0'+item);
    }else{
        arr.push(item.toString());
    }
    
    arr.push(obj.date);
    arr.push(obj.data);
    var keys = Object.keys(obj.information);
    for (var i = 0;i < keys.length; i++) {
        arr.push(obj.information[keys[i]]);
    }
    return arr ;
}