"""initial schema

Revision ID: 20260920_initial
Revises:
Create Date: 2026-09-20
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260920_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("mobile_no", sa.String(length=20), nullable=False),
        sa.Column("state", sa.String(length=64), nullable=False),
        sa.Column("district", sa.String(length=64), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="CITIZEN"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("username", name="uq_users_username"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_table(
        "atm_locations",
        sa.Column("atm_id", sa.String(length=64), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("state", sa.String(length=64), nullable=False),
        sa.Column("district", sa.String(length=64), nullable=False),
        sa.Column("bank_name", sa.String(length=128), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("atm_id", name="pk_atm_locations"),
    )
    op.create_table(
        "mule_accounts",
        sa.Column("mule_id", sa.String(length=64), nullable=False),
        sa.Column("registered_state", sa.String(length=64), nullable=False),
        sa.Column("registered_district", sa.String(length=64), nullable=False),
        sa.Column("registered_lat", sa.Float(), nullable=False),
        sa.Column("registered_lng", sa.Float(), nullable=False),
        sa.Column("account_bank", sa.String(length=128), nullable=False),
        sa.Column("account_identifier_hash", sa.String(length=255), nullable=False),
        sa.Column("is_cross_state", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("risk_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("mule_id", name="pk_mule_accounts"),
    )


def downgrade():
    op.drop_table("mule_accounts")
    op.drop_table("atm_locations")
    op.drop_table("users")
