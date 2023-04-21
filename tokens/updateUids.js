import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const admin = initializeApp({
    databaseURL: "https://sta-cs5041-p4.firebaseio.com"
});
const database = getDatabase(admin);

const dataRef = database.ref('/data');
const authRef = database.ref(`/auth`);

dataRef.once('value', function (snapshot) {
    authRef.once('value', function (snapshot1) {
        const userMap = snapshot1.val();
        Object.entries(snapshot.val()).forEach(async function ([key, value]) {
            const childKey = key;
            const childData = value;

            if (childData.userId.length === 36) {
                const uid = userMap[childData.userId].uid;
                dataRef.child(childKey).update({ userId: uid });
            }
        });
    });
});