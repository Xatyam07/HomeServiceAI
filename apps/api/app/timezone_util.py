from datetime import datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")

def get_ist_time() -> datetime:
    """Returns the current date and time in Indian Standard Time (UTC +05:30) as a naive datetime object."""
    return datetime.now(IST).replace(tzinfo=None)

def to_ist(dt: datetime) -> datetime:
    """Converts a naive or timezone-aware datetime object to Indian Standard Time."""
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    return dt.astimezone(IST)
