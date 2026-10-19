package queue
import (
	"context"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const QueueKey = "queue:audits"

type AuditJob struct {
	AuditID string `json:"auditId"`
}

type Queue struct {
	client *redis.Client
}

func New(redisUrl string) (*Queue, error) {
	var options *redis.Options
	var err error

	if strings.HasPrefix(redisUrl, "redis://") {
		options, err = redis.ParseURL(redisUrl)

		if err != nil {
			return nil, err
		}
	}else{
		options = &redis.Options{
			Addr: redisUrl,
		}
	}
	client := redis.NewClient(options)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &Queue{client: client}, nil

}