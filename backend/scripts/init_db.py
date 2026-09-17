from backend.app.database import engine, Base
import backend.app.models  # noqa: F401


def init_db():
    print("Creating all tables if they do not exist...")
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")


if __name__ == "__main__":
    init_db()
