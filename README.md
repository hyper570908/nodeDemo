# Lora-demo
Lora上報資料
有首頁即時顯示,歷史資料及裝置類型等功能頁面

## Init page
安裝相依模組
npm install

## Run 
1.node app.js
2.http://localhost:3000 (to home page)
3.http://localhost:3000/red (to start Node-Red)
4.進入Node-Red頁面,將flow匯入
5.到 MQTT訂閱 flow 修改立即顯示layout

## Introduction
1.當設定或加入新的裝置類型須重啟server
2.需先設定裝置類型,才能在上報資料進行解析
3.裝置上報 data 前兩個字元用來做裝置類型, 舉例 0a0dbacf12
  0a為10  上報資料為裝置類型10的設定規則解析資料


