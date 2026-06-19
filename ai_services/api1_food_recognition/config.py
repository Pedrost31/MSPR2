from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:password@localhost:55432/healthai"
    mongodb_uri: str = "mongodb://localhost:27017/healthai"
    ollama_url: str = "http://localhost:11434"
    ollama_vision_model: str = "llava:latest"
    usda_api_key: str = "DEMO_KEY"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
