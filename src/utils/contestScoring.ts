/**
 * CF コンテストの採点ロジック（純粋関数）
 *
 * CF 型（Div.1/Div.2）: 時間・誤答で減衰する得点方式
 *   k_per_min = 25 * durationSec / 720   (2時間→250, 3時間→375)
 *   decay = floor(maxPts / k_per_min * floor(t_sec / 60))
 *   score = max(3/10 * maxPts, maxPts - decay) - wrongs * 50
 *
 * ICPC 型（Div.3/Div.4/Educational）: 正解数 + ペナルティ方式
 *   penalty += floor(solveTime_sec / 60) + wrongs * 10
 *   ※ CF の ICPC スタイルは誤答 1 回 10 分（ACM 標準の 20 分とは異なる）
 */

/**
 * CF 型の1問あたりのスコアを計算する
 * @param contestDurationSec コンテストの制限時間（秒）。decay rate に影響する。
 */
export const calcCFProblemScore = (
  maxPoints: number,
  relativeTimeSec: number,
  wrongAttempts: number,
  contestDurationSec: number
): number => {
  const kPerMin = 25 * contestDurationSec / 720;
  const tMin = Math.floor(relativeTimeSec / 60);
  const decay = Math.floor((maxPoints / kPerMin) * tMin);
  const minScore = Math.round((3 / 10) * maxPoints);
  return Math.max(minScore, maxPoints - decay) - wrongAttempts * 50;
};

/** ICPC 型のペナルティに対する1問あたりの貢献を計算する（分単位） */
export const calcICPCPenaltyContribution = (
  solveTimeSec: number,
  wrongAttempts: number
): number => {
  return Math.floor(solveTimeSec / 60) + wrongAttempts * 10;
};

/** contest.type が "CF" かどうかで CF スタイルを判定する */
export const isCFStyle = (contestType: string): boolean => {
  return contestType === 'CF';
};
