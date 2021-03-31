export default interface ContestCertificate {
  handle: string;
  contestName: string;
  rankString: string;
  performance: number;
  oldRating: number;
  newRating: number;
  deltaString: string;
  isHighest: boolean;
}
