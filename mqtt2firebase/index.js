import { readFileSync } from 'node:fs';
import { connect } from 'mqtt';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDatabase, serverTimestamp, push, ref, onValue, query, orderByChild, equalTo, limitToLast, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDBjUEw_DQNMQsZJWfTtLL0PQJoH-xF0kk",
  authDomain: "sta-cs5041.firebaseapp.com",
  databaseURL: "https://sta-cs5041-p3.firebaseio.com",
  projectId: "sta-cs5041",
  storageBucket: "sta-cs5041.appspot.com",
  messagingSenderId: "639987847762",
  appId: "1:639987847762:web:1d86691716f6fb5443458b"
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
  client.subscribe('weight2mqtt', function (err) {
    if (err) {
      console.error(err);
    }
  })
  client.subscribe('nfc2mqtt', function (err) {
    if (err) {
      console.error(err);
    }
  })
});

const deviceToGroupId = {
  "Hue Motion 1": {
    temperature: 3,
    illuminance_lux: 21,
    occupancy: 11
  },
  "Hue Motion 2": {
    temperature: 4,
    illuminance_lux: 22,
    occupancy: 12
  },
  "T&H 1": {
    temperature: 1,
    humidity: 5
  },
  "T&H 2": {
    temperature: 2,
    humidity: 6
  },
  "Motion 1": {
    occupancy: 9 // 0: no motion (false), 1: motion (true)
  },
  "Motion 2": {
    occupancy: 10
  },
  "Button 1": {
    action: 13 // 1 - single, 2 - double, 3 - long
  },
  "Button 2": {
    action: 14
  },
  "Button 3": {
    action: 15
  },
  "Button 4": {
    action: 16
  },
  "Button 5": {
    action: 17
  },
  "Button 6": {
    action: 18
  },
  "Button 7": {
    action: 19
  },
  "Door Contact 1": {
    contact: 20 // 0 - no contact (false), 1 - contact (true)
  },
}

const writeToFirebase = (uid, groupId, value) => {
  if (typeof value === 'number') {
    push(ref(database, "data"), {
      userId: uid,
      groupId: groupId,
      timestamp: serverTimestamp(),
      type: "number",
      number: value
    });
  } else if (typeof value === 'boolean') {
    push(ref(database, "data"), {
      userId: uid,
      groupId: groupId,
      timestamp: serverTimestamp(),
      type: "number",
      number: value ? 1 : 0
    });
  } else if (groupId === 5 || groupId === 6 || groupId === 7) {
    push(ref(database, "data"), {
      userId: uid,
      groupId: groupId,
      timestamp: serverTimestamp(),
      type: "number",
      number: value === 'single' ? 1 : (value === 'double' ? 2 : (value === 'long' ? 3 : 0))
    });
  } else {
    push(ref(database, "/data"), {
      userId: uid,
      groupId: groupId,
      timestamp: serverTimestamp(),
      type: "string",
      string: val.toString()
    });
  }
}

const writeToMqtt = (topic, data) => {
  if (typeof data === 'string' || typeof data === 'number') {
    client.publish(topic, data);
  } else {
    client.publish(topic, JSON.stringify(data));
  };
}

const updateLight = (lightId, r, g, b, brightness) => {
  writeToMqtt(`zigbee2mqtt/Light ${lightId}/set`, {
    color: {
      r: r ?? 0,
      g: g ?? 0,
      b: b ?? 0
    },
    brightness: brightness
  });
}

const writeText = (id, text) => {
  writeToMqtt(`mqtt2oled/${id}`, text);
}

(async () => {
  const getToken = httpsCallable(functions, "getToken");
  const token = await getToken({ token: firebasetoken });
  if (token?.data?.result === "ok" && token?.data?.token) {
    const userCredentials = await signInWithCustomToken(auth, token.data.token);
    const user = userCredentials.user;

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(30), limitToLast(3)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('mqtt2oled 0', text?.[0]);
      writeText(0, text?.[0])
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(31), limitToLast(3)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('mqtt2oled 1', text?.[0]);
      writeText(1, text?.[0])
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(32), limitToLast(3)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('mqtt2oled 2', text?.[0]);
      writeText(2, text?.[0])
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(33), limitToLast(3)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('mqtt2oled 3', text?.[0]);
      writeText(3, text?.[0])
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(34), limitToLast(3)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('mqtt2oled 4', text?.[0]);
      writeText(4, text?.[0])
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(35), limitToLast(3)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('mqtt2oled 5', text?.[0]);
      writeText(5, text?.[0])
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(36), limitToLast(1)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('light 1', text);
      try {
        const lightData = JSON.parse(text?.[0] ?? '{}');
        updateLight(1, lightData?.red, lightData?.green, lightData?.blue, lightData?.brightness)
      } catch (err) {
        console.error(err)
      }
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(37), limitToLast(1)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('light 2', text);
      try {
        const lightData = JSON.parse(text?.[0] ?? '{}');
        updateLight(2, lightData?.red, lightData?.green, lightData?.blue, lightData?.brightness)
      } catch (err) {
        console.error(err)
      }
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(38), limitToLast(1)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('light 3', text);
      try {
        const lightData = JSON.parse(text?.[0] ?? '{}');
        updateLight(3, lightData?.red, lightData?.green, lightData?.blue, lightData?.brightness)
      } catch (err) {
        console.error(err)
      }
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(39), limitToLast(1)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('light 4', text);
      try {
        const lightData = JSON.parse(text?.[0] ?? '{}');
        updateLight(4, lightData?.red, lightData?.green, lightData?.blue, lightData?.brightness)
      } catch (err) {
        console.error(err)
      }
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(40), limitToLast(1)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('light 5', text);
      try {
        const lightData = JSON.parse(text?.[0] ?? '{}');
        updateLight(5, lightData?.red, lightData?.green, lightData?.blue, lightData?.brightness)
      } catch (err) {
        console.error(err)
      }
    });

    onValue(query(ref(database, 'data'), orderByChild('groupId'), equalTo(41), limitToLast(1)), (snapshot) => {
      const data = snapshot.val();
      const text = Object.values(data ?? {}).map(el => el?.string?.toString() ?? '');
      console.log('light 6', text);
      try {
        const lightData = JSON.parse(text?.[0] ?? '{}');
        updateLight(6, lightData?.red, lightData?.green, lightData?.blue, lightData?.brightness)
      } catch (err) {
        console.error(err)
      }
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
      } else if (topicArray.length === 1) {
        const device = topicArray[0];
        if (device === 'weight2mqtt') {
          writeToFirebase(user.uid, 24, parseFloat(message.toString()))
        } else if (device === 'nfc2mqtt') {
          writeToFirebase(user.uid, 25, message.toString())
        }
      }
    });
  } else {
    console.error(token?.data?.reason ?? "unknownError")
  }
})();