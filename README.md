# About

Codeforces Anytime repository created by sono.
This application uses firebase for DB and hosting.

# Version

- Node.js: >=13.13.12
- React: ^16.13.1

# How to setup

## Firebase setup

### 1. Create Firebase project

Access to Firebase console with your google account.

### 2. Add web app to Firebase

After setup, copy your firebase config.

### 3. Create index.ts in src/firebase

Create 'firebase' folder in 'src', and within it, create 'index.ts' file.

After that, implement like below.

```TypeScript
import firebase from 'firebase/app';

// Add products to use
import 'firebase/auth';
import 'firebase/firestore';

const developConfig = {
    // Write your firebase config for develop
};

const productionConfig = {
    // Write your firebase config for production
};

const firebaseConfig =
  process.env.REACT_APP_ENV === 'production' ? productionConfig : developConfig;

firebase.initializeApp(firebaseConfig);

export default firebase;
```

### 4. Init Firebase in your project

In your cloned directory, run below.

```
$ npm i -g firebase-tools
$ firebase login
$ firebase init
```

## Google Analytics setup

### 1. Access Google Analytics console

Access to Google Analytics console with your google account.

### 2. Add project to Google Analytics

After creation, copy your Google Tag ID.

### 3. Create config.ts in src/ga

Create 'ga' folder in 'src', and within it, create 'config.ts' file.

After that, implement like below.

```TypeScript
const trackID: string = 'your Google Tag ID';

export default trackID;
```

# Debug

In your cloned directory, run below.

```
$ npm i
```

If you debug development env, run below.

```
$ npm start:develop
```

If you debug production env, run below.

```
$ npm start:production
```

Open http://localhost:3000

# How to update dependencies

```
$ npx npm-check-updates -u
$ npm install
```
