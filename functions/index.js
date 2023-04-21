const functions = require("firebase-functions");
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');

const { pbkdf2Sync } = require('node:crypto');

const admin = initializeApp({
    databaseURL: "https://sta-cs5041-p4.firebaseio.com"
});
const database = getDatabase(admin);

exports.getToken = functions.https.onCall(async (data, context) => {
    const token = data?.token;
    if (token && token.length === 36) {
        const authToken = await database.ref(`auth`).child(token).once('value');
        if (authToken.exists()) {
            const userObject = authToken.val();
            const key = pbkdf2Sync(token, userObject.salt, 100000, 32, 'sha512');
            const customToken = await getAuth(admin).createCustomToken(key.toString('hex'), userObject?.iot === 1 ? { iot: 1 } : {});
            return {
                result: 'ok',
                token: customToken
            };
        }
    }
    return {
        result: 'error',
        reason: 'invalidUser'
    };
});