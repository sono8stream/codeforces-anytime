// CF API 変更対応 (2026年4月): contest.standings?showUnofficial=true が非管理者に禁止された。
// 代替として:
//   1. 公式スタンディング（showUnofficial なし）から全公式参加者を取得
//   2. user.status からバーチャル参加の提出を取得し、得点/penalty を計算
//   3. 公式参加者の中で自分より成績の良い人数を数えてランクを算出
//
// CF 型（contest.type === "CF"）: 問題ごとの最大得点から calcCFProblemScore で合計スコアを算出
// ICPC 型（contest.type === "ICPC"）: 正解数 + calcICPCPenaltyContribution でペナルティを算出

import { calcCFProblemScore, calcICPCPenaltyContribution, isCFStyle } from './contestScoring';

interface ProblemInfo {
  index: string;
  points: number;
}

interface ProblemResult {
  points: number;
  rejectedAttemptCount: number;
  type: string;
  bestSubmissionTimeSeconds?: number;
}

interface StandingsRow {
  party: {
    members: { handle: string }[];
    participantType: string;
    ghost: boolean;
    startTimeSeconds: number;
  };
  rank: number;
  points: number;
  penalty: number;
  problemResults: ProblemResult[];
}

interface StandingsResult {
  contest: { name: string; durationSeconds: number; type: string };
  problems: ProblemInfo[];
  rows: StandingsRow[];
}

interface Submission {
  contestId: number;
  problem: { index: string };
  author: { participantType: string; startTimeSeconds: number };
  verdict: string;
  relativeTimeSeconds: number;
}

export const calculateVirtualRank = async (data: {
  contestID: number;
  handle: string;
  startTime: number;
  nowTime: number;
}): Promise<{ contestName: string; myRank: number; endTime: number }> => {
  const { contestID, handle, startTime, nowTime } = data;

  // 1. 公式スタンディング取得（extra パラメーターなし）
  const standingsUrl = `https://codeforces.com/api/contest.standings?contestId=${contestID}`;
  const standingsRes = await fetch(standingsUrl).catch(() => null);
  if (standingsRes == null || !standingsRes.ok) {
    throw new Error('Cannot access standings');
  }
  const standingsJson = await standingsRes.json();
  if (standingsJson.status !== 'OK') {
    throw new Error('Cannot access standings');
  }
  const result = standingsJson.result as StandingsResult;

  const contestName = result.contest.name;
  const durationSeconds = result.contest.durationSeconds;
  const cfStyle = isCFStyle(result.contest.type);
  const endTime = startTime + durationSeconds;

  if (endTime > nowTime) {
    throw new Error('Not finished');
  }

  // 2. ユーザーのバーチャル提出を取得
  const submissionsUrl = `https://codeforces.com/api/user.status?handle=${handle}`;
  const submissionsRes = await fetch(submissionsUrl).catch(() => null);
  if (submissionsRes == null || !submissionsRes.ok) {
    throw new Error('Cannot access user status');
  }
  const submissionsJson = await submissionsRes.json();
  if (submissionsJson.status !== 'OK') {
    throw new Error('Cannot access user status');
  }

  // このコンテストのこのバーチャル開始時刻に対応する提出だけ抽出
  const mySubmissions: Submission[] = (submissionsJson.result as Submission[]).filter(
    (s) =>
      s.contestId === contestID &&
      s.author.participantType === 'VIRTUAL' &&
      s.author.startTimeSeconds === startTime
  );

  // 3. AC 済み問題の解答時間と AC 前の誤答数を集計
  //    API は新しい順で返すので古い順に処理する
  const wrongsBefore = new Map<string, number>();
  const solveTime = new Map<string, number>();

  for (const s of [...mySubmissions].reverse()) {
    const idx = s.problem.index;
    if (solveTime.has(idx)) continue;
    if (s.verdict === 'OK') {
      solveTime.set(idx, s.relativeTimeSeconds);
    } else {
      wrongsBefore.set(idx, (wrongsBefore.get(idx) ?? 0) + 1);
    }
  }

  const mySolvedCount = solveTime.size;

  // 4. contest.type でスタイルを判定し、自分のスコア/ペナルティを計算

  // CF 型: 問題ごとの最大得点（problems[i].points）を使って合計スコアを計算
  // ICPC 型: 正解数 + ペナルティ
  const maxPointsByIndex = new Map<string, number>(
    result.problems.map((p) => [p.index, p.points])
  );

  let myScore = 0;
  let myPenalty = 0;

  for (const [idx, time] of Array.from(solveTime)) {
    const wrongs = wrongsBefore.get(idx) ?? 0;
    if (cfStyle) {
      const maxPts = maxPointsByIndex.get(idx) ?? 0;
      myScore += calcCFProblemScore(maxPts, time, wrongs, durationSeconds);
    } else {
      myPenalty += calcICPCPenaltyContribution(time, wrongs);
    }
  }

  // 5. 公式参加者の中で自分より上位の人数を数えてランクを算出
  let myRank = 1;
  for (const row of result.rows) {
    if (row.party.participantType !== 'CONTESTANT' || row.party.ghost) continue;

    if (cfStyle) {
      // CF 型: 合計スコアが高い人が上位（row.points は standings API が算出済み）
      if (row.points > myScore) {
        myRank++;
      }
    } else {
      // ICPC 型: 正解数が多い、または同数でペナルティが少ない人が上位
      const theirSolved = row.problemResults.filter((p) => p.points > 0).length;
      if (
        theirSolved > mySolvedCount ||
        (theirSolved === mySolvedCount && row.penalty < myPenalty)
      ) {
        myRank++;
      }
    }
  }

  return { contestName, myRank, endTime };
};
