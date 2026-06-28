import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CreateGroupPage from './pages/CreateGroupPage';
import GroupPage from './pages/GroupPage';
import CreateEventPage from './pages/CreateEventPage';
import EventPage from './pages/EventPage';
import AddExpensePage from './pages/AddExpensePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/groups/new" element={<CreateGroupPage />} />
        <Route path="/groups/:groupId" element={<GroupPage />} />
        <Route path="/groups/:groupId/events/new" element={<CreateEventPage />} />
        <Route path="/events/:eventId" element={<EventPage />} />
        <Route path="/events/:eventId/expenses/new" element={<AddExpensePage />} />
      </Routes>
    </Layout>
  );
}
