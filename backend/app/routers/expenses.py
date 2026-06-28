from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, Expense, ExpenseSplit
from app.schemas import (
    ExpenseCreate,
    ExpenseRead,
    ExpenseSplitRead,
    SplitPreviewRequest,
    SplitPreviewResponse,
    SplitType,
)
from app.services.split import calculate_splits
from app.services.wallet import apply_expense_deductions

router = APIRouter(prefix="/events", tags=["expenses"])


def _get_event_or_404(event_id: int, db: Session) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def _expense_to_read(expense: Expense) -> ExpenseRead:
    return ExpenseRead(
        id=expense.id,
        event_id=expense.event_id,
        description=expense.description,
        amount=expense.amount,
        split_type=SplitType(expense.split_type.value),
        created_at=expense.created_at,
        splits=[
            ExpenseSplitRead(
                id=s.id,
                participant_id=s.participant_id,
                participant_name=s.participant.name,
                amount=s.amount,
            )
            for s in expense.splits
        ],
    )


@router.get("/{event_id}/expenses", response_model=list[ExpenseRead])
def list_expenses(event_id: int, db: Session = Depends(get_db)):
    event = _get_event_or_404(event_id, db)
    return [_expense_to_read(e) for e in sorted(event.expenses, key=lambda x: x.created_at, reverse=True)]


@router.post("/{event_id}/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(event_id: int, payload: ExpenseCreate, db: Session = Depends(get_db)):
    event = _get_event_or_404(event_id, db)
    participant_ids = [p.id for p in event.participants]

    if not participant_ids:
        raise HTTPException(status_code=400, detail="Event has no participants")

    computed_splits, is_valid, message = calculate_splits(
        amount=payload.amount,
        split_type=payload.split_type,
        participant_ids=participant_ids,
        split_inputs=payload.splits,
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail=message or "Invalid split configuration")

    try:
        apply_expense_deductions(db, event, computed_splits, payload.amount)

        expense = Expense(
            event_id=event.id,
            description=payload.description.strip(),
            amount=payload.amount,
            split_type=payload.split_type.value,
        )
        db.add(expense)
        db.flush()

        for split in computed_splits:
            db.add(
                ExpenseSplit(
                    expense_id=expense.id,
                    participant_id=split["participant_id"],
                    amount=split["amount"],
                )
            )

        db.commit()
        db.refresh(expense)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    return _expense_to_read(expense)


@router.post("/{event_id}/expenses/preview-split", response_model=SplitPreviewResponse)
def preview_split(event_id: int, payload: SplitPreviewRequest, db: Session = Depends(get_db)):
    event = _get_event_or_404(event_id, db)
    active_ids = {p.id for p in event.participants}

    for pid in payload.participant_ids:
        if pid not in active_ids:
            raise HTTPException(status_code=400, detail=f"Participant {pid} is not in this event")

    splits, is_valid, message = calculate_splits(
        amount=payload.amount,
        split_type=payload.split_type,
        participant_ids=payload.participant_ids,
        split_inputs=payload.splits,
    )

    return SplitPreviewResponse(
        splits=splits,
        total=round(sum(s["amount"] for s in splits), 2),
        is_valid=is_valid,
        message=message,
    )
