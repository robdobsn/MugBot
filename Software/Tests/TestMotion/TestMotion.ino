#include "application.h"

SYSTEM_MODE(MANUAL);
SYSTEM_THREAD(ENABLED);

#include <AccelStepper.h>

// Define the steppers and the pins they will use
AccelStepper cylinderStepper(1, A7, A6);
AccelStepper penStepper(1, A5, A4);

void setup()
{
    // LED to blink
    pinMode(D7, OUTPUT);
    // Stepper Enable
    pinMode(D4, OUTPUT);
    digitalWrite(D4, true);
    // Limit switch on linear
    pinMode(D5, INPUT_PULLUP);
    // Debug
    Serial.begin(115200);
    delay(5000);
    Serial.printlnf("MugBot TestMotion motorEn(D4=%d) rot(A7=%d, A6=%d) lin(A5=%d, A4=%d)", D4, A7, A6, A5, A4);
}

bool particleConnectRequested = false;
unsigned long lastOutput = millis();
unsigned long lastStepPos = 0;
bool homePenStepper = true;
bool penStepperStarted = false;
int speedVal = 15000;

void loop()
{
    bool limitSw = digitalRead(D5);
    if (cylinderStepper.distanceToGo() <= 0)
    {
    	// Random change to speed, position and acceleration
    	// Make sure we dont get 0 speed or accelerations
        lastStepPos = lastStepPos + 3200 * ((rand() % 2 == 1) ? 1 : -1);
        double maxSpeed = (rand() % 800) + 200;
        double maxAccel = (rand() % 400) + 50;
        cylinderStepper.moveTo(lastStepPos);
        cylinderStepper.setMaxSpeed(maxSpeed);
    	cylinderStepper.setAcceleration(maxAccel);
    	/*cylinderStepper.moveTo(rand() % 200);
    	cylinderStepper.setMaxSpeed((rand() % 200) + 1);
    	cylinderStepper.setAcceleration((rand() % 200) + 1);*/
        Serial.printlnf("Dist to go reqd = %ld, maxSpeed %f, maxAccel %f", cylinderStepper.distanceToGo(), maxSpeed, maxAccel);
    }
    if (millis() > lastOutput + 2000)
    {
        digitalWrite(D7, !digitalRead(D7));
        lastOutput = millis();
        Serial.printlnf("Cylinder to go = %ld, Pen to go %ld, limit sw %d", cylinderStepper.distanceToGo(), penStepper.distanceToGo(), limitSw);
    }
    cylinderStepper.run();

    // Home sequence
    if (homePenStepper)
    {
        if (limitSw)
        {
            homePenStepper = false;
            penStepper.stop();
            penStepper.setCurrentPosition(0);
            penStepperStarted = false;
            Serial.println("Pen stepper home - set 0");
        }
        else
        {
            if (!penStepperStarted)
            {
                Serial.println("Pen stepper moveto 2000000");
                penStepper.moveTo(1000000);
                penStepper.setMaxSpeed(speedVal);
                penStepper.setAcceleration(speedVal);
                speedVal += 1000;
                if (speedVal > 20000)
                    speedVal = 20000;
                penStepperStarted = true;
            }
        }
    }
    else
    {
        if (!penStepperStarted)
        {
            Serial.println("Pen stepper moveto -600000");
            penStepper.moveTo(-600000);
            penStepper.setMaxSpeed(speedVal);
            penStepper.setAcceleration(speedVal);
            speedVal += 1000;
            penStepperStarted = true;
        }
        else if (penStepper.distanceToGo() == 0)
        {
            penStepperStarted = false;
            homePenStepper = true;
        }
    }
    penStepper.run();

    //if (System.buttonPushed() > 1000)
    if (!particleConnectRequested)
    {
        particleConnectRequested = true;
        Particle.connect();
    }
    if (particleConnectRequested)
    {
        if (Particle.connected())
        {
            Particle.process();
        }
    }
}
