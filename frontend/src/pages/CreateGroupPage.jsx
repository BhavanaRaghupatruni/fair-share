import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import MemberInputList from '../components/MemberInputList';

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    if (members.length === 0) {
      setError('Add at least one member');
      return;
    }

    setSubmitting(true);
    try {
      const group = await api.createGroup({
        name: name.trim(),
        members: members.map((m) => ({ name: m })),
      });
      navigate(`/groups/${group.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link to="/" className="back-link">
        ← Back to groups
      </Link>
      <h2 className="page-title">Create Group</h2>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label htmlFor="group-name">Group Name</label>
          <input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Roommates, Trip Crew..."
          />
        </div>

        <MemberInputList members={members} onChange={setMembers} />

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </>
  );
}
