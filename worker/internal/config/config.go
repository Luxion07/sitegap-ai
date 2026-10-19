package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	RedisURL    string
	DatabaseURL string
}

func Load() *Config {
	_ = godotenv.Load("../.env")

	redisURL := os.Getenv("REDIS_URL")

	if redisURL == "" {
		redisURL = "localhost:6379" // Default Redis URL if not set in environment variables
	}

	return &Config{
		RedisURL:    redisURL,
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}
}
