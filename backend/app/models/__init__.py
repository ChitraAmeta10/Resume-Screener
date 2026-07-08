"""Import all models so they register with ``Base.metadata``."""
from __future__ import annotations

from typing import List, Optional
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.score import Score
from app.models.user import User

__all__ = ["User", "Job", "Candidate", "Score"]
