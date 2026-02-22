import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Configuration from './pages/Configuration';
import Analytics from './pages/Analytics';
import Connectors from './pages/Connectors';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/connectors" element={<Connectors />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
