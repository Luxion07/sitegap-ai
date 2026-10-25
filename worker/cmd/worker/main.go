package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sitegap-ai/worker/internal/config"
	"sitegap-ai/worker/internal/queue"
	"syscall"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg := config.Load()
	log.Printf("worker starting with Redis at %s", cfg.RedisURL)

	q, err := queue.New(cfg.RedisURL)
	if err != nil {
		log.Fatalf("failed to connect to Redis: %v", err)
	}
	log.Println("connected to Redis successfully!")
	log.Println("waiting for jobs...")
	job, err := q.PopJob(ctx)
	if err != nil {
		log.Fatalf("failed to pop job from queue: %v", err)
	}
	log.Printf("Successfully received job! Audit ID: %s", job.AuditID)

	log.Println("worker starting")
	<-ctx.Done()
	log.Println("shutdown signal received, stopping gracefully")

}
