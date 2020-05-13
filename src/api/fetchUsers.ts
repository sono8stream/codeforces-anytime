import firebase from '../firebase';
import UserProfile from '../types/userProfile';

export const fetchUsersAPI = async () => {
  try {
    const ref = firebase.firestore().collection('users');
    const snapshot = await ref.get();
    const users: { [id: string]: UserProfile } = {};
    snapshot.forEach((doc) => {
      users[doc.id] = doc.data() as UserProfile;
    });
    return users;
  } catch (e) {
    throw e;
  }
};
