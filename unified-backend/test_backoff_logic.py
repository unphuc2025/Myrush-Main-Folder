import sys
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import unittest
from unittest.mock import MagicMock, patch

# Add the project root to sys.path
sys.path.append(os.getcwd())

import models
from services.integrations.outbox_worker import _handle_failure

class TestBackoffLogic(unittest.TestCase):
    def setUp(self):
        # Create a mock event
        self.event = models.OutboxEvent(
            id="test-event-uuid",
            attempts=0,
            max_attempts=5,
            status='pending',
            error_message="Initial error"
        )

    def test_backoff_sequence(self):
        # Expected delays: 5, 15, 60, 240
        expected_delays = [5, 15, 60, 240]
        
        for i, expected_delay in enumerate(expected_delays):
            self.event.attempts = i + 1  # 1st failure, 2nd failure, etc.
            self.event.error_message = f"Error at attempt {self.event.attempts}"
            
            with patch('services.integrations.outbox_worker.datetime') as mock_datetime:
                mock_now = datetime(2026, 1, 1, 12, 0, 0)
                mock_datetime.utcnow.return_value = mock_now
                
                _handle_failure(self.event)
                
                self.assertEqual(self.event.status, 'failed')
                expected_next = mock_now + timedelta(minutes=expected_delay)
                self.assertEqual(self.event.next_attempt_at, expected_next)
                print(f"Attempt {self.event.attempts} correctly scheduled for {expected_delay}m delay.")

    def test_dead_status(self):
        # Set attempts to max_attempts
        self.event.attempts = 5
        self.event.max_attempts = 5
        self.event.error_message = "Final failure"
        
        _handle_failure(self.event)
        
        self.assertEqual(self.event.status, 'dead')
        print("Final attempt correctly marked status as 'dead'.")

if __name__ == '__main__':
    unittest.main()
