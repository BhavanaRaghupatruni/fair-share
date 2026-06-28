from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, EventParticipant, Group, GroupMember
from app.schemas import (
    EventCreate,
    EventRead,
    EventSummary,
    GroupCreate,
    GroupRead,
    GroupSummary,
)

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=list[GroupSummary])
def list_groups(db: Session = Depends(get_db)):
    groups = db.query(Group).order_by(Group.created_at.desc()).all()
    return [
        GroupSummary(
            id=g.id,
            name=g.name,
            total_group_balance=g.total_group_balance,
            created_at=g.created_at,
            member_count=len(g.members),
        )
        for g in groups
    ]


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(payload: GroupCreate, db: Session = Depends(get_db)):
    group = Group(name=payload.name)
    db.add(group)
    db.flush()

    for member in payload.members:
        db.add(GroupMember(group_id=group.id, name=member.name.strip()))

    db.commit()
    db.refresh(group)
    return group


@router.get("/{group_id}", response_model=GroupRead)
def get_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.get("/{group_id}/events", response_model=list[EventSummary])
def list_group_events(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    return [
        EventSummary(
            id=e.id,
            group_id=e.group_id,
            name=e.name,
            created_at=e.created_at,
            participant_count=len(e.participants),
            expense_count=len(e.expenses),
        )
        for e in sorted(group.events, key=lambda ev: ev.created_at, reverse=True)
    ]


@router.post("/{group_id}/events", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(group_id: int, payload: EventCreate, db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    event = Event(group_id=group.id, name=payload.name)
    db.add(event)
    db.flush()

    for member in group.members:
        db.add(
            EventParticipant(
                event_id=event.id,
                name=member.name,
                group_member_id=member.id,
            )
        )

    db.commit()
    db.refresh(event)
    return event
