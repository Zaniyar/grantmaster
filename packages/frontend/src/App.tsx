import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import PullRequestDetail from './components/PullRequestDetail';
import PullRequestSummaryList from './components/PullRequestSummaryList';
import TeamsPage from './components/TeamsPage';

import { Breadcrumb, Layout, Menu, theme } from 'antd';

const { Header, Content } = Layout;

const navItems = [
  {
    key: '1',
    label: 'PRs',
    to: '/pullrequestsummaries',
  },
  {
    key: '2',
    label: 'Teams',
    to: '/teams',
  }
];

const getBaseRoute = (path: any) => {
  const segments = path.split('/');
  return `/${segments[1]}`;
};

const LayoutContent = () => {
  const location = useLocation();
  const { token: { colorBgContainer } } = theme.useToken();
  const baseRoute = getBaseRoute(location.pathname);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Link to="/" className="logo-wrapper">
          <div className="logo">
            <img src="/logo.png" alt="logo" />
          </div>
          <span style={{ marginRight: '20px', color: 'white', fontWeight: 800 }}>Grantmaster</span>
        </Link>
        <Menu theme="dark" mode="horizontal" selectedKeys={[baseRoute]}>
          {navItems.map(item => (
            <Menu.Item key={item.to}>
              <Link to={item.to}>{item.label}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Header>
      <Layout>
      <Layout
        style={{
          padding: '0 24px 24px',
        }}
      >
        <Breadcrumb
          style={{
            margin: '16px 0',
          }}
        >
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          {baseRoute === '/pullrequestsummaries' && <Breadcrumb.Item><Link to="/pullrequestsummaries">PRs</Link></Breadcrumb.Item>}
          {location.pathname.startsWith('/pullrequests/') && [<Breadcrumb.Item key="prs"><Link to="/pullrequestsummaries">PRs</Link></Breadcrumb.Item>, <Breadcrumb.Item key="pr">PR</Breadcrumb.Item>]}
          {baseRoute === '/teams' && <Breadcrumb.Item><Link to="/teams">Teams</Link></Breadcrumb.Item>}
        </Breadcrumb>
        <Content
          style={{
            padding: 24,
            margin: 0,
            borderRadius: '10px',
            minHeight: 280,
            background: colorBgContainer,
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate replace to="/pullrequestsummaries" />} />
            <Route path="/pullrequestsummaries" element={<PullRequestSummaryList />} />
            <Route path="/pullrequests/:id" element={<PullRequestDetail />} />
            <Route path="/teams" element={<TeamsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  </Layout>
  );
};

const App = () => {
  return (
    <Router>
      <LayoutContent />
    </Router>
  );
};

export default App;
