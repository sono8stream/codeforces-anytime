interface Contestant {
  handle: string;
  rank: number;
  oldRating: number;
  newRating: number;
  actualDelta: number;
  seed: number;
  calcedDelta: number;
}

export interface ContestData {
  contestID: number;
  handle: string;
  rank: number;
  rating: number;
}

const baseRating = 500;
const ratingRange = 5000;
let contestants: Contestant[];
let loseProbabilities: number[][];
let ratingToSeeds: number[];

export const calculateMyRating = async (
  contestData: ContestData
): Promise<number> => {
  await fetchContestants(contestData.contestID).catch((err) => {
    throw err;
  });
  if (contestants.length === 0) {
    throw new Error();
  }
  contestants.splice(contestData.rank - 1, 0, {
    handle: contestData.handle,
    rank: contestData.rank,
    oldRating: contestData.rating,
    newRating: 0,
    actualDelta: 0,
    seed: 0,
    calcedDelta: 0,
  });
  assignRanks();
  calcLoseProbabilities(); // bottle neck
  calcRatingToSeeds();
  calcContestantSeeds(); // 少し時間かかる
  calcBaseRatingDeltas();
  calcAllAverageRatingInc();
  calcMajorAverageRatingInc();
  let index = 0;
  for (let i = 0; i < contestants.length; i++) {
    if (contestants[i].handle === contestData.handle) {
      index = i;
      break;
    }
  }
  return contestants[index].oldRating + contestants[index].calcedDelta;
};

const fetchContestants = async (contestID: number) => {
  const url = `https://codeforces.com/api/contest.ratingChanges?contestId=${contestID}`;
  const response = await fetch(url).catch((err) => {
    throw err;
  });
  if (!response.ok) {
    return;
  }
  const json: any = await response.json();
  const results: any[] = json.result;

  contestants = new Array<Contestant>();
  for (const result of results) {
    contestants.push({
      handle: result.handle,
      rank: result.rank,
      oldRating: result.oldRating,
      newRating: result.newRating,
      actualDelta: result.newRating - result.oldRating,
      seed: 0,
      calcedDelta: 0,
    });
  }
};

const assignRanks = () => {
  let first = 0;
  for (let i = 1; i < contestants.length; i++) {
    if (contestants[i].rank > contestants[i - 1].rank) {
      for (let j = first; j < i; j++) {
        contestants[j].rank = i;
      }
      first = i;
    }
  }
  for (let i = first; i < contestants.length; i++) {
    contestants[i].rank = contestants.length;
  }
};

const calcLoseProbabilities = () => {
  if (loseProbabilities) {
    return;
  }
  loseProbabilities = new Array<number[]>(ratingRange + 1);
  for (let i = 0; i <= ratingRange; i++) {
    loseProbabilities[i] = new Array<number>(ratingRange + 1);
    loseProbabilities[i].fill(0);
  }
  for (let i = 0; i <= ratingRange; i++) {
    for (let j = i; j <= ratingRange; j++) {
      loseProbabilities[i][j] = calcEloLoseProbability(
        i - baseRating,
        j - baseRating
      );
      loseProbabilities[j][i] = 1 - loseProbabilities[i][j];
    }
  }
};

const calcRatingToSeeds = () => {
  ratingToSeeds = new Array<number>();
  for (let i = 0; i <= ratingRange; i++) {
    let seed = 1.0;
    for (const contestant of contestants) {
      seed += loseProbabilities[i][contestant.oldRating + baseRating];
    }
    ratingToSeeds.push(seed);
  }
};

const calcContestantSeeds = () => {
  for (const contestant of contestants) {
    contestant.seed = ratingToSeeds[contestant.oldRating + baseRating] - 0.5;
  }
};

const calcBaseRatingDeltas = () => {
  for (const contestant of contestants) {
    const midRank: number = Math.sqrt(contestant.rank * contestant.seed);

    const targetRating = calcRatingToRank(midRank, contestant.oldRating);
    contestant.calcedDelta = Math.trunc(
      (targetRating - contestant.oldRating) / 2
    );
  }
};

const calcRatingToRank = (targetRank: number, oldRating: number): number => {
  let bottom = 0;
  let top = ratingRange + 1;
  while (bottom + 1.1 < top) {
    const mid = Math.trunc((bottom + top) / 2);
    if (
      ratingToSeeds[mid] - loseProbabilities[mid][oldRating + baseRating] <
      targetRank
    ) {
      top = mid;
    } else {
      bottom = mid;
    }
  }
  return Math.max(bottom - baseRating, 1);
};

const calcEloLoseProbability = (myRate: number, othersRate: number): number => {
  return 1.0 / (1.0 + Math.pow(10.0, (myRate - othersRate) / 400.0));
};

const calcAllAverageRatingInc = () => {
  let sum = 0;
  for (const contestant of contestants) {
    sum += contestant.calcedDelta;
  }
  const inc = Math.trunc(-sum / contestants.length) - 1;
  for (const contestant of contestants) {
    contestant.calcedDelta += inc;
  }
};

const calcMajorAverageRatingInc = () => {
  let sum = 0;
  const oldRatingAndRatingDeltas: number[][] = [];
  contestants.forEach((value) => {
    oldRatingAndRatingDeltas.push([value.oldRating, value.calcedDelta]);
  });
  oldRatingAndRatingDeltas.sort((a, b) => b[0] - a[0]);
  const zeroSumCount = Math.min(
    4 * Math.floor(Math.sqrt(contestants.length)),
    contestants.length
  );

  for (let i = 0; i < zeroSumCount; i++) {
    sum += oldRatingAndRatingDeltas[i][1];
  }
  const inc = Math.min(Math.max(Math.trunc(-sum / zeroSumCount), -10), 0);

  for (const contestant of contestants) {
    contestant.calcedDelta += inc;
  }
};
