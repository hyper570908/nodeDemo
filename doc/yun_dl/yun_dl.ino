#include <Wire.h>
#include <SoftwareSerial.h>

SoftwareSerial LoRaUART(10, 11);

void setup() 
{
   Serial.begin(9600);
   LoRaUART.begin(9600);  
   Serial.println("Serial Ready");
   Serial.println("AT+DTX=5,1122334455");
   LoRaUART.println("AT+DTX=5,1122334455");
   pinMode(13, OUTPUT);
 }

String s = "";
String j = "";
    
void loop() 
{
  s = "";
  j = "";
  if(LoRaUART.available())
  {
    s = LoRaUART.readString();
    Serial.println(s); 
    
    if (s.indexOf("Radio Rx Done")>=0) 
    {
        Serial.println("AT+DRX?");
        LoRaUART.println("AT+DRX?");
        String readString = "";             //Clear String
        while (!LoRaUART.available()) 
        {delay(100);}
        j="";
        j = LoRaUART.readString();
        Serial.println(j);
        int inx_h = j.indexOf(":");
        int inx_t = j.indexOf(",");
        int inx_e = j.indexOf("\r");
        String data_len = j.substring(inx_h+1,inx_t);
        Serial.println(data_len);
        String data = j.substring(inx_t+1,inx_e);
        Serial.println(data);
        if(data == "aa") 
        {
          digitalWrite(13, HIGH);
        } 
        else
        {
          digitalWrite(13, LOW);
        }
    }
  }
  else
  {
    Serial.println("No DL data");
  }
  
    String readString = "";                 //Clear String
    delay(2000);
}
