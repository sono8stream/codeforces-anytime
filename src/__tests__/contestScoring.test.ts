/**
 * contestScoring ユニットテスト（API 不要）
 *
 * 期待値は実際の contest.standings API レスポンスから逆算して検証済み。
 *
 * CF 型スコア式:
 *   k_per_min = 25 * durationSec / 720  (2h→250, 3h→375)
 *   decay = floor(maxPts / k_per_min * floor(t_sec / 60))
 *   score = max(3/10 * maxPts, maxPts - decay) - wrongs * 50
 *
 * 2時間コンテスト (contestId=2031 Round 987, 1位 Jack.YT):
 *   A: maxPts=500,  t=350s,  wrong=1 → 440
 *   B: maxPts=1000, t=578s,  wrong=0 → 964
 *   C: maxPts=1500, t=2341s, wrong=2 → 1166
 *   D: maxPts=2000, t=1389s, wrong=0 → 1816
 *   E: maxPts=2500, t=1238s, wrong=0 → 2300
 *
 * 3時間コンテスト (contestId=2215 Round 1092, turmax):
 *   A: maxPts=750,  t=189s,  wrong=0 → 744
 *   B: maxPts=1250, t=847s,  wrong=1 → 1154
 *   C: maxPts=1750, t=1627s, wrong=0 → 1624
 *   D: maxPts=2750, t=5678s, wrong=3 → 1911
 *   E: maxPts=3000, t=7387s, wrong=0 → 2016
 */

import {
  calcCFProblemScore,
  calcICPCPenaltyContribution,
  isCFStyle,
} from '../utils/contestScoring';

const DUR_2H = 7200;
const DUR_3H = 10800;

// ---- CF 型スコア計算（2時間コンテスト）----

describe('calcCFProblemScore 2時間コンテスト (Round 987, contestId=2031)', () => {
  it('A: maxPts=500, t=350s, wrong=1 → 440', () => {
    expect(calcCFProblemScore(500, 350, 1, DUR_2H)).toBe(440);
  });

  it('B: maxPts=1000, t=578s, wrong=0 → 964', () => {
    expect(calcCFProblemScore(1000, 578, 0, DUR_2H)).toBe(964);
  });

  it('C: maxPts=1500, t=2341s, wrong=2 → 1166', () => {
    expect(calcCFProblemScore(1500, 2341, 2, DUR_2H)).toBe(1166);
  });

  it('D: maxPts=2000, t=1389s, wrong=0 → 1816', () => {
    expect(calcCFProblemScore(2000, 1389, 0, DUR_2H)).toBe(1816);
  });

  it('E: maxPts=2500, t=1238s, wrong=0 → 2300', () => {
    expect(calcCFProblemScore(2500, 1238, 0, DUR_2H)).toBe(2300);
  });
});

// ---- CF 型スコア計算（3時間コンテスト）----

describe('calcCFProblemScore 3時間コンテスト (Round 1092, contestId=2215, turmax)', () => {
  it('A: maxPts=750, t=189s, wrong=0 → 744', () => {
    expect(calcCFProblemScore(750, 189, 0, DUR_3H)).toBe(744);
  });

  it('B: maxPts=1250, t=847s, wrong=1 → 1154', () => {
    // decay = floor(1250/375 * 14) = floor(3.333*14) = floor(46.67) = 46 → 1250-46-50=1154
    expect(calcCFProblemScore(1250, 847, 1, DUR_3H)).toBe(1154);
  });

  it('C: maxPts=1750, t=1627s, wrong=0 → 1624', () => {
    expect(calcCFProblemScore(1750, 1627, 0, DUR_3H)).toBe(1624);
  });

  it('D: maxPts=2750, t=5678s, wrong=3 → 1911', () => {
    expect(calcCFProblemScore(2750, 5678, 3, DUR_3H)).toBe(1911);
  });

  it('E: maxPts=3000, t=7387s, wrong=0 → 2016', () => {
    expect(calcCFProblemScore(3000, 7387, 0, DUR_3H)).toBe(2016);
  });
});

// ---- 共通プロパティ ----

describe('calcCFProblemScore 共通プロパティ', () => {
  it('下限 3/10*maxPts を下回らない', () => {
    const score = calcCFProblemScore(500, 7200, 0, DUR_2H);
    expect(score).toBeGreaterThanOrEqual(Math.round(0.3 * 500));
  });

  it('誤答ペナルティは1回50点', () => {
    const w0 = calcCFProblemScore(1000, 60, 0, DUR_2H);
    const w3 = calcCFProblemScore(1000, 60, 3, DUR_2H);
    expect(w0 - w3).toBe(150);
  });

  it('t=0, wrong=0 のとき maxPts をそのまま返す', () => {
    expect(calcCFProblemScore(500, 0, 0, DUR_2H)).toBe(500);
    expect(calcCFProblemScore(750, 0, 0, DUR_3H)).toBe(750);
  });
});

// ---- ICPC 型ペナルティ計算 ----
// CF の ICPC スタイルは誤答 1 回 10 分（ACM 標準の 20 分とは異なる）
// 実データ検証: Educational Round 190 (contestId=2230) / Div.3 Round 1096 (contestId=2227)

describe('calcICPCPenaltyContribution', () => {
  it('t=300s(5分), wrong=0 → 5分', () => {
    expect(calcICPCPenaltyContribution(300, 0)).toBe(5);
  });

  it('t=3600s(60分), wrong=2 → 60 + 20 = 80分', () => {
    expect(calcICPCPenaltyContribution(3600, 2)).toBe(80);
  });

  it('切り捨て: t=359s(5分59秒) → 5分', () => {
    expect(calcICPCPenaltyContribution(359, 0)).toBe(5);
  });

  it('誤答ペナルティは1回10分 (CF ルール)', () => {
    expect(calcICPCPenaltyContribution(0, 1)).toBe(10);
    expect(calcICPCPenaltyContribution(0, 3)).toBe(30);
  });

  // Educational Round 190: ksun48 の実データ
  // A:85s/0, B:261s/0, C:482s/0, D:954s/0, E:1739s/1wrong, F:2500s/0 → penalty=107
  it('実データ検証: Educational Round 190 ksun48 penalty=107', () => {
    const problems = [
      { t: 85, w: 0 }, { t: 261, w: 0 }, { t: 482, w: 0 },
      { t: 954, w: 0 }, { t: 1739, w: 1 }, { t: 2500, w: 0 },
    ];
    const penalty = problems.reduce((s, p) => s + calcICPCPenaltyContribution(p.t, p.w), 0);
    expect(penalty).toBe(107);
  });
});

// ---- コンテストスタイル判定 ----

describe('isCFStyle', () => {
  it('"CF" は CF スタイル（Div.1/2）', () => {
    expect(isCFStyle('CF')).toBe(true);
  });

  it('"ICPC" は ICPC スタイル（Div.3/4/Educational）', () => {
    expect(isCFStyle('ICPC')).toBe(false);
  });
});
