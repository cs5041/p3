import sys
from lifxlan import LifxLAN, light
import serial
import json
print("Discovering lights...")
lifx = LifxLAN(4)

devices = lifx.get_lights()
print("\nFound {} light(s):\n".format(len(devices)))

for d in devices:
    try:
        print(d)
    except:
        pass

for d in devices:
    d.set_power(0)
    d.set_color(light.WHITE)

lights = []

for i in range(4):
    lights.append(lifx.get_device_by_name('Light' + str(i + 1)))

for l in lights:
    l.set_brightness(10000)
    l.set_colortemp(2700)
    l.set_power(0)
