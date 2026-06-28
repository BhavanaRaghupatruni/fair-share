from app.schemas import ExpenseSplitInput, SplitType


def calculate_equal_splits(amount: float, participant_ids: list[int]) -> list[dict]:
    if not participant_ids:
        raise ValueError("At least one participant is required")

    count = len(participant_ids)
    base = round(amount / count, 2)
    splits = [{"participant_id": pid, "amount": base} for pid in participant_ids]

    remainder = round(amount - sum(s["amount"] for s in splits), 2)
    if remainder != 0:
        splits[0]["amount"] = round(splits[0]["amount"] + remainder, 2)

    return splits


def calculate_unequal_splits(
    amount: float,
    participant_ids: list[int],
    split_inputs: list[ExpenseSplitInput],
) -> tuple[list[dict], bool, str | None]:
    if not split_inputs:
        return [], False, "Unequal splits require split details for each participant"

    input_ids = {s.participant_id for s in split_inputs}
    expected_ids = set(participant_ids)

    if input_ids != expected_ids:
        missing = expected_ids - input_ids
        extra = input_ids - expected_ids
        parts = []
        if missing:
            parts.append(f"missing participants: {sorted(missing)}")
        if extra:
            parts.append(f"unknown participants: {sorted(extra)}")
        return [], False, f"Split participants must match event participants ({', '.join(parts)})"

    has_percentage = any(s.percentage is not None for s in split_inputs)
    has_amount = any(s.amount is not None for s in split_inputs)

    if has_percentage and has_amount:
        return [], False, "Use either amounts or percentages consistently, not both"

    computed: list[dict] = []

    if has_percentage:
        total_pct = sum(s.percentage or 0 for s in split_inputs)
        if abs(total_pct - 100) > 0.01:
            return [], False, f"Percentages must sum to 100 (got {total_pct})"

        for s in split_inputs:
            share = round(amount * (s.percentage or 0) / 100, 2)
            computed.append({"participant_id": s.participant_id, "amount": share})
    else:
        for s in split_inputs:
            computed.append({"participant_id": s.participant_id, "amount": round(s.amount or 0, 2)})

    total = round(sum(s["amount"] for s in computed), 2)
    if abs(total - amount) > 0.01:
        return computed, False, f"Split amounts must equal expense total ({total} != {amount})"

    return computed, True, None


def calculate_splits(
    amount: float,
    split_type: SplitType,
    participant_ids: list[int],
    split_inputs: list[ExpenseSplitInput] | None = None,
) -> tuple[list[dict], bool, str | None]:
    if split_type == SplitType.EQUAL:
        return calculate_equal_splits(amount, participant_ids), True, None

    return calculate_unequal_splits(amount, participant_ids, split_inputs or [])
