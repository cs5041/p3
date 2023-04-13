import { readFileSync } from 'node:fs';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDatabase, serverTimestamp, push, ref, query, orderByChild, equalTo, limitToLast, onChildAdded } from "firebase/database";

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

const firebasetoken = readFileSync('firebasetoken', { encoding: 'utf8' }).trim();

(async () => {
    const getToken = httpsCallable(functions, "getToken");
    const token = await getToken({ token: firebasetoken });
    if (token?.data?.result === "ok" && token?.data?.token) {
        const userCredentials = await signInWithCustomToken(auth, token.data.token);
        const user = userCredentials.user;

        const startTime = Date.now();

        let outsideTemp = 0;

        const scale = (fromRange, toRange) => {
            const d = (toRange[1] - toRange[0]) / (fromRange[1] - fromRange[0]);
            return from => (from - fromRange[0]) * d + toRange[0];
        };

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(1), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            console.log(data);
            outsideTemp = data.integer;
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(4), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime) {
                console.log(data);
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

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(8), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime) {
                console.log(data);
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 20,
                    timestamp: serverTimestamp(),
                    type: "str",
                    string: "You picked the grey rabbit!"
                });
            }
        });

        onChildAdded(query(ref(database, 'data'), orderByChild('groupId'), equalTo(9), limitToLast(1)), (snapshot) => {
            const data = snapshot.val();
            if (data.timestamp > startTime) {
                console.log(data);
                push(ref(database, "data"), {
                    userId: user.uid,
                    groupId: 20,
                    timestamp: serverTimestamp(),
                    type: "str",
                    string: "You picked the white rabbit!"
                });
            }
        });
    } else {
        console.error(token?.data?.reason ?? "unknownError")
    }
})();