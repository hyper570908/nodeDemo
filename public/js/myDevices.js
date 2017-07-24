console.log("Message admin device information");
var connected = false;
var host = window.location.hostname;
var port = window.location.port;
var opt2={
    //"order": [[ 2, "desc" ]],
    "iDisplayLength": 100,
    dom: 'Blrtip',
    buttons: [
        'copyHtml5',
        //'excelHtml5',
        'csvHtml5',
        //'pdfHtml5'
    ]
};
var table = $('#table1').dataTable(opt2);

if(location.protocol=="https:"){
  var wsUri="wss://"+host+":"+port+"/ws/devices";
} else {
  var wsUri="ws://"+host+":"+port+"/ws/devices";
}
console.log(wsUri);
var ws=null;

function wsConn() {
  ws = new WebSocket(wsUri);
  ws.onmessage = function(m) {
    //console.log('< from-node-red:',m.data);
    if (typeof(m.data) === "string" && m. data !== null){
      var msg =JSON.parse(m.data);
      console.log("from-node-red : id:"+msg.id);
      if(msg.id === 'init_table'){
          //Remove init button active
          //console.log("v : "+msg.v);

          //Reload table data
          //console.log("v type:"+typeof(msg.v));

          table.fnClearTable();
          var data = JSON.parse(msg.v);
          //console.log("addData type : "+ typeof(data)+" : "+data);
          if(data){
              table.fnAddData(data);
          }
          waitingDialog.hide();
      }
    }
  }
  ws.onopen = function() {
    var mac = document.getElementById("mac").value;
    var type = document.getElementById("type").value;
    var date = document.getElementById("date").value;
    var option= document.getElementById("option").value;
    var host = window.location.hostname;
    var port = window.location.port;
    var json = {mac:mac,type:type,date:date,option:option,host:host,port:port};
    //alert('date :'+ date);
    connected = true;
    var obj = {"id":"init","v":json};
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

function setButton(_id,_v){ // update slider
  myselect = $("#"+_id);
   myselect.val(_v);
   myselect.slider('refresh');
}

function toSecondTable(mac){
    //alert("mac : "+mac);
    //document.location.href="/device?mac="+mac;
}

function showDialog(){
    //waitingDialog.show('Custom message', {dialogSize: 'sm', progressType: 'warning'});
    waitingDialog.show();
    setTimeout(function () {
      waitingDialog.hide();
      }, 5000);
}

function back(){
    //alert('back');
    location.href=document.referrer;
}

$(document).ready(function(){
    showDialog();


  $('#chartBlock').tabs({
    onSelect:function(title){
        if(title==='DO'){
              alert(title);
             $('#my_tabs').tabs('load', 0);
        }
      },
      onLoad:function(panel){
        alert(panel.panel('options').title+' is loaded')
      }
    })

});