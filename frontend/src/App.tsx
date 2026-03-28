import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Analytics from './pages/Analytics';
import Configuration from './pages/Configuration';
import Connectors from './pages/Connectors';
import Dashboard from './pages/Dashboard';
import Matrix from './pages/Matrix';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/connectors" element={<Connectors />} />
          <Route path="/matrix" element={<Matrix />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
