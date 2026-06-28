import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatCurrency } from '../api/client';

export default function HomePage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listGroups()
      .then(setGroups)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h2 className="page-title">Your Groups</h2>

      {error && <div className="error-banner">{error}</div>}

      {loading && <p>Loading groups...</p>}

      {!loading && groups.length === 0 && (
        <div className="empty-state">
          <p>No groups yet. Create one to start splitting expenses.</p>
        </div>
      )}

      {groups.map((group) => (
        <Link key={group.id} to={`/groups/${group.id}`} className="card card-link">
          <h3 className="card-title">{group.name}</h3>
          <p className="card-meta">
            {group.member_count} members · Pool {formatCurrency(group.total_group_balance)}
          </p>
        </Link>
      ))}

      <div className="fab-container">
        <Link to="/groups/new" className="btn btn-primary btn-block">
          Create Group
        </Link>
      </div>
    </>
  );
}
