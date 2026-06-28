import { useState } from 'react';
import { api, formatCurrency } from '../api/client';

export default function DepositForm({ groupId, members, onDeposited }) {
  const [memberId, setMemberId] = useState(members[0]?.id ? String(members[0].id) : '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!memberId) {
      setError('Select a member');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid deposit amount');
      return;
    }

    setSubmitting(true);
    try {
      await api.createDeposit(groupId, {
        member_id: Number(memberId),
        amount: parsedAmount,
        note: note.trim() || null,
      });
      setAmount('');
      setNote('');
      onDeposited();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (members.length === 0) return null;

  return (
    <div className="card">
      <h3 className="card-title">Add Funds</h3>
      <p className="card-meta">Deposit into a member&apos;s wallet pool.</p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="deposit-member">Member</label>
          <select
            id="deposit-member"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="deposit-amount">Amount</label>
          <input
            id="deposit-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label htmlFor="deposit-note">Note (optional)</label>
          <input
            id="deposit-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Initial top-up, Venmo transfer..."
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Depositing...' : 'Deposit Funds'}
        </button>
      </form>
    </div>
  );
}

export function MemberBalanceList({ members }) {
  return (
    <div className="card">
      <h3 className="card-title">Member Wallets</h3>
      <p className="card-meta">Individual remaining balances in the group pool.</p>
      <ul className="member-ledger">
        {members.map((member) => (
          <li key={member.id} className="member-ledger-row">
            <span>{member.name}</span>
            <span className={member.individual_remaining_balance < 0 ? 'balance-negative' : 'balance-positive'}>
              {formatCurrency(member.individual_remaining_balance)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
