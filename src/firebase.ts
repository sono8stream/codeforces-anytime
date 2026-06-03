import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const isProd = process.env.REACT_APP_ENV === 'production';
const firebaseConfig = JSON.parse(
  isProd
    ? (process.env.REACT_APP_FIREBASE_CONFIG_PRODUCTION ?? '{}')
    : (process.env.REACT_APP_FIREBASE_CONFIG_DEVELOP ?? '{}')
);

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
