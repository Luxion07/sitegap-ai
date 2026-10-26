package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Audit struct {
	ID            string
	WebsiteURL    string
	BusinessType  string
	ManualContext *string
	Status        string
}

type DB struct {
	pool *pgxpool.Pool
}

func New(databaseURL string) (*DB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create postgres pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping postgres: %w", err)
	}

	return &DB{pool: pool}, nil
}

func (d *DB) Close() {
	d.pool.Close()
}

func (d *DB) GetAudit(ctx context.Context, id string) (*Audit, error) {
	query := `
		SELECT "id", "websiteUrl", "businessType", "manualContext", "status"
		FROM "Audit"
		WHERE "id" = $1
	`

	var audit Audit
	err := d.pool.QueryRow(ctx, query, id).Scan(
		&audit.ID,
		&audit.WebsiteURL,
		&audit.BusinessType,
		&audit.ManualContext,
		&audit.Status,
	)
	if err != nil {
		return nil, err
	}

	return &audit, nil
}
