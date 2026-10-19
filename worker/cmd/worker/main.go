package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"sitegap-ai/worker/internal/config"
	"sitegap-ai/worker/internal/queue"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg := config.Load()
	log.Printf("worker starting with Redis at %s", cfg.RedisURL)

	_, err := queue.New(cfg.RedisURL)
	if err != nil {
		log.Fatalf("failed to connect to Redis: %v", err)
	}
	log.Println("connected to Redis successfully!")

	log.Println("worker starting")
    <-ctx.Done()
    log.Println("shutdown signal received, stopping gracefully")

}