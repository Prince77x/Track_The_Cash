import time
from sqlalchemy.exc import OperationalError
from backend.app.database import engine, Base
import backend.app.models  # noqa: F401


def init_db(max_retries: int = 15, retry_delay: int = 2):
    print("Attempting to initialize database tables...")
    for attempt in range(1, max_retries + 1):
        try:
            with engine.connect() as conn:
                print(f"Connected to database on attempt {attempt}.")
                Base.metadata.create_all(bind=engine)
                print("All tables created successfully.")
                return
        except OperationalError as e:
            print(f"[Attempt {attempt}/{max_retries}] Database not ready yet ({e}). Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
        except Exception as e:
            print(f"Error during database initialization: {e}")
            raise e

    raise RuntimeError(f"Could not connect to database after {max_retries} attempts.")


if __name__ == "__main__":
    init_db()
