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

const systemPrompt = "You are a fun and cute baby rabbit. You only reply with one short sentence and under 80 characters. The reply must mention the temperature.";

(async () => {
    const getToken = httpsCallable(functions, "getToken");
    const token = await getToken({ token: firebasetoken });
    if (token?.data?.result === "ok" && token?.data?.token) {
        const userCredentials = await signInWithCustomToken(auth, token.data.token);
        const user = userCredentials.user;

        const startTime = Date.now();

        let outsideTemp = 0;
        let insideTemp = 0;

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(1), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            console.log(data);
            insideTemp = data.number;
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(2), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            console.log(data);
            outsideTemp = data.number;
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(13), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime && data.number === 1) {
                console.log(data);
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 36,
                    timestamp: serverTimestamp(),
                    type: "string",
                    string: JSON.stringify({
                        red: Math.floor(Math.random() * 255),
                        green: Math.floor(Math.random() * 255),
                        blue: Math.floor(Math.random() * 255),
                        brightness: Math.floor(Math.random() * 255)
                    })
                });
            }
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(14), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime && data.number === 1) {
                console.log(data);
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 37,
                    timestamp: serverTimestamp(),
                    type: "string",
                    string: JSON.stringify({
                        red: Math.floor(Math.random() * 255),
                        green: Math.floor(Math.random() * 255),
                        blue: Math.floor(Math.random() * 255),
                        brightness: Math.floor(Math.random() * 255)
                    })
                });
            }
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(11), limitToLast(1)), async (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime && data.number === 1) {
                console.log(data);

                const completion = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo-1106",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: `The outside temperature is ${outsideTemp} degrees C. What do you tell the human?` },
                    ],
                    temperature: 1,
                    max_tokens: 21
                });

                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 30,
                    timestamp: serverTimestamp(),
                    type: "string",
                    string: completion?.data?.choices?.[0]?.message?.content ?? `The outside temperature is ${outsideTemp}C`
                });
            }
        });
    } else {
        console.error(token?.data?.reason ?? "unknownError")
    }
})();