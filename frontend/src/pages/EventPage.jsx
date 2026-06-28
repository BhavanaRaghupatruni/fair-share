import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatCurrency } from '../api/client';

export default function EventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [newMember, setNewMember] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    const [eventData, expenseData] = await Promise.all([
      api.getEvent(eventId),
      api.listExpenses(eventId),
    ]);
    setEvent(eventData);
    setExpenses(expenseData);
  }

  useEffect(() => {
    loadData()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleAddParticipant(e) {
    e.preventDefault();
    const name = newMember.trim();
    if (!name) return;

    try {
      await api.addParticipant(eventId, { name });
      setNewMember('');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveParticipant(participantId) {
    try {
      await api.removeParticipant(eventId, participantId);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p>Loading event...</p>;

  return (
    <>
      <Link to={`/groups/${event?.group_id}`} className="back-link">
        ← Back to group
      </Link>
      <h2 className="page-title">{event?.name || 'Event'}</h2>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h3 className="card-title">Participants</h3>
        <p className="card-meta">Add or remove group members for this event only.</p>
        <div className="chip-list">
          {event?.participants.map((participant) => (
            <span key={participant.id} className="chip">
              {participant.name}
              <button
                type="button"
                onClick={() => handleRemoveParticipant(participant.id)}
                aria-label={`Remove ${participant.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddParticipant} className="member-row">
          <input
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            placeholder="Group member name"
          />
          <button type="submit" className="btn btn-secondary">
            Add
          </button>
        </form>
      </div>

      <h3 style={{ margin: '1.25rem 0 0.75rem' }}>Expense Ledger</h3>

      {expenses.length === 0 && (
        <div className="empty-state">
          <p>No expenses recorded yet.</p>
        </div>
      )}

      <div className="card">
        {expenses.map((expense) => (
          <div key={expense.id} className="ledger-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <strong>{expense.description}</strong>
                <p className="card-meta">Deducted from group wallet</p>
              </div>
              <span className="ledger-amount">{formatCurrency(expense.amount)}</span>
            </div>
            <div className="split-detail">
              {expense.split_type === 'equal' ? 'Split equally' : 'Split unequally'}:{' '}
              {expense.splits
                .map((s) => `${s.participant_name} ${formatCurrency(s.amount)}`)
                .join(' · ')}
            </div>
          </div>
        ))}
      </div>

      <div className="fab-container">
        <Link to={`/events/${eventId}/expenses/new`} className="btn btn-primary btn-block">
          Add Expense
        </Link>
      </div>
    </>
  );
}
