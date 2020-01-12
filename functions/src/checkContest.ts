import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import UncheckedContests from './types/uncheckedContests';

interface CheckedContets {
  contests: Array<{ [key: number]: string }>;
}

interface RatingChangesResponse {
  status: string;
  result: RatingChange[];
}

interface RatingChange {
  contestId: string;
  contestName: string;
}

export const checkContest = functions.pubsub
  .schedule('every day 09:00')
  .onRun(async (context) => {
    const collection = admin.firestore().collection('availableContests');
    const uncheckedDoc = collection.doc('uncheckedContests');
    const uncheckedContests = (await uncheckedDoc.get()).data() as UncheckedContests;
    const contestIDs = uncheckedContests.contestIDs;
    const fetchUnit = 3;
    let fetchCnt = 0;
    while (contestIDs.length > 0 && fetchCnt < fetchUnit) {
      const contestID = contestIDs[contestIDs.length - 1];
      contestIDs.pop();
      const contestName = await validateContestName(contestID);
      if (contestName) {
        const checkedDoc = collection.doc('checkedContests');
        const checkedContests = (await checkedDoc.get()).data() as CheckedContets;
        await checkedDoc.update({
          contests: [...checkedContests.contests, { [contestID]: contestName }],
        });
        fetchCnt++;
      }
    }
    await uncheckedDoc.update({ contestIDs });
    return null;
  });

const validateContestName = async (id: number) => {
  const ratingChangeUrl = `https://codeforces.com/api/contest.ratingChanges?contestId=${id}`;
  const response = await fetch(ratingChangeUrl);
  if (!response.ok) {
    return '';
  }
  const ratingChangesResponse = (await response.json()) as RatingChangesResponse;
  return ratingChangesResponse.result
    ? ratingChangesResponse.result[0].contestName
    : '';
};
