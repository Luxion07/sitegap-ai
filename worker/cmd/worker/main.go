package main

import (
	"context"
	"errors"
	"log"
	"os"
	"os/signal"
	"sitegap-ai/worker/internal/config"
	"sitegap-ai/worker/internal/db"
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

	database, err := db.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to Postgres: %v", err)
	}
	defer database.Close()
	log.Println("connected to PostgreSQL successfully!")

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
		auditRecord, err := database.GetAudit(ctx, job.AuditID)
		if err != nil {
			log.Printf("audit %s not found in database: %v", job.AuditID, err)
			continue
		}
		log.Printf("found audit in DB: URL=%s, Type=%s, Status=%s",
			auditRecord.WebsiteURL, auditRecord.BusinessType, auditRecord.Status)

	}

	log.Println("shutdown signal received, stopping gracefully")
}
