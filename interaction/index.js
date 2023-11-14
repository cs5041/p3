import { readFileSync } from 'node:fs';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDatabase, serverTimestamp, push, ref, query, orderByChild, equalTo, limitToLast, onChildAdded } from "firebase/database";

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

const firebasetoken = readFileSync('firebasetoken', { encoding: 'utf8' }).trim();
const openaitoken = readFileSync('openaitoken', { encoding: 'utf8' }).trim();

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    apiKey: openaitoken,
});
const openai = new OpenAIApi(configuration);

const systemPrompt = "You are a fun and cute baby rabbit. You only reply with one short sentence and under 80 characters. The reply must mention the color and the temperature.";

(async () => {
    const getToken = httpsCallable(functions, "getToken");
    const token = await getToken({ token: firebasetoken });
    if (token?.data?.result === "ok" && token?.data?.token) {
        const userCredentials = await signInWithCustomToken(auth, token.data.token);
        const user = userCredentials.user;

        const startTime = Date.now();

        let outsideTemp = 0;
        let insideTemp = 0;

        const scale = (fromRange, toRange) => {
            const d = (toRange[1] - toRange[0]) / (fromRange[1] - fromRange[0]);
            return from => (from - fromRange[0]) * d + toRange[0];
        };

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(1), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            console.log(data);
            outsideTemp = data.integer;
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(2), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            console.log(data);
            insideTemp = data.integer;
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(4), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime && data.integer === 1) {
                console.log(data);
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 21,
                    timestamp: serverTimestamp(),
                    type: "int",
                    integer: Math.random() * 360
                });
            }
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(5), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime) {
                console.log(data)
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 21,
                    timestamp: serverTimestamp(),
                    type: "int",
                    integer: Math.random() * 360
                });
            }
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(6), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime) {
                console.log(data)
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 22,
                    timestamp: serverTimestamp(),
                    type: "int",
                    integer: Math.random() * 100
                });
            }
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(7), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime) {
                console.log(data);
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 23,
                    timestamp: serverTimestamp(),
                    type: "int",
                    integer: Math.random() * 100
                });
            }
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(8), limitToLast(1)), async (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime && data.integer === 1) {
                console.log(data);

                const completion = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo-1106",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `A human has moved you next to a grey rabbit. Also, the outside temperature is ${outsideTemp} degrees C. What do you tell the human?` },
                    ],
                    temperature: 1,
                    max_tokens: 21
                });

                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 20,
                    timestamp: serverTimestamp(),
                    type: "str",
                    string: completion?.data?.choices?.[0]?.message?.content ?? `You picked the grey rabbit! And the outside temperature is ${outsideTemp}C`
                });
                const scaleTemp = scale([0, 20], [0, 1])
                const scaledTemp = scaleTemp(Math.max(0, Math.min(20, outsideTemp)));
                console.log(scaledTemp);
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 21,
                    timestamp: serverTimestamp(),
                    type: "int",
                    integer: scaledTemp * 360
                });
            }
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(9), limitToLast(1)), async (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime && data.integer === 1) {
                console.log(data);

                const completion = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `A human has moved you next to a white rabbit. Also, the inside temperature is ${insideTemp} degrees C. What do you tell the human?` },
                    ],
                    temperature: 1,
                    max_tokens: 21
                });

                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 20,
                    timestamp: serverTimestamp(),
                    type: "str",
                    string: completion?.data?.choices?.[0]?.message?.content ?? `You picked the white rabbit! And the inside temperature is ${insideTemp}C`
                });
                const scaleTemp = scale([0, 20], [0, 1])
                const scaledTemp = scaleTemp(Math.max(0, Math.min(20, insideTemp)));
                console.log(scaledTemp);
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 21,
                    timestamp: serverTimestamp(),
                    type: "int",
                    integer: scaledTemp * 360
                });
            }
        });
    } else {
        console.error(token?.data?.reason ?? "unknownError")
    }
})();