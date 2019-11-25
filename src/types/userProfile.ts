import ContestRecord from './contestRecord';

export default interface UserProfile {
  handle: string;
  lastUpdateTime: number;
  rating: number;
  records: ContestRecord[];
  registrationTime: number;
}
