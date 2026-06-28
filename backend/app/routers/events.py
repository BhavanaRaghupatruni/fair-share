from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Event, EventParticipant, GroupMember
from app.schemas import EventParticipantCreate, EventParticipantRead, EventRead

router = APIRouter(prefix="/events", tags=["events"])


def _get_event_or_404(event_id: int, db: Session) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, db: Session = Depends(get_db)):
    return _get_event_or_404(event_id, db)


@router.post(
    "/{event_id}/participants",
    response_model=EventParticipantRead,
    status_code=status.HTTP_201_CREATED,
)
def add_participant(
    event_id: int,
    payload: EventParticipantCreate,
    db: Session = Depends(get_db),
):
    event = _get_event_or_404(event_id, db)
    name = payload.name.strip()

    group_member = (
        db.query(GroupMember)
        .filter(GroupMember.group_id == event.group_id, GroupMember.name.ilike(name))
        .first()
    )
    if not group_member:
        raise HTTPException(
            status_code=400,
            detail="Participant must be an existing group member to use the group wallet",
        )

    existing = (
        db.query(EventParticipant)
        .filter(
            EventParticipant.event_id == event.id,
            EventParticipant.group_member_id == group_member.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Member is already a participant in this event")

    participant = EventParticipant(
        event_id=event.id,
        name=group_member.name,
        group_member_id=group_member.id,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.delete("/{event_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_participant(event_id: int, participant_id: int, db: Session = Depends(get_db)):
    event = _get_event_or_404(event_id, db)
    participant = (
        db.query(EventParticipant)
        .filter(EventParticipant.id == participant_id, EventParticipant.event_id == event.id)
        .first()
    )
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    db.delete(participant)
    db.commit()
