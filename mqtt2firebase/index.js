import { readFileSync } from 'node:fs';
import { connect } from 'mqtt';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDatabase, serverTimestamp, push, ref, onValue, query, orderByChild, equalTo, limitToLast } from "firebase/database";
import convert from 'color-convert';

const firebaseConfig = {
  apiKey: "AIzaSyDBjUEw_DQNMQsZJWfTtLL0PQJoH-xF0kk",
  authDomain: "sta-cs5041.firebaseapp.com",
  databaseURL: "https://sta-cs5041-p4.firebaseio.com",
  projectId: "sta-cs5041",
  storageBucket: "sta-cs5041.appspot.com",
  messagingSenderId: "639987847762",
  appId: "1:639987847762:web:c5a35616a1aa1cf243458b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);
const database = getDatabase(app);

const mqttpass = readFileSync('mqttpass', { encoding: 'utf8' }).trim();
const firebasetoken = readFileSync('firebasetoken', { encoding: 'utf8' }).trim();

const options = {
  clean: true,
  connectTimeout: 4000,
  username: 'cs5041',
  password: mqttpass,
}

const client = connect("mqtt://cs5041", options);

client.on('connect', function () {
  console.log('Connected');
  client.subscribe('zigbee2mqtt/+', function (err) {
    if (err) {
      console.error(err);
    }
  })
});

const deviceToGroupId = {
  "TH 1": {
    temperature: 1,
    humidity: 11
  },
  "TH 2": {
    temperature: 2,
    humidity: 12
  },
  "PIR 1": {
    occupancy: 3 // 0: no motion (false), 1: motion (true)
  },
  "PIR 2": {
    occupancy: 4
  },
  "Button 1": {
    action: 5 // 1 - single, 2 - double, 3 - long
  },
  "Button 2": {
    action: 6
  },
  "Button 3": {
    action: 7
  },
  "Contact 1": {
    contact: 8 // 0 - no contact (false), 1 - contact (true)
  },
  "Contact 2": {
    contact: 9
  }
}

const writeToFirebase = (uid, groupId, value) => {
  if (typeof value === 'number') {
    push(ref(database, "data"), {
      userId: uid,
      groupId: groupId,
      timestamp: serverTimestamp(),
      type: "int",
      integer: Math.round(value)
    });
  } else if (typeof value === 'boolean') {
    push(ref(database, "data"), {
      userId: uid,
      groupId: groupId,
      timestamp: serverTimestamp(),
      type: "int",
      integer: value ? 1 : 0
    });
  } else if (groupId === 5 || groupId === 6 || groupId === 7) {
    push(ref(database, "data"), {
      userId: uid,
      groupId: groupId,
      timestamp: serverTimestamp(),
      type: "int",
      integer: value === 'single' ? 1 : (value === 'double' ? 2 : (value === 'long' ? 3 : 0))
    });
  } else {
    push(ref(database, "/data"), {
      userId: uid,
      groupId: groupId,
      timestamp: serverTimestamp(),
      type: "str",
      string: val.toString()
    });
  }
}

const hslToRgb = (hsl) => {
  const hslData = [
    Math.max(0, Math.min(hsl?.[0] ?? 0, 360)),
    Math.max(0, Math.min(hsl?.[1] ?? 0, 100)),
    Math.max(0, Math.min(hsl?.[2] ?? 0, 80))
  ]
  return convert.hsl.rgb(hslData);
}

const writeToMqtt = (topic, data) => {
  if (typeof data === 'string' || typeof data === 'number') {
    client.publish(topic, data);
  } else {
    client.publish(topic, JSON.stringify(data));
  };
}

const updateLight = (lightId, hsl) => {
  const rgb = hslToRgb(hsl);
  writeToMqtt(`zigbee2mqtt/Light ${lightId}/set`, {
    color: {
      r: rgb?.[0] ?? 0,
      g: rgb?.[1] ?? 0,
      b: rgb?.[2] ?? 0
    },
    brightness: Math.floor((hsl[2] / 100) * 254)
  });
}

const writeText = (text) => {
  writeToMqtt(`mqtt2oled`, [text?.[0] ?? '', text?.[1] ?? '', text?.[2] ?? '']);
}

(async () => {
  const getToken = httpsCallable(functions, "getToken");
  const token = await getToken({ token: firebasetoken });
  if (token?.data?.result === "ok" && token?.data?.token) {
    const userCredentials = await signInWithCustomToken(auth, token.data.token);
    const user = userCredentials.user;

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(20), limitToLast(3)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('mqtt2oled', text);
      writeText(text.reverse())
    });

    let hues = [];
    let saturations = [];
    let brightnesses = [];
    let lightsUpdate = false;

    setInterval(() => {
      if (lightsUpdate) {
        const lights = hues.map((el, i) => [hues?.[i] ?? 0, saturations?.[i] ?? 0, brightnesses?.[i] ?? 0])
        console.log('lights', lights);
        lights.reverse().forEach((el, i) => updateLight(i + 1, el));
        lightsUpdate = false;
      }
    }, 1000);

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(21), limitToLast(5)), (snapshot1) => {
      hues = Object.values(snapshot1.val() ?? {}).map(el => parseInt(el?.integer ?? 0));
      console.log('lights hues', hues);
      lightsUpdate = true;
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(22), limitToLast(5)), (snapshot2) => {
      saturations = Object.values(snapshot2.val() ?? {}).map(el => parseInt(el?.integer ?? 0));
      console.log('lights saturations', saturations);
      lightsUpdate = true;
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(23), limitToLast(5)), (snapshot3) => {
      brightnesses = Object.values(snapshot3.val() ?? {}).map(el => parseInt(el?.integer ?? 0));
      console.log('lights brightnesses', brightnesses);
      lightsUpdate = true;
    });

    client.on('message', function (topic, message) {
      console.log(topic.toString(), message.toString());
      const topicArray = topic.split('/');
      if (topicArray.length === 2) {
        const device = topicArray[1];
        if (device in deviceToGroupId) {
          const mapping = deviceToGroupId[device];
          const messageObject = JSON.parse(message.toString());
          Object.entries(mapping).forEach(([field, groupId]) => {
            writeToFirebase(user.uid, groupId, messageObject[field])
          })
        }
      }
    });
  } else {
    console.error(token?.data?.reason ?? "unknownError")
  }
})();