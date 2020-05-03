import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';
import UncheckedContests from './types/uncheckedContests';

interface ContestListResponse {
  status: string;
  result: ContestData[];
}

interface ContestData {
  id: number;
  startTimeSeconds: number;
  relativeTimeSeconds: number;
}

export const addContestList = functions.pubsub
  .schedule('every monday 09:00')
  .onRun(async (context) => {
    const doc = admin
      .firestore()
      .collection('availableContests')
      .doc('uncheckedContests');
    const snapshot = await doc.get();
    const data = snapshot.data() as UncheckedContests;
    const lastUpdateTime = data.lastUpdateTime;
    const contests = await fetchContestList();
    const contestIDs = filterAddableContests(contests, lastUpdateTime);
    const updateTime = Math.floor(new Date().getTime() / 1000);
    await doc.update({
      contestIDs: [...data.contestIDs, ...contestIDs],
      lastUpdateTime: updateTime,
    });
    return null;
  });

const fetchContestList = async () => {
  const url = 'https://codeforces.com/api/contest.list';
  const response = await fetch(url);
  const contestListResponse = (await response.json()) as ContestListResponse;
  return contestListResponse.result;
};

const filterAddableContests = (
  contests: ContestData[],
  lastUpdateTime: number
) => {
  const contestIDs = [];
  for (const contest of contests) {
    if (
      contest.relativeTimeSeconds >= 0 &&
      contest.startTimeSeconds > lastUpdateTime
    ) {
      contestIDs.push(contest.id);
    }
  }
  return contestIDs;
};
