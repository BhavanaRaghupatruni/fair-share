import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';

const SPLIT_EQUAL = 'equal';
const SPLIT_UNEQUAL = 'unequal';
const UNEQUAL_MODE_AMOUNT = 'amount';
const UNEQUAL_MODE_PERCENT = 'percentage';

export default function AddExpensePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [splitType, setSplitType] = useState(SPLIT_EQUAL);
  const [unequalMode, setUnequalMode] = useState(UNEQUAL_MODE_AMOUNT);
  const [splitValues, setSplitValues] = useState({});
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getEvent(eventId)
      .then((data) => {
        setEvent(data);
        const initial = {};
        data.participants.forEach((p) => {
          initial[p.id] = '';
        });
        setSplitValues(initial);
      })
      .catch((err) => setError(err.message));
  }, [eventId]);

  const parsedAmount = parseFloat(amount) || 0;
  const participantIds = useMemo(() => event?.participants.map((p) => p.id) || [], [event]);

  const splitTotal = useMemo(() => {
    if (splitType !== SPLIT_UNEQUAL) return parsedAmount;
    return Object.values(splitValues).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [splitType, splitValues, parsedAmount]);

  const splitIsValid = useMemo(() => {
    if (splitType === SPLIT_EQUAL) return parsedAmount > 0;
    if (unequalMode === UNEQUAL_MODE_PERCENT) {
      const pctTotal = Object.values(splitValues).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      return Math.abs(pctTotal - 100) < 0.01;
    }
    return Math.abs(splitTotal - parsedAmount) < 0.01;
  }, [splitType, unequalMode, splitValues, splitTotal, parsedAmount]);

  function buildSplitPayload() {
    if (splitType === SPLIT_EQUAL) return null;
    return participantIds.map((id) => ({
      participant_id: id,
      ...(unequalMode === UNEQUAL_MODE_AMOUNT
        ? { amount: parseFloat(splitValues[id]) || 0 }
        : { percentage: parseFloat(splitValues[id]) || 0 }),
    }));
  }

  async function handlePreview() {
    setError('');
    try {
      const result = await api.previewSplit(eventId, {
        amount: parsedAmount,
        split_type: splitType,
        participant_ids: participantIds,
        splits: buildSplitPayload(),
      });
      setPreview(result);
      if (!result.is_valid) {
        setError(result.message || 'Split totals do not match expense amount');
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (parsedAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (!splitIsValid) {
      setError(
        unequalMode === UNEQUAL_MODE_PERCENT
          ? 'Percentages must sum to 100%'
          : 'Split amounts must equal the expense total',
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.createExpense(eventId, {
        description: description.trim(),
        amount: parsedAmount,
        split_type: splitType,
        splits: buildSplitPayload(),
      });
      navigate(`/events/${eventId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function updateSplitValue(participantId, value) {
    setSplitValues((prev) => ({ ...prev, [participantId]: value }));
    setPreview(null);
  }

  return (
    <>
      <Link to={`/events/${eventId}`} className="back-link">
        ← Back to event
      </Link>
      <h2 className="page-title">Add Expense</h2>
      <p className="card-meta" style={{ marginBottom: '1rem' }}>
        Expenses are deducted from the group wallet and each participant&apos;s balance.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner, groceries, gas..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setPreview(null);
            }}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label>Split Method</label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="splitType"
                value={SPLIT_EQUAL}
                checked={splitType === SPLIT_EQUAL}
                onChange={() => {
                  setSplitType(SPLIT_EQUAL);
                  setPreview(null);
                }}
              />
              Split Equally
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="splitType"
                value={SPLIT_UNEQUAL}
                checked={splitType === SPLIT_UNEQUAL}
                onChange={() => {
                  setSplitType(SPLIT_UNEQUAL);
                  setPreview(null);
                }}
              />
              Split Unequally
            </label>
          </div>
        </div>

        {splitType === SPLIT_UNEQUAL && (
          <>
            <div className="form-group">
              <label>Unequal Input Mode</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="unequalMode"
                    value={UNEQUAL_MODE_AMOUNT}
                    checked={unequalMode === UNEQUAL_MODE_AMOUNT}
                    onChange={() => setUnequalMode(UNEQUAL_MODE_AMOUNT)}
                  />
                  Exact amounts
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="unequalMode"
                    value={UNEQUAL_MODE_PERCENT}
                    checked={unequalMode === UNEQUAL_MODE_PERCENT}
                    onChange={() => setUnequalMode(UNEQUAL_MODE_PERCENT)}
                  />
                  Percentages
                </label>
              </div>
            </div>

            {event?.participants.map((participant) => (
              <div key={participant.id} className="split-row">
                <span style={{ minWidth: '6rem' }}>{participant.name}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={splitValues[participant.id] ?? ''}
                  onChange={(e) => updateSplitValue(participant.id, e.target.value)}
                  placeholder={unequalMode === UNEQUAL_MODE_AMOUNT ? '0.00' : '0'}
                />
                <span>{unequalMode === UNEQUAL_MODE_PERCENT ? '%' : '$'}</span>
              </div>
            ))}

            <p className="card-meta">
              Total: {unequalMode === UNEQUAL_MODE_PERCENT ? `${splitTotal.toFixed(2)}%` : `$${splitTotal.toFixed(2)}`}
              {!splitIsValid && ' (must match expense total)'}
            </p>
          </>
        )}

        {preview?.is_valid && (
          <div className="success-banner">
            Preview deductions:{' '}
            {preview.splits
              .map((s) => {
                const name = event.participants.find((p) => p.id === s.participant_id)?.name;
                return `${name} −$${s.amount.toFixed(2)}`;
              })
              .join(' · ')}
          </div>
        )}

        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={handlePreview}>
            Preview Split
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !splitIsValid}
          >
            {submitting ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </form>
    </>
  );
}
