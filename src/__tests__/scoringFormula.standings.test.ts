/**
 * @jest-environment node
 */

/**
 * スコア計算式のスタンディングバリデーションテスト（実 CF API 使用）
 *
 * contest.standings の problemResults（解答時間・誤答数）から
 * calcCFProblemScore / calcICPCPenaltyContribution でスコア/ペナルティを計算し、
 * standings の row.points / row.penalty と一致するか検証する。
 *
 * 追加 API コール不要: standings 1 回で全参加者を一括検証できる。
 *
 * 実行: npm test -- --testPathPattern="scoringFormula.standings" --watchAll=false
 */

// @ts-ignore
global.fetch = global.fetch ?? require('node-fetch');

import { calcCFProblemScore, calcICPCPenaltyContribution } from '../utils/contestScoring';

const TIMEOUT = 30000;
const SAMPLE_SIZE = 200; // 検証する参加者数（全数でも可、時間短縮のため上限を設定）

// ---- 検証コンテスト ----
// CF 型（Div.2）: 2時間・3時間それぞれ
const CF_CONTESTS = [
  { id: 2232, name: 'Round 1101 (Div. 2, 2時間)' },
  { id: 2215, name: 'Round 1092 (Div. 2, 3時間)' },
];
// ICPC 型: Educational + Div.3
const ICPC_CONTESTS = [
  { id: 2230, name: 'Educational Round 190' },
  { id: 2227, name: 'Round 1096 (Div. 3)'  },
];

// ---- ヘルパー ----

interface StandingsData {
  type: string;
  durationSeconds: number;
  problems: { index: string; points: number }[];
  rows: {
    party: { participantType: string; ghost: boolean; members: { handle: string }[] };
    points: number;
    penalty: number;
    problemResults: {
      points: number;
      rejectedAttemptCount: number;
      bestSubmissionTimeSeconds?: number;
    }[];
  }[];
}

async function fetchStandings(contestId: number): Promise<StandingsData> {
  const res = await (global as any).fetch(
    `https://codeforces.com/api/contest.standings?contestId=${contestId}`
  );
  const json = await res.json();
  if (json.status !== 'OK') throw new Error(`standings failed: ${json.comment}`);
  return {
    type: json.result.contest.type,
    durationSeconds: json.result.contest.durationSeconds,
    problems: json.result.problems,
    rows: json.result.rows,
  };
}

// ---- CF 型テスト ----

describe('CF 型スコア計算の検証 (contest.standings と比較)', () => {
  for (const tc of CF_CONTESTS) {
    it(
      `contestId=${tc.id} ${tc.name}: 先頭${SAMPLE_SIZE}名のスコアが一致`,
      async () => {
        const data = await fetchStandings(tc.id);
        expect(data.type).toBe('CF');

        const maxPts = new Map(data.problems.map((p) => [p.index, p.points]));
        const contestants = data.rows
          .filter((r) => r.party.participantType === 'CONTESTANT' && !r.party.ghost)
          .slice(0, SAMPLE_SIZE);

        expect(contestants.length).toBeGreaterThan(0);

        let verified = 0;
        for (const row of contestants) {
          let expected = 0;
          for (let i = 0; i < row.problemResults.length; i++) {
            const pr = row.problemResults[i];
            if (pr.points > 0 && pr.bestSubmissionTimeSeconds != null) {
              const maxP = maxPts.get(data.problems[i].index) ?? 0;
              expected += calcCFProblemScore(maxP, pr.bestSubmissionTimeSeconds, pr.rejectedAttemptCount, data.durationSeconds);
            }
          }
          if (expected !== row.points) {
            console.error(
              `MISMATCH: ${row.party.members[0]?.handle} expected=${expected} actual=${row.points}`
            );
          }
          expect(expected).toBe(row.points);
          verified++;
        }
        console.log(`  ${tc.name}: ${verified}名を検証 ✓`);
      },
      TIMEOUT
    );
  }
});

// ---- ICPC 型テスト ----

describe('ICPC 型ペナルティ計算の検証 (contest.standings と比較)', () => {
  for (const tc of ICPC_CONTESTS) {
    it(
      `contestId=${tc.id} ${tc.name}: 先頭${SAMPLE_SIZE}名のペナルティが一致`,
      async () => {
        const data = await fetchStandings(tc.id);
        expect(data.type).toBe('ICPC');

        const contestants = data.rows
          .filter((r) => r.party.participantType === 'CONTESTANT' && !r.party.ghost)
          .slice(0, SAMPLE_SIZE);

        expect(contestants.length).toBeGreaterThan(0);

        let verified = 0;
        for (const row of contestants) {
          let expected = 0;
          for (const pr of row.problemResults) {
            if (pr.points > 0 && pr.bestSubmissionTimeSeconds != null) {
              expected += calcICPCPenaltyContribution(pr.bestSubmissionTimeSeconds, pr.rejectedAttemptCount);
            }
          }
          if (expected !== row.penalty) {
            console.error(
              `MISMATCH: ${row.party.members[0]?.handle} expected=${expected} actual=${row.penalty}`
            );
          }
          expect(expected).toBe(row.penalty);
          verified++;
        }
        console.log(`  ${tc.name}: ${verified}名を検証 ✓`);
      },
      TIMEOUT
    );
  }
});
