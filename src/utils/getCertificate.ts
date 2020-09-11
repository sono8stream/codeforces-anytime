import ContestCertificate from '../types/contestCertificate';
import UserProfile from '../types/userProfile';

export const getCertificate = (profile: UserProfile, idx: number) => {
  const record = profile.records[idx];

  let deltaString;
  if (record.contestID === 0) {
    // If registration
    deltaString = '-';
  } else {
    if (record.newRating > record.oldRating) {
      deltaString = '+' + (record.newRating - record.oldRating).toString();
    } else {
      deltaString = record.newRating - record.oldRating;
    }
  }

  const performance =
    record.contestID === 0 ? 0 : 2 * record.newRating - record.oldRating;

  let rankString;
  switch (record.rank % 10) {
    case 1:
      rankString = record.rank + 'st';
      break;
    case 2:
      rankString = record.rank + 'nd';
      break;
    case 3:
      rankString = record.rank + 'rd';
      break;
    default:
      rankString = record.rank + 'th';
  }

  let isHighest = false;
  if (idx + 1 < profile.records.length) {
    isHighest = true;
    for (let i = idx + 1; i < profile.records.length; i++) {
      if (record.newRating <= profile.records[i].newRating) {
        isHighest = false;
        break;
      }
    }
  }

  return {
    handle: profile.handle,
    contestName: record.contestName,
    rankString,
    performance,
    oldRating: record.oldRating,
    newRating: record.newRating,
    deltaString,
    isHighest,
  } as ContestCertificate;
};
