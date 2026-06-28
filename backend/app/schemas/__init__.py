from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class SplitType(str, Enum):
    EQUAL = "equal"
    UNEQUAL = "unequal"


# --- Group ---

class GroupMemberCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class GroupMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    individual_remaining_balance: float


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    members: list[GroupMemberCreate] = Field(..., min_length=1)


class GroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    total_group_balance: float
    created_at: datetime
    members: list[GroupMemberRead]


class GroupSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    total_group_balance: float
    created_at: datetime
    member_count: int


# --- Deposit ---

class DepositCreate(BaseModel):
    member_id: int
    amount: float = Field(..., gt=0)
    note: str | None = Field(default=None, max_length=500)


class DepositRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    group_id: int
    member_id: int
    member_name: str
    amount: float
    note: str | None
    created_at: datetime


# --- Event ---

class EventParticipantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class EventParticipantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    group_member_id: int | None


class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    group_id: int
    name: str
    created_at: datetime
    participants: list[EventParticipantRead]


class EventSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    group_id: int
    name: str
    created_at: datetime
    participant_count: int
    expense_count: int


# --- Expense ---

class ExpenseSplitInput(BaseModel):
    participant_id: int
    amount: float | None = None
    percentage: float | None = None

    @model_validator(mode="after")
    def validate_amount_or_percentage(self):
        if self.amount is None and self.percentage is None:
            raise ValueError("Each split must specify amount or percentage")
        if self.amount is not None and self.percentage is not None:
            raise ValueError("Specify either amount or percentage, not both")
        return self


class ExpenseCreate(BaseModel):
    description: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    split_type: SplitType
    splits: list[ExpenseSplitInput] | None = None

    @field_validator("splits")
    @classmethod
    def validate_splits_for_unequal(cls, splits, info):
        split_type = info.data.get("split_type")
        if split_type == SplitType.UNEQUAL and not splits:
            raise ValueError("Unequal splits require split details for each participant")
        return splits


class ExpenseSplitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    participant_id: int
    participant_name: str
    amount: float


class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    description: str
    amount: float
    split_type: SplitType
    created_at: datetime
    splits: list[ExpenseSplitRead]


class SplitPreviewRequest(BaseModel):
    amount: float = Field(..., gt=0)
    split_type: SplitType
    participant_ids: list[int] = Field(..., min_length=1)
    splits: list[ExpenseSplitInput] | None = None


class SplitPreviewResponse(BaseModel):
    splits: list[dict]
    total: float
    is_valid: bool
    message: str | None = None
