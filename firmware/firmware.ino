#include <TinyGPS++.h>
#include <Adafruit_NeoPixel.h>
#include "FS.h"
#include "SPIFFS.h"
#include <WiFi.h>


//#define INDOOR_TEST

//#define SERVER_IP           "10.12.181.117"
//#define SERVER_PORT         5000
#define SERVER_IP           "10.0.60.1"
#define SERVER_PORT         80
#define WIFI_SSID           "Movuino"
#define WIFI_PASSWORD       "Movuino2021"


static const uint32_t GPSBaud = 9600;
#define RXD2                38
#define TXD2                39
#define BUTTON_PIN          13
#define NUMPIXELS           1
#define PIN                 15
#define digitalRead(BUTTON_PIN) !digitalRead(BUTTON_PIN)
#define READ_BUFFER_SIZE 100

// SOFTWARE
#define MOV_ID              "mov24"
#define FIRMWARE_VERSION    "1.0"
#define SAMPLE_RATE         "1"

#define RED     255, 0, 0
#define WHITE   255, 255, 255
#define GREEN   0, 255, 0
#define ORANGE  255,215,0


// The TinyGPS++ object
TinyGPSPlus gps;
Adafruit_NeoPixel     pixels = Adafruit_NeoPixel(1, PIN, NEO_GRB + NEO_KHZ800);
File                  file;
bool                  first_coord = true;
bool                  button_state;
unsigned int          button_t0;
WiFiClient            client;


// The serial connection to the GPS device

#ifdef INDOOR_TEST
void waitForGPS(void) {
  delay(2000);
  // Acts like satellirte is fixed
}
#else
void waitForGPS(void) {
  while (!(Serial2.available() > 0 && gps.encode(Serial2.read()) && gps.location.isValid())) {
    Serial.println(gps.charsProcessed());
    Serial.println(gps.failedChecksum());
  }
}
#endif

void write_data()
{
 if (!first_coord) {
    file.printf(",");
  }
  first_coord = false;
  file.printf("[%f, %f, %lu]", gps.location.lat(), gps.location.lng(), millis());
}

void waitForLongPress(void)
{
  uint16_t t0;
  bool button;

  while (true) {
    button = digitalRead(BUTTON_PIN);
    if (button) {
      t0 = millis();
      while (button) {
        button = digitalRead(BUTTON_PIN);
        if (millis() - t0 > 1000) {
          Serial.println(F("Starting recording loop..."));
          pixels.setPixelColor(0, pixels.Color(RED)); pixels.show();
          while (digitalRead(BUTTON_PIN));
          return ;
        }
      }
    }
  }
}

void initPixel(void) {
  Serial2.begin(GPSBaud, SERIAL_8N1, RXD2, TXD2);
  pixels.begin();
  pixels.show();
  pixels.setPixelColor(0, pixels.Color(WHITE));
  pixels.show();
}

void send_post(void)
{
  uint16_t            t0;
  uint16_t            bytesread;
  unsigned long long  content_size;
  char                readBuffer[READ_BUFFER_SIZE];

  client.connect(SERVER_IP, SERVER_PORT);
  client.println("POST /api/upload HTTP/1.1");
  client.println("Host: 10.12.181.117");
  client.println("User-Agent: Arduino/1.0");
  client.println("Connection: close");
  client.println("Content-Type: application/json");
  client.print("Content-Length: ");
  client.printf("%d\n", file.size());
  client.println();
  bytesread = READ_BUFFER_SIZE - 1;
  while (file.available() && bytesread == (READ_BUFFER_SIZE - 1)) {
    bytesread = file.readBytes(readBuffer, READ_BUFFER_SIZE - 1);
    readBuffer[bytesread] = '\0';
    client.printf("%s", readBuffer);
  }

  file.close();
  client.stop();
  
  for (int i = 0; i < 10; i++) {
    pixels.setPixelColor(0, i % 2 == 0 ? pixels.Color(0, 0, 50) : pixels.Color(0, 0, 0));
    pixels.show();
    delay(100);
  }
  pixels.setPixelColor(0,  pixels.Color(50, 50, 50));
  pixels.show();
  while (1);
}

void send_data(void) {
  IPAddress     remoteIP;
  
  Serial.println("send data");
  pixels.setPixelColor(0, pixels.Color(0, 50, 0)); pixels.show();
  Serial.printf("Establishing connection to WiFi with SSID: %s | PASSWORD: %s\n", WIFI_SSID, WIFI_PASSWORD);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    if (WiFi.status() == WL_CONNECT_FAILED)
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.println("Establishing connection to WiFi..");
    delay(1000);
  }
  Serial.println("Connected to WiFi");

  file.printf("]}");
  file.close();
  file = SPIFFS.open("/data.txt");
  Serial.println(file.size());
//  postFile(file, SERVER_IP, SERVER_PORT, "/api/upload", "application/json");
send_post();

}

void write_fake_data(void) {

  float lat = 42.42;
  float lng = 24.24;
  if (!first_coord) {
    file.printf(",");
  }
  first_coord = false;
  file.printf("[%f, %f, %lu]", lat, lng, millis());
  Serial.printf("lat %f | lng %f\n", lat, lng);
  
}


void setup()
{
  int err;
  
  Serial.begin(115200);
  initPixel();
  Serial.println();
  Serial.println(F("DORA Firmware"));
  Serial.println(F("by Severin Ferard"));
  Serial.println();
  err = SPIFFS.begin(true);
  Serial.println(err ? "SPIFFS Mounted successfully": "SPIFFS Mount Failed");
  Serial.println(F("Formating SPIFFS"));
  Serial.println(F("This might take a few seconds..."));
  err = SPIFFS.format();
  Serial.println(err ? "SPIFFS formated successfully" : "Error formating SPIFFS");
  err = (file = SPIFFS.open("/data.txt", "w"));
  Serial.println(err? "File successfully opened for Writing": "File opening failed");
  Serial.println(file.print("{\"id\": \"" MOV_ID"\",\"firmwareVersion\":" FIRMWARE_VERSION ", \"sampleRate\":" SAMPLE_RATE",\"data\": [") ? "wrote to file successfully" : "error writing file");

  Serial.println(F("Waiting for a satellite signals..."));
  pixels.setPixelColor(0, pixels.Color(ORANGE)); pixels.show();
  waitForGPS();
  Serial.println(F("Signal found. GPS is Fixed"));
  pixels.setPixelColor(0, pixels.Color(GREEN)); pixels.show();
  Serial.println(F("Waiting for user input..."));
  waitForLongPress();

}

void loop()
{
  button_state = digitalRead(BUTTON_PIN);
  if (button_state) {
    button_t0 = millis();
    while (button_state) {
      button_state = digitalRead(BUTTON_PIN);
      if (millis() - button_t0 > 1000) {
        send_data();
        while (1);
      }
    }
  }
#ifdef INDOOR_TEST
  write_fake_data();
  delay(1000);
#else
  if (Serial2.available() > 0 && gps.encode(Serial2.read()) && gps.location.isUpdated())
    write_data();
#endif
}
