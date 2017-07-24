console.log("message manager");
var now = new Date();
var date = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
var connected = false;
var initBtnStr ="#pir";
var type = document.getElementById("type").value;
var host = window.location.hostname;
var port = window.location.port;

var opt2={
     "order": [[ 2, "desc" ]],
     "iDisplayLength": 25
 };

var table = $("#table1").dataTable(opt2);
if(location.protocol=="https:"){
  var wsUri="wss://"+window.location.hostname+":"+window.location.port+"/ws/";
} else {
  var wsUri="ws://"+window.location.hostname+":"+window.location.port+"/ws/";
}
console.log("wsUri:"+wsUri);
var ws=null;

function wsConn() {
  ws = new WebSocket(wsUri);
  ws.onmessage = function(m) {
    //console.log('< from-node-red:',m.data);
    if (typeof(m.data) === "string" && m. data !== null){
      var msg =JSON.parse(m.data);
      console.log("from-node-red : id:"+msg.id);
      if(msg.id === 'change_table'){
          //Remove init button active
          console.log("initBtnStr:"+initBtnStr+"remove active");
          //$(initBtnStr).siblings().removeClass("active");
          $(initBtnStr).addClass().siblings().removeClass("active");
          //Reload table data
          console.log("v type:"+typeof(msg.v));

            table.fnClearTable();
            var data = JSON.parse(msg.v);
            if(data){
                  //console.log("addData type : "+ typeof(data)+" : "+data);
                  table.fnAddData(data);
                  table.$('tr').click(function() {
                  var row=table.fnGetData(this);
                  toSecondTable(row[1]);
              });
            }
      }else if(msg.id === 'init_btn'){
          //Set init button active
          console.log("highlight type:"+typeof(msg.v)+" = "+ msg.v);
          type = msg.v;
          initBtnStr  ='#'+msg.v;
      }
    }
  }

  ws.onopen = function() {

    connected = true;

    var obj = {"id":"init","v":type};
    var getRequest = JSON.stringify(obj);
    console.log("getRequest type : "+ typeof(getRequest)+" : "+getRequest);
    console.log("ws.onopen : "+ getRequest);
    ws.send(getRequest);      // Request ui status from NR
    console.log(getRequest);
  }
  ws.onclose   = function()  {
    console.log('Node-RED connection closed: '+new Date().toUTCString());
    connected = false;
    ws = null;
  }
  ws.onerror  = function(){
    console.log("connection error");
  }
}
wsConn();           // connect to Node-RED server


function myFunction(id){  // update device
  console.log(id);
  if(ws){
      console.log("ws.onopen OK ");
  }
  console.log("id type : "+ typeof(id)+" : "+id);
  type = id;
  initBtnStr = "#"+id;
  var obj = {"id":"change_type","v":id};
  var objString = JSON.stringify(obj);
  console.log("getRequest type : "+ typeof(objString)+" : "+objString);
  console.log("ws.onopen : "+ objString);
  ws.send(objString);     // Request ui status from NR
  console.log("sent change_type requeset");

}

function toSecondTable(mac){
    //alert("mac :"+mac);
    var date =document.getElementById("date").value;
    var option =document.getElementById("time_option").value;
    //alert("date :"+date);
    document.location.href="/devices?mac="+mac+"&type="+type+"&date="+date+"&option="+option;
}

function newPage(){
    //alert('back');
    location.href="/gateway";
}


$(document).ready(function(){

    table.$('tr').click(function() {
        var row=table.fnGetData(this);
        toSecondTable(row[1]);

    });
    new Calendar({
        inputField: "date",
        dateFormat: "%Y/%m/%d",
        trigger: "BTN",
        bottomBar: true,
        weekNumbers: true,
        showTime: 24,
        onSelect: function() {this.hide();}
    });



    if(document.getElementById("date").value === ''){
      document.getElementById("date").value = date;
    }

      //table = $("#table1").dataTable(opt2);

          table.$('tr').click(function() {
              var row=table.fnGetData(this);
              toSecondTable(row[1]);

          });
          new Calendar({
              inputField: "date",
              dateFormat: "%Y/%m/%d",
              trigger: "BTN",
              bottomBar: true,
              weekNumbers: true,
              showTime: false,
              onSelect: function() {this.hide();}
          });
});