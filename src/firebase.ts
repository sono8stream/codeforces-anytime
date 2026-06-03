import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const developConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG_DEVELOP ?? '{}');
const productionConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG_PRODUCTION ?? '{}');

const firebaseConfig =
  process.env.REACT_APP_ENV === 'production' ? productionConfig : developConfig;

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
