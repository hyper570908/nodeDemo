// grab the things we need
var mongoose = require('./mongoose.js');
var Schema = mongoose.Schema;
var moment = require('moment');

// create a schema
var eventSchema = new Schema({
  macAddr : { type: String},
  data: { type: String},
  recv: { type: Date},
  date: { type: String},
  timestamp: { type: Number},
  information: { type: Schema.Types.Mixed}
});

// the schema is useless so far
// we need to create a model using it
var EventModel = mongoose.model('Event', eventSchema);

function saveEventMsg (obj,callback) {

    var now = moment().format('YYYY-MM-DD HH:mm:ss');;
    console.log(now + ' Debug : saveEventMsg');

    var newEvent = new EventModel({
        macAddr    : obj.macAddr,
        data       : obj.data,
        recv       : obj.recv,
        date       : obj.date,
        timestamp  : obj.timestamp,
        information: obj.information
    });

    console.log('$$$$ EventModel : '+JSON.stringify(newEvent));

    newEvent.save(function(err){
        if(err){
            console.log(now + ' Debug : Event save fail!');
            return callback(err);
        }else{
            console.log(now + ' Debug : Event save success!');
            return callback(err,"OK");
        }
    });
};

function findByMac (find_mac,callback) {
    if(find_mac.length>0){
            //console.log('find_mac.length>0');
            EventModel.find({ macAddr: find_mac }, function(err,events){
                if(err){
                    return callback(err);
                }
                var now = moment().format('YYYY-MM-DD HH:mm:ss');

                if (events.length>0) {
                    console.log(now+' findByMac() : '+ events.length+' records');
                    return callback(err,events);
                }else{
                    console.log('找不到資料!');
                    return callback('找不到資料!');
                }
            });
    }else{
        console.log('find_name.length=0');
        return callback('MAC資料未填寫!');
    }
};

/*Find all of unit
*/
function findAllEvents (calllback) {

    EventModel.find((err, Events) => {
        var now = moment().format('YYYY-MM-DD HH:mm:ss');
        if (err) {
            console.log(now+'Debug : findAllEvents err:', err);
            return calllback(err);
        } else {
            console.log(now+'Debug : findAllEvents success\n:',Events.length);
            return calllback(err,Events);
        }
    });
};

function toFindEvents(json,calllback) {

    EventModel.find(json,(err, Events) => {
        var now = moment().format('YYYY-MM-DD HH:mm:ss');
        if (err) {
            console.log(now+'Debug : toFindEvents() err:', err);
            return calllback(err);
        } else {
            console.log(now+'Debug :toFindEvents() success\n:',Events.length);
            return calllback(err,Events);
        }
    });
}

function findEvents (json,calllback) {

    EventModel.find(json,(err, Events) => {
        var now = moment().format('YYYY-MM-DD HH:mm:ss');
        if (err) {
            console.log(now+'Debug : findEvents err:', err);
            return calllback(err);
        } else {
            console.log(now+'Debug :findEvents success\n:',Events.length);
            return calllback(err,Events);
        }
    });
};

/*Find events by date
*date option: 0:one days 1:one weeks 2:one months 3:three months
*/
function findEventsByDate (dateStr,mac,dateOption,order,calllback) {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : findEventsByDate()');
    console.log('-mac : '+mac);
    var nowMoment = moment(dateStr, "YYYY-MM-DD hh:mmss");
    var now = nowMoment.toDate();

    var from;
    switch(dateOption) {
    case 0:
        from =  nowMoment.subtract(1,'days').toDate();
        break;
    case 1:
        from =  nowMoment.subtract(1,'weeks').toDate();
        break;
    case 2:
        from =  nowMoment.subtract(1,'months').toDate();
        break;
    case 3:
        from =  nowMoment.subtract(3,'months').toDate();
        break;
    default:
        from =  nowMoment.subtract(3,'months').toDate();
    }
    console.log( 'now :'+now );
    console.log( 'from :'+from );

    var json = {macAddr:mac,
                recv:{
                    $gte:from,
                    $lt:now
                }
        }

        EventModel.find(json,(err, Events) => {
        if (err) {
            console.log('Debug : findEvents err:', err);
            return calllback(err);
        } else {
            console.log('Debug :findEvents success\n:', Events.length);
            var events = [];
            if(order == 'asc' && Events.length>0){
                events = Events.sort(dynamicSort('-date'));
            } else {
                events = Events.sort(dynamicSort('date'));
            }
            console.log('After sort : first events \n:',JSON.stringify(events[0]));
            console.log('After sort : last events \n:',JSON.stringify(events[events.length-1]));
            return calllback(err,events);
        }
    });
};

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true && JSON.stringify(obj) === JSON.stringify({});
}

module.exports = {
  saveEventMsg,
  findAllEvents,
  findEvents,
  findEventsByDate,
  findLastEvent,
  findLastEventByMac,
  findLastEventByMacIndex,
  findByMac
}

//Find last record by mac
function findLastEventByMac (mac,calllback) {
    return toFindLastEvent({macAddr:mac},calllback);
};

function findLastEventByMacIndex (mac,_index,calllback) {
    return toFindLastEvent({macAddr:mac,index:_index},calllback);
};

//Find last record by json
function findLastEvent (json,calllback) {
    return toFindLastEvent(json,calllback);
};

function toFindLastEvent(json,calllback) {
    EventModel.find(json).sort({recv: -1}).limit(1).exec(function(err,events){
        var now = moment().format('YYYY-MM-DD HH:mm:ss');
        if(err){
            console.log(now+'Debug eventDbTools find Last event By Unit -> err :'+err);
            return calllback(err,null);
        }else{
            console.log(now+'Debug eventDbTools find Last event By Unit('+json+') -> event :'+ events.length);
            return calllback(err,events[0]);
        }
    });
}