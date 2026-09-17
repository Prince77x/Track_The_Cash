from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./track_the_cash.db"
    JWT_SECRET: str = "super-secret-track-the-cash-sih2026-key-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 8
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "alerts@trackthecash.gov.in"
    SIMULATION_DEFAULT_RATE: float = 0.5
    MODEL_PATH: str = "models/xgboost_atm_risk.joblib"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()
