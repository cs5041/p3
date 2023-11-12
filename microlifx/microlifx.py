import sys
from lifxlan import LifxLAN, light
import serial
import json
import traceback
import logging
import time

logging.basicConfig(filename='log.log', encoding='utf-8', level=logging.DEBUG, format='%(asctime)s %(message)s')

colors = ['RED', 'ORANGE', 'YELLOW', 'GREEN', 'CYAN', 'BLUE', 'PURPLE', 'PINK', 'WHITE', 'COLD_WHITE', 'WARM_WHITE', 'GOLD']

try:
    logging.info("Discovering lights...")
    lifx = LifxLAN(4)

    devices = lifx.get_lights()
    logging.info("\nFound {} light(s):\n".format(len(devices)))

    # for d in devices:
    #     try:
    #         print(d)
    #     except:
    #         pass

    for d in devices:
        d.set_power(0)
        d.set_color(light.WHITE)
        d.set_brightness(0)
        d.set_power(1)

    lights = []

    for i in range(4):
        lights.append(lifx.get_device_by_name('Light' + str(i + 1)))

    last_message_time = {}

    with serial.Serial('/dev/ttyACM0', 115200, timeout=1) as ser:
        logging.info("Ready for commands...")
        while True:
            try:
                line = ser.readline().decode().rsplit(':', 1)
                if (len(line) != 2):
                    continue
                # logging.info(line)
                if len(line) == 2 and line[1].replace('\n', '').replace('\r', '').strip().isdigit() and len(line[0]) == int(line[1]):
                    data = json.loads(line[0])
                    if data['s'] == 0:
                        continue
                    if data['s'] in last_message_time and last_message_time[data['s']] + 1 >= time.time():
                        continue
                    last_message_time[data['s']] = time.time()
                    logging.info(data)
                    if data['y'] == 's':
                        val = data['v'].split(',')
                        logging.info(val)
                        # version_no, id_light, params
                        # v1 params: color_int
                        # v2 params: brightness
                        # v3 params: hue, saturation
                        # (hue (0-65535), saturation (0-65535), brightness (0-65535), Kelvin (2500-9000))
                        if len(val) < 3:
                            continue
                        if val[0] == 'v1':
                            lights[int(val[1]) - 1].set_color(getattr(light, colors[int(val[2])]))
                        elif val[0] == 'v2':
                            lights[int(val[1]) - 1].set_brightness(int(val[2]))
                        elif val[0] == 'v3':
                            lights[int(val[1]) - 1].set_hue(int(val[2]))
                            lights[int(val[1]) - 1].set_saturation(int(val[3]))
            except Exception as e:
                logging.error(traceback.format_exc())
except Exception as e:
    logging.error(traceback.format_exc())
