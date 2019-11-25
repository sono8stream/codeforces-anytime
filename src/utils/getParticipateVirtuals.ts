interface Submission {
  contestId: number;
  author: {
    participantType: string;
    startTimeSeconds: number;
  };
}

export interface ContestInfo {
  id: number;
  startTimeSeconds: number;
}

export const getParticipateVirtuals = async (
  handle: string,
  lastUpdateTime: number
): Promise<ContestInfo[]> => {
  const url = `https://codeforces.com/api/user.status?handle=${handle}`;
  const response = await fetch(url);
  const json = await response.json();
  const submissions = json.result as Submission[];
  const addedStartTimes = new Set<number>();
  const virtuals = new Array<ContestInfo>();
  for (const submission of submissions) {
    if (submission.author.startTimeSeconds < lastUpdateTime) {
      continue;
    }

    if (submission.author.participantType === 'VIRTUAL') {
      if (!addedStartTimes.has(submission.author.startTimeSeconds)) {
        virtuals.push({
          id: submission.contestId,
          startTimeSeconds: submission.author.startTimeSeconds,
        });
        addedStartTimes.add(submission.author.startTimeSeconds);
      }
    }
  }
  return virtuals.reverse();
};
