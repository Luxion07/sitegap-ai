package queue

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestPopJobTimeoutOnEmptyQueue(t *testing.T) {
	q, err := New("localhost:6379")
	if err != nil {
		t.Skip("Redis not available")
	}

	ctx := context.Background()
	start := time.Now()
	job, err := q.PopJob(ctx)
	duration := time.Since(start)

	if err != nil {
		t.Fatalf("expected nil error on timeout, got: %v", err)
	}
	if job != nil {
		t.Fatalf("expected nil job on empty queue, got: %v", job)
	}
	if duration < 1900*time.Millisecond {
		t.Fatalf("expected to wait around 2s, but returned too fast: %v", duration)
	}
}

func TestPopJobCancellation(t *testing.T) {
	q, err := New("localhost:6379")
	if err != nil {
		t.Skip("Redis not available")
	}

	ctx, cancel := context.WithCancel(context.Background())

	go func() {
		time.Sleep(100 * time.Millisecond)
		cancel()
	}()

	start := time.Now()
	for {
		if ctx.Err() != nil {
			t.Logf("Context canceled detected after %v", time.Since(start))
			break
		}
		job, err := q.PopJob(ctx)
		if err != nil && errors.Is(err, context.Canceled) {
			t.Logf("PopJob returned context.Canceled after %v", time.Since(start))
			break
		}
		if job != nil {
			t.Logf("unexpected job: %v", job)
		}
	}
}
