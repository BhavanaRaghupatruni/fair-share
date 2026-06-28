import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatCurrency } from '../api/client';
import DepositForm, { MemberBalanceList } from '../components/DepositForm';

export default function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const [groupData, eventData] = await Promise.all([
      api.getGroup(groupId),
      api.listGroupEvents(groupId),
    ]);
    setGroup(groupData);
    setEvents(eventData);
  }, [groupId]);

  useEffect(() => {
    loadData()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadData]);

  if (loading) return <p>Loading group...</p>;

  return (
    <>
      <Link to="/" className="back-link">
        ← All groups
      </Link>
      <h2 className="page-title">{group?.name || 'Group'}</h2>

      {error && <div className="error-banner">{error}</div>}

      {group && (
        <>
          <div className="card wallet-banner">
            <p className="card-meta">Group Wallet Balance</p>
            <p
              className={
                group.total_group_balance < 0
                  ? 'wallet-total balance-negative'
                  : 'wallet-total balance-positive'
              }
            >
              {formatCurrency(group.total_group_balance)}
            </p>
          </div>

          <MemberBalanceList members={group.members} />

          <DepositForm
            groupId={groupId}
            members={group.members}
            onDeposited={() => loadData().catch((err) => setError(err.message))}
          />
        </>
      )}

      <h3 style={{ margin: '1.25rem 0 0.75rem' }}>Events</h3>

      {events.length === 0 && (
        <div className="empty-state">
          <p>No events yet. Create one for a trip, dinner, or shared purchase.</p>
        </div>
      )}

      {events.map((event) => (
        <Link key={event.id} to={`/events/${event.id}`} className="card card-link">
          <h3 className="card-title">{event.name}</h3>
          <p className="card-meta">
            {event.participant_count} participants · {event.expense_count} expenses
          </p>
        </Link>
      ))}

      <div className="fab-container">
        <Link to={`/groups/${groupId}/events/new`} className="btn btn-primary btn-block">
          Create Event
        </Link>
      </div>
    </>
  );
}
