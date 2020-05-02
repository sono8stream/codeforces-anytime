## About

Codeforces Anytime repository created by sono.
This application uses firebase for DB and hosting.

## How to setup

### Firebase setup

1. Create Firebase project

Access to Firebase console with your google account

2. Add web app to Firebase

After setup, copy your firebase config.

3. Create index.ts in src/firebase

In src/firebase folder, create index.ts and write it like below.

```TypeScript
import firebase from 'firebase/app';

// Add products to use
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
    // Write your firebase config
};

firebase.initializeApp(firebaseConfig);

export default firebase;
```

4. Init Firebase in your project

In your cloned directory, run below.

```
$ npm i -g firebase-tools
$ firebase login
$ firebase init
```

### Debug

In your cloned directory, run below.

```
$ npm i
$ npm start
```

Open http://localhost:3000

## How to update dependencies

```
$ npx npm-check-updates -u
$ npm install
```
