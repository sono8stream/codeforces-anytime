import AccountInfo from './accountInfo';
import UserProfile from './userProfile';

export default interface RootState {
  profileReducer: UserProfile;
  accountReducer: AccountInfo;
}
