"""Make last_name optional and drop not empty check

Revision ID: 0002_make_last_name_optional
Revises: 769d4e8016fe
Create Date: 2026-11-15 03:56:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_make_last_name_optional'
down_revision: Union[str, None] = '769d4e8016fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_last_name_not_empty;")
    op.execute("ALTER TABLE users ALTER COLUMN last_name DROP NOT NULL;")
    op.execute("ALTER TABLE users ALTER COLUMN last_name SET DEFAULT '';")


def downgrade() -> None:
    op.execute("UPDATE users SET last_name = 'User' WHERE last_name IS NULL OR LENGTH(TRIM(last_name)) = 0;")
    op.execute("ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;")
    op.execute("ALTER TABLE users ADD CONSTRAINT users_last_name_not_empty CHECK (LENGTH(TRIM(last_name)) > 0);")
