import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useHistory, useLocation, Link } from 'react-router-dom';
import {
  Header,
  Icon,
  Label,
  Loader,
  Pagination,
  Table,
} from 'semantic-ui-react';
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
  const currentOrderBy = query.get('orderBy') || 'rating';
  const history = useHistory();
  const handlePageChange = (pageNumber: number) => {
    // ページ遷移時にURLのクエリパラメータを更新
    history.push(`?page=${pageNumber}&orderBy=${currentOrderBy}`);
  };

  const activeUsers = useMemo(() => {
    if (Object.keys(users).length === 0) {
      return [];
    }

    const userArray = Array.from(Object.keys(users))
      .filter((key) => {
        return users[key].records.length > 1;
      })
      .map((id) => ({
        rank: 0,
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

    // 順位計算
    let currentRank = 0;
    let lastRating = 10000;
    let sameCount = 0;
    userArray.forEach((user) => {
      if (lastRating !== user.rating) {
        lastRating = user.rating;
        currentRank += sameCount + 1;
        sameCount = 0;
      } else {
        sameCount++;
      }

      user.rank = currentRank;
    });

    return userArray;
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
            <Table.HeaderCell>
              <Link to={`?page=${currentPageIndex}&orderBy=rating`}>Rank</Link>
            </Table.HeaderCell>
            <Table.HeaderCell>
              {' '}
              <Link to={`?page=${currentPageIndex}&orderBy=handle`}>User</Link>
            </Table.HeaderCell>
            <Table.HeaderCell>
              <Link to={`?page=${currentPageIndex}&orderBy=rating`}>
                Rating
              </Link>
            </Table.HeaderCell>
            <Table.HeaderCell>
              <Link to={`?page=${currentPageIndex}&orderBy=match`}>Match</Link>
            </Table.HeaderCell>
            <Table.HeaderCell>
              <Link to={`?page=${currentPageIndex}&orderBy=last-update`}>
                Last Update
              </Link>
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {(() => {
            return activeUsers
              .sort((a, b) => {
                // 設定に応じて並び替え
                switch (currentOrderBy) {
                  case 'last-update':
                    if (a.lastUpdate !== b.lastUpdate) {
                      return b.lastUpdate - a.lastUpdate;
                    }
                    break;
                  case 'handle':
                    // 名前でソート。後段で実施するので何もしない
                    break;
                  case 'match':
                    if (a.match !== b.match) {
                      return b.match - a.match;
                    }
                    break;
                  case 'rating':
                  default:
                    if (a.rating !== b.rating) {
                      return b.rating - a.rating;
                    }
                    break;
                }

                // 同じ値の場合は名前の若い方を返す
                if (a.handle < b.handle) {
                  return -1;
                } else if (a.handle === b.handle) {
                  return 0;
                } else {
                  return 1;
                }
              })
              .filter((contest, i) => {
                const now = i - usersPerPage * (currentPageIndex - 1);

                if (now >= 0 && now < usersPerPage) {
                  return true;
                }
                return false;
              })

              .map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>{user.rank}</Table.Cell>
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
              ));
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
