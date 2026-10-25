package queue
import (
	"context"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"encoding/json"
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

func (q *Queue) PopJob(ctx context.Context) (*AuditJob, error) {
	res, err := q.client.BLPop(ctx, 0, QueueKey).Result()
	if err != nil {
		return nil, err
	}

	var job AuditJob
	if err := json.Unmarshal([]byte(res[1]), &job); err != nil {
		return nil, err
	}
	return &job, nil
}