import paho.mqtt.client as mqtt
import json

import board
import digitalio
from PIL import Image, ImageDraw, ImageFont
import adafruit_ssd1306

import textwrap
import re

# Define the Reset Pin
oled_reset = digitalio.DigitalInOut(board.D24)

# Change these
# to the right size for your display!
WIDTH = 128
HEIGHT = 64
BORDER = 5

# Use for SPI
spi = board.SPI()
oled_cs = digitalio.DigitalInOut(board.D8)
oled_dc = digitalio.DigitalInOut(board.D23)
oled1 = adafruit_ssd1306.SSD1306_SPI(WIDTH, HEIGHT, spi, oled_dc, oled_reset, oled_cs)

# Use for I2C.
i2c = board.I2C()  # uses board.SCL and board.SDA
# i2c = board.STEMMA_I2C()  # For using the built-in STEMMA QT connector on a microcontroller
oled2 = adafruit_ssd1306.SSD1306_I2C(WIDTH, HEIGHT, i2c, addr=0x3D)
oled3 = adafruit_ssd1306.SSD1306_I2C(WIDTH, HEIGHT, i2c, addr=0x3C)

oleds = [oled1, oled2, oled3]

# Clear display.
for oled in oleds:
    oled.fill(0)
    oled.show()

def drawText(text, oled):
    # Create blank image for drawing.
    # Make sure to create image with mode '1' for 1-bit color.
    image = Image.new("1", (oled.width, oled.height))

    # Get drawing object to draw on image.
    draw = ImageDraw.Draw(image)
    # Load default font.
    font = ImageFont.load_default()

    # Draw Some Text
    lines = textwrap.wrap(text, width=20)
    (left, top, right, bottom) = font.getbbox(text)
    (font_width, font_height) = (right - left, bottom - top)
    draw.text(
        (0,0),
        '\n'.join(lines),
        font=font,
        fill=255,
    )

    # Display image
    oled.image(image)
    oled.show()

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("mqtt2oled/+")

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print(msg.topic + " " + msg.payload)
    topicPath = msg.topic.split('/')
    if len(topicPath) == 2:
        text = re.sub(u'[^\\x00-\\x7F\\x80-\\xFF\\u0100-\\u017F\\u0180-\\u024F\\u1E00-\\u1EFF]', u'', msg.payload)
        olednum = topicPath[1]
            if oledconfig == 'left':
                if olednum >= 0 and olednum < 3:
                    drawText(text, oleds[olednum])
            elif oledconfig == 'right':
                if olednum >= 3 and olednum < 6:
                    drawText(text, oleds[olednum -3])

mqttpass = ""
with open("mqttpass") as password_file:
    mqttpass = password_file.read().strip(" \n\r")

oledconfig = ""
with open("oledconfig") as config_file:
    oledconfig = config_file.read().strip(" \n\r")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.username_pw_set("cs5041", mqttpass)

client.connect("cs5041", 1883, 60)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()