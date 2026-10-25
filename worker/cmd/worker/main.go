package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sitegap-ai/worker/internal/config"
	"sitegap-ai/worker/internal/queue"
	"syscall"
	"errors"
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

	for {
		if ctx.Err() != nil {
			break
		}

		job, err := q.PopJob(ctx)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				break
			}
			log.Printf("error popping job: %v", err)
			continue
		}

		if job == nil {
			continue
		}

		log.Printf("processing job for audit ID: %s", job.AuditID)
	}

	log.Println("shutdown signal received, stopping gracefully")
}
