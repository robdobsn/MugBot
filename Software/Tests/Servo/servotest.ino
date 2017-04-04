

Servo myServoName;

void setup()
{
    Serial.begin(115200);
    myServoName.attach( D0 );
}

long ms = 0;
int ang = 20;
void loop()
{
    if (millis() > ms + 1000)
    {
        myServoName.write(ang);
        ang += 100;
        ang = ang % 130;
        ms = millis();
        Serial.printlnf("Set %d", ang);
    }

}
