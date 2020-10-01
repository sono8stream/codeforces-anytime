import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Header, Table } from 'semantic-ui-react';
import { fetchUsers } from '../actions';
import { useUsers } from '../hooks';
import getRatingColorStyle from '../utils/getRatingColorStyle';

const RankingPage: React.FC = () => {
  const dispatch = useDispatch();
  const users = useUsers();

  useEffect(() => {
    if (Object.keys(users).length === 0) {
      dispatch(fetchUsers());
    }
  }, [dispatch, users]);

  return (
    <>
      <Header as="h2" content="Ranking" />
      <Table unstackable={true} celled={true}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Rank</Table.HeaderCell>
            <Table.HeaderCell>User</Table.HeaderCell>
            <Table.HeaderCell>Rating</Table.HeaderCell>
            <Table.HeaderCell>Number of participations</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {(() => {
            let rank = 1;
            let prev = 10000;
            let cnt = 0;
            const ranking = [];
            for (const id of Object.keys(users)) {
              if (users[id].records.length > 1) {
                ranking.push({ id, data: users[id] });
              }
            }
            ranking.sort((a, b) => {
              if (a.data.rating === b.data.rating) {
                if (a.data.handle < b.data.handle) {
                  return -1;
                } else if (a.data.handle === b.data.handle) {
                  return 0;
                } else {
                  return 1;
                }
              } else {
                return b.data.rating - a.data.rating;
              }
            });

            return ranking.map((user) => {
              if (prev !== user.data.rating) {
                prev = user.data.rating;
                rank = cnt + 1;
              }
              cnt++;
              return (
                <Table.Row key={user.data.handle}>
                  <Table.Cell>{rank}</Table.Cell>
                  <Table.Cell>
                    <Link
                      to={`/users/${user.id}`}
                      style={{
                        ...getRatingColorStyle(user.data.rating),
                        fontWeight: 'bold',
                      }}
                    >
                      {user.data.handle}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{user.data.rating}</Table.Cell>
                  <Table.Cell>{user.data.records.length - 1}</Table.Cell>
                </Table.Row>
              );
            });
          })()}
        </Table.Body>
      </Table>
    </>
  );
};

export default RankingPage;
