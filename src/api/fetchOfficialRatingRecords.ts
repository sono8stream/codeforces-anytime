import ContestRecord from '../types/contestRecord';

export const fetchOfficialRatingRecordsAPI = async (handle: string) => {
  const url = `https://codeforces.com/api/user.rating?handle=${handle}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    const records: ContestRecord[] = [];
    for (const record of json?.result) {
      records.push({ ...record, contestID: record.contestId });
    }
    return records;
  } catch (e) {
    return e;
  }
};
