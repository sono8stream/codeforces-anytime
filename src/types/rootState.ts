import AccountInfo from './accountInfo';
import UserProfile from './userProfile';
import AvailableContestInfo from './availableContestInfo';
import ContestRecord from './contestRecord';

export default interface RootState {
  profile: UserProfile;
  availableContests: AvailableContestInfo[];
  officialRatingRecords: ContestRecord[];
  account: AccountInfo;
}
