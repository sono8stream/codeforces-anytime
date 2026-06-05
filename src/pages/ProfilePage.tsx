import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Button,
  Container,
  Grid,
  Header,
  Icon,
  Loader,
  Modal,
  Segment,
  Table,
} from 'semantic-ui-react';
import { fetchProfile, fetchUsers, updateContestRecords } from '../actions';
import firebase from '../firebase';
import RatingColoredName from '../components/RatingColoredName';
import {
  useAccountInfo,
  useIsUpdatingRating,
  useLanguage,
  useProfile,
  useUsers,
} from '../hooks';
import UserProfile from '../types/userProfile';
import { dateAndTimeStringFromSeconds } from '../utils/dateString';
import { monthStringFromTime } from '../utils/dateString';
import { getCertificate } from '../utils/getCertificate';
import getRatingColorStyle from '../utils/getRatingColorStyle';
import { getTwitterMessage } from '../utils/getTwitterMessage';
import { calculateTimeTick } from '../utils/graphUtilities';

const ProfilePage: React.FC = () => {
  const history = useHistory();
  const urlParams = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const dispatch = useDispatch();
  const account = useAccountInfo();
  const users = useUsers();
  const profile = useProfile();
  const isUpdatingRating = useIsUpdatingRating();

  const [certIdx, setCertIdx] = useState(-1);
  const [isEnglish, setIsEnglish] = useLanguage();
  const [debugLastUpdateTime, setDebugLastUpdateTime] = useState('');
  const [refAreaLeft, setRefAreaLeft] = useState<number | undefined>(undefined);
  const [refAreaRight, setRefAreaRight] = useState<number | undefined>(undefined);
  const [zoomDomain, setZoomDomain] = useState<{ left: number; right: number } | null>(null);
  const [tapTooltip, setTapTooltip] = useState<{ time: number; rating: number } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (queryParams.get('cert')) {
      setCertIdx(Number(queryParams.get('cert')));
    }
  }, []);

  useEffect(() => {
    if (!account.id || account.id !== urlParams.id) {
      return;
    }

    dispatch(
      fetchProfile(
        account.id,
        () => {
          if (!isUpdatingRating) {
            dispatch(updateContestRecords());
          }
        },
        () => {
          history.push('/profile/update');
        }
      )
    );
  }, [dispatch, account, history, urlParams.id]);

  useEffect(() => {
    dispatch(
      fetchUsers(
        (currentUsers: { [id: string]: UserProfile }) => {
          if (!currentUsers[urlParams.id]) {
            history.push('/');
          }
        },
        () => {
          history.push('/');
        }
      )
    );
  }, [dispatch, history, urlParams.id]);

  if (!users[urlParams.id]) {
    return null;
  }

  let userInfo = users[urlParams.id];
  if (profile.records.length > 0 && account?.id === urlParams.id) {
    userInfo = profile;
  }

  let certificate = null;
  if (certIdx >= 0 && userInfo.records[userInfo.records.length - certIdx - 1]) {
    certificate = getCertificate(
      userInfo,
      userInfo.records.length - certIdx - 1
    );
  }

  const data = userInfo.records
    .map((record) => {
      return {
        name: record.contestName,
        time: record.startTime,
        rating: record.newRating,
      };
    })
    .reverse();

  const nameFromTime: { [time: number]: string } = {};
  userInfo.records.forEach((record) => {
    nameFromTime[record.startTime] = record.contestName;
  });

  const fullLeft  = data[0].time - 1000000;
  const fullRight = data[data.length - 1].time + 1000000;
  const visibleLeft  = zoomDomain?.left  ?? fullLeft;
  const visibleRight = zoomDomain?.right ?? fullRight;
  const xTick = calculateTimeTick(visibleLeft, visibleRight);
  const isZoomed = zoomDomain !== null;

  const ALL_Y_TICKS = [1200, 1400, 1600, 1900, 2100, 2400];
  const visibleRatings = isZoomed
    ? data.filter(d => d.time >= visibleLeft && d.time <= visibleRight).map(d => d.rating)
    : [];
  const yDomain: [number | string, number | string] = isZoomed && visibleRatings.length > 0
    ? [Math.min(...visibleRatings) - 200, Math.max(...visibleRatings) + 200]
    : ['dataMin-200', 'dataMax+200'];
  const yTicks = isZoomed && visibleRatings.length > 0
    ? ALL_Y_TICKS.filter(t => t >= (yDomain[0] as number) && t <= (yDomain[1] as number))
    : ALL_Y_TICKS;

  const CHART_MARGIN_LEFT   = 10;
  const CHART_MARGIN_RIGHT  = 20;
  const Y_AXIS_WIDTH        = 60;

  const getPlotRect = () => {
    const svgEl = chartContainerRef.current?.querySelector('svg');
    if (!svgEl) return null;
    const r = svgEl.getBoundingClientRect();
    return {
      left:  r.left  + CHART_MARGIN_LEFT + Y_AXIS_WIDTH,
      right: r.right - CHART_MARGIN_RIGHT,
    };
  };

  const pixelToTime = (clientX: number): number => {
    const plot = getPlotRect();
    if (!plot) return visibleLeft;
    const ratio = Math.max(0, Math.min(1, (clientX - plot.left) / (plot.right - plot.left)));
    return visibleLeft + ratio * (visibleRight - visibleLeft);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
    setRefAreaLeft(pixelToTime(e.clientX));
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (refAreaLeft !== undefined) setRefAreaRight(pixelToTime(e.clientX));
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const down = pointerDownRef.current;
    const isTap = down !== null && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10;
    pointerDownRef.current = null;

    if (isTap) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const timeStr = el?.closest('[data-time]')?.getAttribute('data-time');
      if (timeStr) {
        const time = Number(timeStr);
        const point = data.find(d => d.time === time);
        if (point) {
          setTapTooltip(prev => prev?.time === point.time ? null : point);
        }
      } else {
        setTapTooltip(null);
      }
      setRefAreaLeft(undefined);
      setRefAreaRight(undefined);
      return;
    }

    if (refAreaLeft === undefined || refAreaRight === undefined || refAreaLeft === refAreaRight) {
      setRefAreaLeft(undefined);
      setRefAreaRight(undefined);
      return;
    }
    const left  = Math.min(refAreaLeft, refAreaRight);
    const right = Math.max(refAreaLeft, refAreaRight);
    const minRange = (visibleRight - visibleLeft) * 0.02;
    if (right - left < minRange) {
      setRefAreaLeft(undefined);
      setRefAreaRight(undefined);
      return;
    }
    const margin = (right - left) * 0.05;
    setZoomDomain({ left: left - margin, right: right + margin });
    setTapTooltip(null);
    setRefAreaLeft(undefined);
    setRefAreaRight(undefined);
  };
  const zoomOut = () => {
    setZoomDomain(null);
    setRefAreaLeft(undefined);
    setRefAreaRight(undefined);
    setTapTooltip(null);
  };

  return (
    <>
      <Loader inverted={true} active={isUpdatingRating} />
      <Header as="h2">
        <RatingColoredName name={userInfo.handle} rating={userInfo.rating} />
        &nbsp;
        <a
          href={`https://codeforces.com/profile/${userInfo.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'black', fontSize: '18px' }}
        >
          <Icon name="external alternate" />
        </a>
      </Header>
      {(() => {
        if (account?.id === urlParams.id) {
          return (
            <Link to="/profile/update">
              <Button
                basic={true}
                floated="right"
                content="User setting"
                color="green"
              />
            </Link>
          );
        }
      })()}
      <Header as="h4">
        Last Update:{dateAndTimeStringFromSeconds(userInfo.lastUpdateTime)}
      </Header>
      {process.env.REACT_APP_ENV === 'develop' && account?.id === urlParams.id && (
        <Segment color="red" size="mini" style={{ marginBottom: '1em' }}>
          <Header as="h5" color="red">DEBUG: lastUpdateTime を変更</Header>
          <input
            type="date"
            value={debugLastUpdateTime}
            onChange={(e) => setDebugLastUpdateTime(e.target.value)}
            style={{ marginRight: '8px' }}
          />
          <Button
            size="mini"
            color="red"
            content="適用"
            disabled={!debugLastUpdateTime}
            onClick={async () => {
              const t = Math.floor(new Date(debugLastUpdateTime).getTime() / 1000);
              await firebase.firestore()
                .collection('users')
                .doc(account.id)
                .update({ lastUpdateTime: t });
              setDebugLastUpdateTime('');
              dispatch(fetchProfile(account.id));
            }}
          />
        </Segment>
      )}
      <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isZoomed && (
          <Button basic size="small" color="orange" icon="search minus" content={isEnglish ? 'Zoom Out' : '全期間に戻す'} onClick={zoomOut} />
        )}
        <span style={{ fontSize: '0.75em', color: '#999' }}>
          {isEnglish ? 'You can drag to zoom' : 'ドラッグでズームできます'}
        </span>
      </div>
      <div
        ref={chartContainerRef}
        style={{ touchAction: 'none', userSelect: 'none', cursor: refAreaLeft !== undefined ? 'crosshair' : 'default' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
      <ResponsiveContainer width="95%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="black" />
          {/* レーティング帯を ReferenceArea で明示的に塗る（horizontalFill はズーム時に色ズレが起きるため非使用） */}
          {[
            { y1: 2400, y2: 9999, color: '#FF0000' },
            { y1: 2100, y2: 2400, color: '#FF8C00' },
            { y1: 1900, y2: 2100, color: '#AA00AA' },
            { y1: 1600, y2: 1900, color: '#0000FF' },
            { y1: 1400, y2: 1600, color: '#03A89E' },
            { y1: 1200, y2: 1400, color: '#008000' },
            { y1: 0,    y2: 1200, color: '#808080' },
          ].map(band => (
            <ReferenceArea
              key={band.y1}
              y1={band.y1}
              y2={band.y2}
              fill={band.color}
              fillOpacity={0.5}
              stroke="none"
              ifOverflow="hidden"
            />
          ))}
          <XAxis
            type="number"
            dataKey="time"
            name="date"
            allowDataOverflow
            domain={[visibleLeft, visibleRight]}
            ticks={xTick}
            tickFormatter={(time) => monthStringFromTime(time)}
          />
          <YAxis
            type="number"
            dataKey="rating"
            allowDataOverflow
            domain={yDomain}
            ticks={yTicks}
            interval={0}
            width={Y_AXIS_WIDTH}
          />
          <Scatter
            name="A school"
            data={data}
            line={true}
            fill="white"
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              const selected = tapTooltip?.time === payload.time;
              return (
                <g key={payload.time}>
                  {/* 透明なヒットエリア（r=20）で data-time を持たせ elementFromPoint で拾う */}
                  <circle cx={cx} cy={cy} r={20} fill="transparent" data-time={String(payload.time)} />
                  {selected ? (
                    <>
                      <circle cx={cx} cy={cy} r={11} fill="none" stroke="white" strokeWidth={2.5} />
                      <circle cx={cx} cy={cy} r={5} fill="white" />
                    </>
                  ) : (
                    <circle cx={cx} cy={cy} r={4} fill="white" stroke="#888" strokeWidth={1} />
                  )}
                </g>
              );
            }}
          />
          {refAreaLeft !== undefined && refAreaRight !== undefined && (
            <ReferenceArea
              x1={Math.min(refAreaLeft, refAreaRight)}
              x2={Math.max(refAreaLeft, refAreaRight)}
              fill="#8884d8"
              fillOpacity={0.2}
              strokeOpacity={0.3}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
      </div>
      {tapTooltip && (
        <Segment compact style={{ marginTop: '4px', display: 'inline-block' }}>
          <Header as="h4" dividing={true}>{nameFromTime[tapTooltip.time]}</Header>
          <div>{dateAndTimeStringFromSeconds(tapTooltip.time)}</div>
          <div>
            Rating:&nbsp;
            <span style={getRatingColorStyle(tapTooltip.rating)}>{tapTooltip.rating}</span>
          </div>
        </Segment>
      )}
      <Table unstackable={true} celled={true}>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Contest</Table.HeaderCell>
            <Table.HeaderCell>Rank</Table.HeaderCell>
            <Table.HeaderCell>Perf.</Table.HeaderCell>
            <Table.HeaderCell>Rating</Table.HeaderCell>
            <Table.HeaderCell>Delta</Table.HeaderCell>
            <Table.HeaderCell>Cert.</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {userInfo.records.map((record, idx) => {
            const cert = getCertificate(userInfo, idx);

            return (
              <Table.Row key={record.startTime}>
                <Table.Cell>
                  {dateAndTimeStringFromSeconds(record.startTime)}
                </Table.Cell>
                <Table.Cell>
                  {record.contestID === 0 ? (
                    record.contestName
                  ) : (
                    <a
                      href={`https://codeforces.com/contest/${record.contestID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {record.contestName}
                    </a>
                  )}
                </Table.Cell>
                <Table.Cell>{record.rank}</Table.Cell>
                <Table.Cell style={getRatingColorStyle(cert.performance)}>
                  {cert.performance}
                </Table.Cell>
                <Table.Cell style={getRatingColorStyle(record.newRating)}>
                  {record.newRating}
                </Table.Cell>
                <Table.Cell>{cert.deltaString}</Table.Cell>
                <Table.Cell>
                  <div
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setCertIdx(userInfo.records.length - idx - 1);
                    }}
                  >
                    <Icon name="file outline" />
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>

      <Modal open={!!certificate} onClose={() => setCertIdx(-1)}>
        {certificate ? (
          <>
            <Modal.Header>
              <Icon name="certificate" color="yellow" />
              {isEnglish ? <>Contest Result</> : <>コンテスト成績表</>}
              <Button.Group floated="right">
                <Button
                  compact={true}
                  positive={!isEnglish}
                  onClick={() => {
                    if (isEnglish) {
                      setIsEnglish(false);
                    }
                  }}
                >
                  JP
                </Button>
                <Button.Or />
                <Button
                  compact={true}
                  positive={isEnglish}
                  onClick={() => {
                    if (!isEnglish) {
                      setIsEnglish(true);
                    }
                  }}
                >
                  EN
                </Button>
              </Button.Group>
            </Modal.Header>
            <Modal.Content>
              <Container text={true}>
                <Grid style={{ fontWeight: 'bold' }}>
                  <Grid.Row>
                    <Grid.Column width={4}>
                      {isEnglish ? <>User</> : <>ユーザー</>}
                    </Grid.Column>
                    <Grid.Column width={12}>
                      <span style={getRatingColorStyle(certificate.newRating)}>
                        {userInfo.handle}
                      </span>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={4}>
                      {isEnglish ? <>Contest</> : <>コンテスト</>}
                    </Grid.Column>
                    <Grid.Column width={12}>
                      {certificate.contestName}
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={4}>
                      {isEnglish ? <>Rank</> : <>順位</>}
                    </Grid.Column>
                    <Grid.Column>{certificate.rankString}</Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={4}>
                      {isEnglish ? <>Performance</> : <>パフォーマンス</>}
                    </Grid.Column>
                    <Grid.Column>
                      <span
                        style={getRatingColorStyle(certificate.performance)}
                      >
                        {certificate.performance}
                      </span>
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={4}>
                      {isEnglish ? <>Rating change</> : <>レート変動</>}
                    </Grid.Column>
                    <Grid.Column width={12}>
                      <span style={getRatingColorStyle(certificate.oldRating)}>
                        {certificate.oldRating}
                      </span>
                      &nbsp;→&nbsp;
                      <span style={getRatingColorStyle(certificate.newRating)}>
                        {certificate.newRating}
                      </span>
                      &nbsp; ({certificate.deltaString}) &nbsp;
                      <span style={{ color: 'red' }}>
                        {certificate.isHighest ? 'Highest!' : ''}
                      </span>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Container>
            </Modal.Content>
            <Modal.Actions>
              <Button
                color="twitter"
                circular={true}
                content="Tweet"
                icon="twitter"
                as="a"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  getTwitterMessage(
                    urlParams.id,
                    certificate,
                    certIdx,
                    isEnglish
                  )
                )}`}
                target="_blank"
              />
              <Button content="閉じる" onClick={() => setCertIdx(-1)} />
            </Modal.Actions>
          </>
        ) : null}
      </Modal>
      <script async={true} src="https://platform.twitter.com/widgets.js" />
    </>
  );
};

export default ProfilePage;
