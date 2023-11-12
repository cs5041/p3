import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

import { v4 as uuidv4 } from 'uuid';

const admin = initializeApp({
    databaseURL: "https://sta-cs5041-auth.firebaseio.com"
});
const database = getDatabase(admin);

const authRef = database.ref(`auth`);

new Array(50).fill(null).map(el => uuidv4()).forEach(el => {
    authRef.child(el).set({
        note: 'generated'
    });
    console.log(el);
});
