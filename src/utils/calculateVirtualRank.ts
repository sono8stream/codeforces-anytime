interface Result {
  contest: { name: string };
  rows: Array<{
    party: {
      members: Array<{ handle: string }>;
      participantType: string;
      ghost: boolean;
      startTimeSeconds: number;
    };
    rank: number;
  }>;
}

export const calculateVirtualRank = async (data: {
  contestID: number;
  handle: string;
  startTime: number;
}): Promise<{ contestName: string; myRank: number }> => {
  const { contestID, startTime } = data;
  const url = `https://codeforces.com/api/contest.standings?contestId=${contestID}&showUnofficial=true`;
  try {
    const response = await fetch(url).catch((err) => null);
    if (response == null || !response.ok) {
      throw new Error('Cannot access');
    }
    const json = await response.json();
    const result = json.result as Result;
    const contestName = result.contest.name;
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
      const isMe =
        members.find((item) => item.handle === data.handle) !== undefined;
      if (isMe && party.startTimeSeconds !== startTime) {
        continue;
      }
      if (!isMe && (party.participantType !== 'CONTESTANT' || party.ghost)) {
        continue;
      }

      for (const _ of members) {
        cnt++;
        if (user.rank !== assignedRank) {
          nowRank = cnt;
          assignedRank = user.rank;
        }
      }
      if (isMe) {
        myRank = nowRank;
        break;
      }
    }
    return { contestName, myRank };
  } catch (e) {
    throw e;
  }
};
