var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');//Jason add on 2016.09.26
var routes = require('./routes/index');
var todos = require('./routes/todos');//Jason add on 2017.02.21
//Jason add on 2017.02.16 - start
var RED = require("node-red");
var http = require('http'),
    https = require('https');
var session = require('express-session');
var settings = require('./settings');
var flash = require('connect-flash');
//Jason add on 2017.02.16 - end
var app = express();

var port = process.env.PORT || 3000;
console.log('Server listen port :'+port);
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/todos', todos);
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  resave: false,
  saveUninitialized: true
}));
app.use('/todos', todos);
routes(app);
var server = http.createServer(app);

// Create the settings object - see default settings.js file for other options
var setting = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/",
    userDir:"./.nodered/",
    functionGlobalContext: {
      momentModule:require("moment"),
      deviceDbTools:require("./models/deviceDbTools.js"),
      msgTools:require("./models/msgTools.js"),
      listeDbTools:require("./models/listDbTools.js"),
      settings:require("./settings.js"),
    }    // enables global context
};

// Initialise the runtime with a server and settings
RED.init(server,setting);

// Serve the editor UI from /red
app.use(setting.httpAdminRoot,RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(setting.httpNodeRoot,RED.httpNode);

server.listen(port);

// Start the runtime
RED.start();