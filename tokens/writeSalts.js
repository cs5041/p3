import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

import { randomBytes } from 'node:crypto';

const admin = initializeApp({
    databaseURL: "https://sta-cs5041-p4.firebaseio.com"
});
const database = getDatabase(admin);

const authRef = database.ref(`auth`);

authRef.once('value', snapshot => {
    snapshot.forEach(childSnapshot => {
        const childData = childSnapshot.val();
        if (!childData?.salt) {
            const childKey = childSnapshot.key;
            const updates = {
                salt: randomBytes(8).toString('hex')
            };
            console.log(childKey, updates);
            authRef.child(childKey).update(updates, (error) => {
                if (error) {
                    console.log('Data could not be saved.' + error);
                } else {
                    console.log('Data saved successfully.');
                }
            });
        }
    });
}).then(() => {
    console.log('Update completed.');
}).catch(error => {
    console.error('Update failed:', error);
});