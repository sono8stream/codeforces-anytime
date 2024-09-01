import { createBrowserHistory } from 'history';
import React from 'react';
import ReactGA from 'react-ga';
import { Provider } from 'react-redux';
import { Route, Router } from 'react-router';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import PageWrapper from './components/PageWrapper';
import trackID from './ga/config';
import Contact from './pages/Contact';
import ContestsPage from './pages/ContestsPage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from './pages/RankingPage';
import StartPage from './pages/StartPage';
import UpdateProfilePage from './pages/UpdateProfilePage';
import rootReducer from './reducers';

const store = createStore(rootReducer, applyMiddleware(thunk));

const App: React.FC = () => {
  ReactGA.initialize(trackID);
  const history = createBrowserHistory();
  history.listen(({ pathname }) => {
    ReactGA.set({ page: pathname });
    ReactGA.pageview(pathname);
  });

  return (
    <Provider store={store}>
      <Router history={history}>
        <PageWrapper>
          <Route exact={true} path="/contests" component={ContestsPage} />
          <Route exact={true} path="/ranking" component={RankingPage} />
          <Route exact={true} path="/users/:id" component={ProfilePage} />
          <Route
            exact={true}
            path="/profile/update"
            component={UpdateProfilePage}
          />
          <Route exact={true} path="/contact" component={Contact} />
          <Route exact={true} path="/" component={StartPage} />
        </PageWrapper>
      </Router>
    </Provider>
  );
};

export default App;
