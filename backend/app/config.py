from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./track_the_cash.db"
    JWT_SECRET: str = "change-me-in-production-32-byte-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 8
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    ALERT_FROM_EMAIL: str = "alerts@trackthecash.gov.in"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_API_KEY: str = ""
    TWILIO_API_SECRET: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"
    MODEL_PATH: str = "models/xgboost_atm_risk.joblib"
    SPIKE_THRESHOLD: float = 2.0
    DEMO_MODE_ENABLED: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
