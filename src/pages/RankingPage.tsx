import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { Header, Icon, Loader, Pagination, Table } from 'semantic-ui-react';
import { fetchUsers } from '../actions';
import RatingColoredName from '../components/RatingColoredName';
import { useUsers } from '../hooks';
import { dateStringFromSeconds } from '../utils/dateString';

const RankingPage: React.FC = () => {
  const dispatch = useDispatch();
  const users = useUsers();

  useEffect(() => {
    if (Object.keys(users).length === 0) {
      dispatch(fetchUsers());
    }
  }, [dispatch, users]);

  // ページ遷移の管理用
  const search = useLocation().search;
  const query = new URLSearchParams(search);
  const currentPageIndex = parseInt(query.get('page') || '1');
  const history = useHistory();
  const handlePageChange = (pageNumber: number) => {
    // ページ遷移時にURLのクエリパラメータを更新
    history.push(`?page=${pageNumber}`);
  };

  const activeUsers = useMemo(() => {
    if (Object.keys(users).length === 0) {
      return [];
    }

    return Array.from(Object.keys(users))
      .filter((key) => {
        return users[key].records.length > 1;
      })
      .map((id) => ({
        id,
        handle: users[id].handle,
        rating: users[id].rating,
        match: users[id].records.length - 1,
        lastUpdate: users[id].lastUpdateTime,
      }))
      .sort((a, b) => {
        if (a.rating !== b.rating) {
          return b.rating - a.rating;
        }

        if (a.handle < b.handle) {
          return -1;
        } else if (a.handle === b.handle) {
          return 0;
        } else {
          return 1;
        }
      });
  }, [users]);

  // Pagination用。【暫定】表機能をComponent化して使いまわす
  const usersPerPage = 20;
  const pages = Math.ceil(Object.keys(activeUsers).length / usersPerPage);

  return (
    <>
      <Header as="h2" content="Ranking" />

      <Pagination
        activePage={currentPageIndex}
        ellipsisItem={{
          content: <Icon name="ellipsis horizontal" />,
          icon: true,
        }}
        firstItem={{
          content: <Icon name="angle double left" />,
          icon: true,
        }}
        lastItem={{
          content: <Icon name="angle double right" />,
          icon: true,
        }}
        prevItem={{
          content: <Icon name="angle left" />,
          icon: true,
        }}
        nextItem={{
          content: <Icon name="angle right" />,
          icon: true,
        }}
        totalPages={pages}
        onPageChange={(e, { activePage }) =>
          handlePageChange(activePage as number)
        }
      />

      <Table unstackable={true} celled={true}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Rank</Table.HeaderCell>
            <Table.HeaderCell>User</Table.HeaderCell>
            <Table.HeaderCell>Rating</Table.HeaderCell>
            <Table.HeaderCell>Match</Table.HeaderCell>
            <Table.HeaderCell>Last Update</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {(() => {
            let rank = 0;
            let prev = 10000;
            let cnt = usersPerPage * (currentPageIndex - 1);

            return activeUsers
              .filter((contest, i) => {
                const now = i - usersPerPage * (currentPageIndex - 1);

                if (now >= 0 && now < usersPerPage) {
                  return true;
                }
                return false;
              })
              .map((user) => {
                if (prev !== user.rating) {
                  prev = user.rating;
                  rank = cnt + 1;
                }
                cnt++;
                return (
                  <Table.Row key={user.handle}>
                    <Table.Cell>{rank}</Table.Cell>
                    <Table.Cell>
                      <Link
                        to={`/users/${user.id}`}
                        style={{
                          fontWeight: 'bold',
                        }}
                      >
                        <RatingColoredName
                          rating={user.rating}
                          name={user.handle}
                        />
                      </Link>
                    </Table.Cell>
                    <Table.Cell>{user.rating}</Table.Cell>
                    <Table.Cell>{user.match}</Table.Cell>
                    <Table.Cell>
                      {dateStringFromSeconds(user.lastUpdate)}
                    </Table.Cell>
                  </Table.Row>
                );
              });
          })()}
        </Table.Body>
      </Table>
      {Object.keys(users).length === 0 ? (
        <Loader active={true} inline="centered" />
      ) : null}

      <Pagination
        activePage={currentPageIndex}
        ellipsisItem={{
          content: <Icon name="ellipsis horizontal" />,
          icon: true,
        }}
        firstItem={{
          content: <Icon name="angle double left" />,
          icon: true,
        }}
        lastItem={{
          content: <Icon name="angle double right" />,
          icon: true,
        }}
        prevItem={{
          content: <Icon name="angle left" />,
          icon: true,
        }}
        nextItem={{
          content: <Icon name="angle right" />,
          icon: true,
        }}
        totalPages={pages}
        onPageChange={(e, { activePage }) =>
          handlePageChange(activePage as number)
        }
      />
    </>
  );
};

export default RankingPage;
