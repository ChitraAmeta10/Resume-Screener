"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-01-01 00:00:00
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

from app.db.types import GUID, JSONType

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", GUID(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="recruiter"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "jobs",
        sa.Column("id", GUID(), primary_key=True),
        sa.Column(
            "owner_id",
            GUID(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("required_skills", JSONType, nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_jobs_owner_id", "jobs", ["owner_id"])

    op.create_table(
        "candidates",
        sa.Column("id", GUID(), primary_key=True),
        sa.Column(
            "job_id",
            GUID(),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(320), nullable=True),
        sa.Column("phone", sa.String(64), nullable=True),
        sa.Column("skills", JSONType, nullable=False),
        sa.Column("experience_years", sa.Float(), nullable=False, server_default="0"),
        sa.Column("education", JSONType, nullable=False),
        sa.Column("raw_resume_text", sa.Text(), nullable=True),
        sa.Column("resume_file_path", sa.String(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_candidates_job_id", "candidates", ["job_id"])

    op.create_table(
        "scores",
        sa.Column("id", GUID(), primary_key=True),
        sa.Column(
            "candidate_id",
            GUID(),
            sa.ForeignKey("candidates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "job_id",
            GUID(),
            sa.ForeignKey("jobs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("similarity_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("llm_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("llm_reasoning", sa.Text(), nullable=True),
        sa.Column("final_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("candidate_id", "job_id", name="uq_score_candidate_job"),
    )
    op.create_index("ix_scores_candidate_id", "scores", ["candidate_id"])
    op.create_index("ix_scores_job_id", "scores", ["job_id"])


def downgrade() -> None:
    op.drop_table("scores")
    op.drop_table("candidates")
    op.drop_table("jobs")
    op.drop_table("users")
