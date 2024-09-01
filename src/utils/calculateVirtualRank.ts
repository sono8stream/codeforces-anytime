interface Result {
  contest: { name: string; durationSeconds: number };
  rows: {
    party: {
      members: { handle: string }[];
      participantType: string;
      ghost: boolean;
      startTimeSeconds: number;
    };
    rank: number;
  }[];
}

export const calculateVirtualRank = async (data: {
  contestID: number;
  handle: string;
  startTime: number;
  nowTime: number;
}): Promise<{ contestName: string; myRank: number; endTime: number }> => {
  const { contestID, handle, startTime, nowTime } = data;
  const url = `https://codeforces.com/api/contest.standings?contestId=${contestID}&showUnofficial=true`;
  try {
    const response = await fetch(url).catch((err) => null);
    if (response == null || !response.ok) {
      throw new Error('Cannot access');
    }
    const json = await response.json();
    const result = json.result as Result;
    const contestName = result.contest.name;
    const durationSeconds = result.contest.durationSeconds;
    if (startTime + durationSeconds > nowTime) {
      throw new Error('Not finished');
    }
    let myRank = 0;
    let cnt = 0;
    let assignedRank = 0;
    let nowRank = 0;
    for (const user of result.rows) {
      if (user.rank === 0) {
        break;
      }
      const party = user.party;
      const members = party.members;
      const isMe = members.find((item) => item.handle === handle) !== undefined;
      if (isMe && party.startTimeSeconds !== startTime) {
        continue;
      }
      if (!isMe && (party.participantType !== 'CONTESTANT' || party.ghost)) {
        continue;
      }

      members.forEach(() => {
        cnt++;
        if (user.rank !== assignedRank) {
          nowRank = cnt;
          assignedRank = user.rank;
        }
      });
      if (isMe) {
        myRank = nowRank;
        break;
      }
    }
    return { contestName, myRank, endTime: startTime + durationSeconds };
  } catch (e) {
    throw e;
  }
};
