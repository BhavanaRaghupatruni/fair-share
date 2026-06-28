from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Deposit, Group, GroupMember
from app.schemas import DepositCreate, DepositRead
from app.services.wallet import apply_deposit

router = APIRouter(prefix="/groups", tags=["deposits"])


def _deposit_to_read(deposit: Deposit) -> DepositRead:
    return DepositRead(
        id=deposit.id,
        group_id=deposit.group_id,
        member_id=deposit.member_id,
        member_name=deposit.member.name,
        amount=deposit.amount,
        note=deposit.note,
        created_at=deposit.created_at,
    )


@router.get("/{group_id}/deposits", response_model=list[DepositRead])
def list_deposits(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    deposits = (
        db.query(Deposit)
        .filter(Deposit.group_id == group_id)
        .order_by(Deposit.created_at.desc())
        .all()
    )
    return [_deposit_to_read(d) for d in deposits]


@router.post("/{group_id}/deposits", response_model=DepositRead, status_code=status.HTTP_201_CREATED)
def create_deposit(group_id: int, payload: DepositCreate, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    member = (
        db.query(GroupMember)
        .filter(GroupMember.id == payload.member_id, GroupMember.group_id == group_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")

    try:
        deposit = apply_deposit(
            db,
            group_id=group_id,
            member_id=payload.member_id,
            amount=payload.amount,
            note=payload.note.strip() if payload.note else None,
        )
        db.commit()
        db.refresh(deposit)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    return _deposit_to_read(deposit)
