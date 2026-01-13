"""make player team_id nullable

Revision ID: make_team_id_nullable
Revises: add_match_participants
Create Date: 2024-01-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'make_team_id_nullable'
down_revision = 'add_match_participants'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make team_id nullable in players table
    op.alter_column('players', 'team_id',
                    existing_type=sa.Integer(),
                    nullable=True)


def downgrade() -> None:
    # Revert team_id to not nullable
    # Note: This will fail if there are players with NULL team_id
    op.alter_column('players', 'team_id',
                    existing_type=sa.Integer(),
                    nullable=False)

