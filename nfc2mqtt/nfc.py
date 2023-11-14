"""
This example shows connecting to the PN532 with I2C (requires clock
stretching support), SPI, or UART. SPI is best, it uses the most pins but
is the most reliable and universally supported.
After initialization, try waving various 13.56MHz RFID cards over it!
"""

import RPi.GPIO as GPIO

from pn532 import *

import paho.mqtt.client as mqtt

import base64

from cryptography.hazmat.primitives.kdf.scrypt import Scrypt

mqttpass = ""
with open("mqttpass") as password_file:
    mqttpass = password_file.read().strip(" \n\r")

salt = ""
with open("salt") as salt_file:
    salt = salt_file.read().strip(" \n\r")
    salt = base64.b64decode(salt) 

def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

client = mqtt.Client()
client.on_connect = on_connect
client.username_pw_set("cs5041", mqttpass)

client.connect("cs5041", 1883, 60)

client.loop_start()

try:
    pn532 = PN532_SPI(debug=False, reset=20, cs=4)
    #pn532 = PN532_I2C(debug=False, reset=20, req=16)
    #pn532 = PN532_UART(debug=False, reset=20)

    ic, ver, rev, support = pn532.get_firmware_version()
    print('Found PN532 with firmware version: {0}.{1}'.format(ver, rev))

    # Configure PN532 to communicate with MiFare cards
    pn532.SAM_configuration()

    print('Waiting for RFID/NFC card...')
    while True:
        # Check if a card is available to read
        uid = pn532.read_passive_target(timeout=0.5)
        # Try again if no card is available.
        if uid is None:
            continue
        kdf = Scrypt(
            salt=salt,
            length=32,
            n=2**14,
            r=8,
            p=1,
        )
        key = kdf.derive((''.join([hex(i) for i in uid])).encode('utf-8'))
        key = key.hex()
        print('Found card with hashed UID:', key)
        client.publish('nfc2mqtt', key)
except Exception as e:
    print(e)
finally:
    GPIO.cleanup()
