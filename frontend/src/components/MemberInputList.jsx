import { useState } from 'react';

export default function MemberInputList({ members, onChange, label = 'Members' }) {
  const [draft, setDraft] = useState('');

  function addMember() {
    const name = draft.trim();
    if (!name) return;
    if (members.some((m) => m.toLowerCase() === name.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...members, name]);
    setDraft('');
  }

  function removeMember(index) {
    onChange(members.filter((_, i) => i !== index));
  }

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="member-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add member name"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
        />
        <button type="button" className="btn btn-secondary" onClick={addMember}>
          Add
        </button>
      </div>
      {members.length > 0 && (
        <div className="chip-list">
          {members.map((name, index) => (
            <span key={`${name}-${index}`} className="chip">
              {name}
              <button type="button" onClick={() => removeMember(index)} aria-label={`Remove ${name}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
