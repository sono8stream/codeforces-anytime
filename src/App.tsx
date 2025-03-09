import { createBrowserHistory } from 'history';
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, useLocation } from 'react-router-dom';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import PageWrapper from './components/PageWrapper';
import Contact from './pages/Contact';
import ContestsPage from './pages/ContestsPage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from './pages/RankingPage';
import StartPage from './pages/StartPage';
import UpdateProfilePage from './pages/UpdateProfilePage';
import trackID from './ga/config';
import rootReducer from './reducers';
import { Helmet } from 'react-helmet';
import { sendPageView } from './utils/analytics';

const store = createStore(rootReducer, applyMiddleware(thunk));

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    sendPageView(location.pathname);
  }, [location]);

  return null;
}

const App: React.FC = () => {
  return (
    <div>
      <Helmet>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${trackID}`}
        ></script>
        <script>
          {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
                          `}
        </script>
      </Helmet>
      <Provider store={store}>
        <Router>
          <RouteTracker />
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
    </div>
  );
};

export default App;
