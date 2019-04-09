#include <SHT2x.h>
#include <Timer.h>
#include <SoftwareSerial.h> //for LoRa UART

SoftwareSerial LoRaUART(10, 11); //set pin 10 for rx & 11 for tx
SHT2x SHT2x;

int fport;
float get_t, get_h;
byte data[4] = {0};
char buff[64] = {0};

Timer t1;
int testID;
//Jason add for receive lora at_command on 2019.03.22
bool startRecieve;
String s = "";
uint8_t len = 0; // received command length
uint8_t tmp_buff[20];

void setup()
{
    Serial.begin(9600);
    SHT2x.begin();
    fport = 0x0A;
    //init LoRa UART
    LoRaUART.begin(9600);
    LoRaUART.println("AT");
    while(!LoRaUART.available())
    {
    }
    Serial.println("LoRa UART Ready");
    delay(2000);
    getData();
    testID = t1.every(60000, getData);
}

void loop()
{
    t1.update();
    
    // t1.stop(testID);
}

void getData() 
{
  //get data
    get_t = SHT2x.GetTemperature();
    get_h = SHT2x.GetHumidity();
    Serial.print("Temperature: ");
    Serial.print(get_t);
    Serial.print("C / Humidity: ");
    Serial.print(get_h);
    Serial.println("%");

    //send data
    uint16_t tmp = 0;
    tmp = (uint16_t)(get_t * 100);
    data[0] = (byte)((tmp>>8) & 0x00FF);
    data[1] = (byte)(tmp & 0x00FF);
    tmp = (uint16_t)(get_h * 100);
    data[2] = (byte)((tmp>>8) & 0x00FF);
    data[3] = (byte)(tmp & 0x00FF);
    sprintf(buff, "AT+DTX=10,%02X%02X%02X%02X%02X", fport, data[0], data[1], data[2], data[3]);
    // sprintf(buff, "AT+DTX=8,%02X%02X%02X%02X", data[0], data[1], data[2], data[3]);
    LoRaUART.println(buff);
    Serial.println("*** Send Data ***");
    Serial.println(buff);  
}
