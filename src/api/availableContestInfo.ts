import firebase from '../firebase';
import AvailableContestInfo from '../types/availableContestInfo';
export const fetchAvailableContestInfoAPI = async () => {
  try {
    const ref = firebase
      .firestore()
      .collection('availableContests')
      .doc('checkedContests');
    const snapshot = await ref.get();
    const data = snapshot.data()?.contests as AvailableContestInfo[];
    data.sort((a, b) => {
      if (a.startTimeSeconds < b.startTimeSeconds) {
        return 1;
      }
      if (a.startTimeSeconds > b.startTimeSeconds) {
        return -1;
      }
      return 0;
    });

    return data;
  } catch (e) {
    throw e;
  }
};
