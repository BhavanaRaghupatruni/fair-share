import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function CreateEventPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Event name is required');
      return;
    }

    setSubmitting(true);
    try {
      const event = await api.createEvent(groupId, { name: name.trim() });
      navigate(`/events/${event.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link to={`/groups/${groupId}`} className="back-link">
        ← Back to group
      </Link>
      <h2 className="page-title">Create Event</h2>
      <p className="card-meta" style={{ marginBottom: '1rem' }}>
        Group members will be added as event participants automatically.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label htmlFor="event-name">Event Name</label>
          <input
            id="event-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Weekend Trip, House Supplies..."
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </>
  );
}
