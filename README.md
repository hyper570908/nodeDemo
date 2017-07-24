# nodeDemo

A MQTT message save and manager tool,for parse subscribe data from self-built MQTT broker.

### Prerequisites

You need install the MQTT broker and MongoDB.

## MQTT Broker setting

Install: npm install mosca bunyan -g

Start  : mosca -v | bunyan

Host   : localhost
Port   : 1883

## MongoDB setting

1.Download and install:
  https://www.mongodb.com/download-center?jmp=nav#community

2.Create a storage location for the database file
  MongoDB default database folder path is C:\data\db

3.Create a log location for the server log
  MongoDB default log path is C:\data\log

4.Create C:\data\config\mongod.cfg ，：Enter the following text in the file
	logpath= C:\data\log\mongod.log
	dbpath=C:\data\db

5.Added as a service to start:
  sc.exe create MongoDB binPath= "\"C:\Program Files\MongoDB\Server\3.2\bin\mongod.exe\" --service --config=\"C:\data\config\mongod.cfg\"" DisplayName= "MongoDB" start= "auto"


## Getting Started

1. cd nodeDemo-master
2. npm install
3. index <http://localhost:3000>
4. node-red <http://localhost:3000/red>


## Copyright and license

Copyright 2017 Gemteks Corp. under [the Apache 2.0 license](LICENSE).
