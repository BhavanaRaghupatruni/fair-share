from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Deposit, Event, EventParticipant, Group, GroupMember


def _lock_group(db: Session, group_id: int) -> Group:
    group = db.query(Group).filter(Group.id == group_id).with_for_update().first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


def _lock_member(db: Session, group_id: int, member_id: int) -> GroupMember:
    member = (
        db.query(GroupMember)
        .filter(GroupMember.id == member_id, GroupMember.group_id == group_id)
        .with_for_update()
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Group member not found")
    return member


def apply_deposit(
    db: Session,
    group_id: int,
    member_id: int,
    amount: float,
    note: str | None = None,
) -> Deposit:
    group = _lock_group(db, group_id)
    member = _lock_member(db, group_id, member_id)

    member.individual_remaining_balance = round(member.individual_remaining_balance + amount, 2)
    group.total_group_balance = round(group.total_group_balance + amount, 2)

    deposit = Deposit(
        group_id=group.id,
        member_id=member.id,
        amount=amount,
        note=note,
    )
    db.add(deposit)
    return deposit


def apply_expense_deductions(
    db: Session,
    event: Event,
    computed_splits: list[dict],
    expense_amount: float,
) -> None:
    group = _lock_group(db, event.group_id)
    participants = {p.id: p for p in event.participants}

    member_ids = set()
    for split in computed_splits:
        participant = participants.get(split["participant_id"])
        if not participant:
            raise HTTPException(status_code=400, detail=f"Participant {split['participant_id']} not found")
        if not participant.group_member_id:
            raise HTTPException(
                status_code=400,
                detail=f"Participant '{participant.name}' is not linked to a group member wallet",
            )
        member_ids.add(participant.group_member_id)

    members = {
        m.id: m
        for m in db.query(GroupMember)
        .filter(GroupMember.id.in_(member_ids))
        .with_for_update()
        .all()
    }

    for split in computed_splits:
        participant = participants[split["participant_id"]]
        member = members.get(participant.group_member_id)
        if not member:
            raise HTTPException(status_code=400, detail="Group member wallet not found for participant")
        member.individual_remaining_balance = round(
            member.individual_remaining_balance - split["amount"], 2
        )

    group.total_group_balance = round(group.total_group_balance - expense_amount, 2)
