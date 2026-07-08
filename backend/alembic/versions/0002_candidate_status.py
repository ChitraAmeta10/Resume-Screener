"""add candidate.status (hiring-pipeline stage)

Revision ID: 0002_candidate_status
Revises: 0001_initial
Create Date: 2026-07-08 00:00:00
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_candidate_status"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "candidates",
        sa.Column(
            "status", sa.String(20), nullable=False, server_default="new"
        ),
    )
    op.create_index("ix_candidates_status", "candidates", ["status"])


def downgrade() -> None:
    op.drop_index("ix_candidates_status", table_name="candidates")
    op.drop_column("candidates", "status")
