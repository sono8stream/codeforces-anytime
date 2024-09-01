import React, { useEffect } from 'react';
import { Header, Table } from 'semantic-ui-react';
import { useDispatch } from 'react-redux';
import {
  useAccountInfo,
  useProfile,
  useAvailableContests,
  useOfficialRatingRecords,
} from '../hooks';
import {
  fetchProfile,
  fetchAvailableContestInfo,
  fetchOfficialRatingRecords,
} from '../actions';

const ContestsPage: React.FC = () => {
  const dispatch = useDispatch();
  const account = useAccountInfo();
  const profile = useProfile();
  const availableContests = useAvailableContests();
  const virtualRanks: { [id: number]: number } = {};
  for (const record of profile.records) {
    virtualRanks[record.contestID] = record.rank;
  }
  const officialRatingRecords = useOfficialRatingRecords();
  const officialRanks: { [id: number]: number } = {};
  for (const record of officialRatingRecords) {
    officialRanks[record.contestID] = record.rank;
  }

  useEffect(() => {
    if (availableContests.length === 0) {
      dispatch(fetchAvailableContestInfo());
    }
  }, [dispatch, availableContests]);

  useEffect(() => {
    if (!account.id) {
      return;
    }
    dispatch(fetchProfile(account.id));
  }, [dispatch, account]);

  useEffect(() => {
    if (!profile.handle) {
      return;
    }
    dispatch(fetchOfficialRatingRecords(profile.handle));
  }, [dispatch, profile]);

  return (
    <>
      <Header as="h2" content="対応中のコンテスト" />
      <Table celled={true}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Contest</Table.HeaderCell>
            <Table.HeaderCell>Official Rank</Table.HeaderCell>
            <Table.HeaderCell>Virtual Rank</Table.HeaderCell>
            <Table.HeaderCell>Duration</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {availableContests.map((info) => {
            return (
              <Table.Row
                key={info.name}
                warning={!!officialRanks[info.id]}
                positive={!!virtualRanks[info.id]}
              >
                <Table.Cell>
                  <a
                    href={`https://codeforces.com/contestRegistration/${info.id}/virtual/true`}
                    target="blank"
                  >
                    {info.name}
                  </a>
                </Table.Cell>
                <Table.Cell>{officialRanks[info.id] || '-'}</Table.Cell>
                <Table.Cell>{virtualRanks[info.id] || '-'}</Table.Cell>
                <Table.Cell>{info.durationSeconds / 60} min.</Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </>
  );
};

export default ContestsPage;
