import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import UncheckedContests from './types/uncheckedContests';

interface CheckedContests {
  contests: ContestInfo[];
}

interface ContestInfo {
  id: number;
  name: string;
  durationSeconds: number;
  startTimeSeconds: number;
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
  .schedule('every day 10:00')
  .onRun(async (context) => {
    const collection = admin.firestore().collection('availableContests');
    const uncheckedDoc = collection.doc('uncheckedContests');
    const uncheckedContests = (
      await uncheckedDoc.get()
    ).data() as UncheckedContests;
    const checkedDoc = collection.doc('checkedContests');
    const checkedContests = (await checkedDoc.get()).data() as CheckedContests;
    const contestListResponse = await fetch(
      'https://codeforces.com/api/contest.list'
    );
    const contestListJson = await contestListResponse.json();
    const contestList = contestListJson.result as ContestInfo[];
    const contestIDs = uncheckedContests.contestIDs;

    const fetchUnit = 5;
    let fetchCnt = 0;
    while (contestIDs.length > 0 && fetchCnt < fetchUnit) {
      const contestID = contestIDs[contestIDs.length - 1];
      contestIDs.pop();
      const contestName = await validateContestName(contestID);
      if (contestName) {
        let durationSeconds = 0;
        let startTimeSeconds = 0;
        for (const contestInfo of contestList) {
          if (contestInfo.id === contestID) {
            durationSeconds = contestInfo.durationSeconds;
            startTimeSeconds = contestInfo.startTimeSeconds;
          }
        }

        checkedContests.contests.push({
          id: contestID,
          name: contestName,
          durationSeconds,
          startTimeSeconds,
        });
        fetchCnt++;
      }
    }

    const batch = admin.firestore().batch();
    batch.update(checkedDoc, {
      contests: checkedContests.contests,
    });
    batch.update(uncheckedDoc, { contestIDs });
    await batch.commit();
    return null;
  });

const validateContestName = async (id: number) => {
  const ratingChangeUrl = `https://codeforces.com/api/contest.ratingChanges?contestId=${id}`;
  const response = await fetch(ratingChangeUrl);
  if (!response.ok) {
    return '';
  }
  const ratingChangesResponse = (await response.json()) as RatingChangesResponse;
  return ratingChangesResponse.result && ratingChangesResponse.result[0]
    ? ratingChangesResponse.result[0].contestName
    : '';
};
