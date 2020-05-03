import firebase from '../firebase';
import UserProfile from '../types/userProfile';

export const fetchProfileAPI = async (userID: string) => {
  try {
    const ref = firebase.firestore().collection('users').doc(userID);
    const snapshot = await ref.get();
    const data = snapshot.data();
    return data as UserProfile;
  } catch (e) {}
};
