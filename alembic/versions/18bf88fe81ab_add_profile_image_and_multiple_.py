"""add profile_image and multiple positions to players

Revision ID: 18bf88fe81ab
Revises: a62d12fbf547
Create Date: 2026-01-12 09:26:21.457365

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '18bf88fe81ab'
down_revision: Union[str, None] = 'a62d12fbf547'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add profile_image column
    op.add_column('players', sa.Column('profile_image', sa.String(), nullable=True))
    
    # Convert position from String to ARRAY(String)
    # Step 1: Add temporary column for array type
    op.add_column('players', sa.Column('position_temp', postgresql.ARRAY(sa.String()), nullable=True))
    
    # Step 2: Migrate data: convert single position string to array
    op.execute("UPDATE players SET position_temp = ARRAY[position] WHERE position IS NOT NULL")
    
    # Step 3: Drop old position column
    op.drop_column('players', 'position')
    
    # Step 4: Rename position_temp to position and make it NOT NULL
    op.alter_column('players', 'position_temp', new_column_name='position', nullable=False)


def downgrade() -> None:
    # Convert position from ARRAY back to String (take first element)
    op.add_column('players', sa.Column('position_string', sa.String(), nullable=True))
    op.execute("UPDATE players SET position_string = position[1] WHERE array_length(position, 1) > 0")
    
    # Drop array column
    op.drop_column('players', 'position')
    
    # Rename position_string to position and make it NOT NULL
    op.alter_column('players', 'position_string', new_column_name='position', nullable=False)
    
    # Drop profile_image column
    op.drop_column('players', 'profile_image')

