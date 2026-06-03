import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import RootState from '../types/rootState';
import AccountInfo from '../types/accountInfo';
import UserProfile from '../types/userProfile';
import AvailableContestInfo from '../types/availableContestInfo';
import ContestRecord from '../types/contestRecord';

export const useAccountInfo = (): AccountInfo => {
  return useSelector((state: RootState) => state.account);
};

export const useProfile = (): UserProfile => {
  return useSelector((state: RootState) => state.profile);
};

export const useAvailableContests = (): AvailableContestInfo[] => {
  return useSelector((state: RootState) => state.availableContests);
};

export const useOfficialRatingRecords = (): ContestRecord[] => {
  return useSelector((state: RootState) => state.officialRatingRecords);
};

export const useIsUpdatingRating = (): boolean => {
  return useSelector((state: RootState) => state.isUpdatingRating);
};

export const useUsers = (): { [id: string]: UserProfile } => {
  return useSelector((state: RootState) => state.users);
};

const LANG_STORAGE_KEY = 'language';

export const useLanguage = (): [boolean, (en: boolean) => void] => {
  const queryParams = new URLSearchParams(useLocation().search);

  const [isEnglish, setIsEnglishState] = useState<boolean>(() => {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    return stored !== null ? stored === 'en' : false;
  });

  useEffect(() => {
    const lang = queryParams.get('lang');
    if (lang) {
      const en = lang === 'en';
      setIsEnglishState(en);
      localStorage.setItem(LANG_STORAGE_KEY, en ? 'en' : 'ja');
    }
  }, []);

  const setIsEnglish = useCallback((en: boolean) => {
    setIsEnglishState(en);
    localStorage.setItem(LANG_STORAGE_KEY, en ? 'en' : 'ja');
  }, []);

  return [isEnglish, setIsEnglish];
};
