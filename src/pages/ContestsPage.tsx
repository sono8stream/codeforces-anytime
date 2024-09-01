import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Header, Icon, Loader, Pagination, Table } from 'semantic-ui-react';
import {
  fetchAvailableContestInfo,
  fetchOfficialRatingRecords,
  fetchProfile,
} from '../actions';
import {
  useAccountInfo,
  useAvailableContests,
  useOfficialRatingRecords,
  useProfile,
} from '../hooks';

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

  const contestsPerPage = 20;
  const pages = Math.ceil(availableContests.length / contestsPerPage);
  const [currentPageIdx, setCurrentPageIdx] = useState(1);

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
      <Header as="h2" content="Supported contests" />

      <Pagination
        defaultActivePage={1}
        activePage={currentPageIdx}
        ellipsisItem={{
          content: <Icon name="ellipsis horizontal" />,
          icon: true,
        }}
        firstItem={{ content: <Icon name="angle double left" />, icon: true }}
        lastItem={{ content: <Icon name="angle double right" />, icon: true }}
        prevItem={{ content: <Icon name="angle left" />, icon: true }}
        nextItem={{ content: <Icon name="angle right" />, icon: true }}
        totalPages={pages}
        onPageChange={(e, { activePage }) =>
          setCurrentPageIdx(activePage as number)
        }
      />

      <Table unstackable={true} celled={true}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Contest</Table.HeaderCell>
            <Table.HeaderCell>Official Rank</Table.HeaderCell>
            <Table.HeaderCell>Virtual Rank</Table.HeaderCell>
            <Table.HeaderCell>Duration</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {availableContests
            .filter((contest, i) => {
              const now = i - contestsPerPage * (currentPageIdx - 1);

              if (now >= 0 && now < contestsPerPage) {
                return true;
              }
              return false;
            })
            .map((info) => {
              return (
                <Table.Row
                  key={info.name}
                  warning={!!officialRanks[info.id]}
                  positive={!!virtualRanks[info.id]}
                >
                  <Table.Cell>
                    <a
                      href={`https://codeforces.com/contest/${info.id}`}
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

      {availableContests.length === 0 ? (
        <Loader active={true} inline="centered" />
      ) : null}

      <Pagination
        defaultActivePage={1}
        activePage={currentPageIdx}
        ellipsisItem={{
          content: <Icon name="ellipsis horizontal" />,
          icon: true,
        }}
        firstItem={{ content: <Icon name="angle double left" />, icon: true }}
        lastItem={{ content: <Icon name="angle double right" />, icon: true }}
        prevItem={{ content: <Icon name="angle left" />, icon: true }}
        nextItem={{ content: <Icon name="angle right" />, icon: true }}
        totalPages={pages}
        onPageChange={(e, { activePage }) =>
          setCurrentPageIdx(activePage as number)
        }
      />
    </>
  );
};

export default ContestsPage;
