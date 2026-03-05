"""
Tests for fortytwo agent configuration and utilities.
"""

import os
import sys
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestFortytwoConfig(unittest.TestCase):
    """Test configuration loading from environment variables."""

    def setUp(self):
        """Set up test environment variables."""
        self.env_patcher = patch.dict(os.environ, {
            'FORTYTWO_AGENT_ID': 'test-agent-id',
            'FORTYTWO_SECRET': 'test-secret',
            'OPENROUTER_API_KEY': 'test-openrouter-key',
        }, clear=False)
        self.env_patcher.start()

    def tearDown(self):
        """Clean up environment."""
        self.env_patcher.stop()

    def test_environment_variables_loaded(self):
        """Test that environment variables are accessible."""
        self.assertEqual(os.environ.get('FORTYTWO_AGENT_ID'), 'test-agent-id')
        self.assertEqual(os.environ.get('FORTYTWO_SECRET'), 'test-secret')
        self.assertEqual(os.environ.get('OPENROUTER_API_KEY'), 'test-openrouter-key')

    def test_missing_credentials_detection(self):
        """Test that missing credentials are detected."""
        with patch.dict(os.environ, {'FORTYTWO_AGENT_ID': '', 'FORTYTWO_SECRET': ''}, clear=False):
            agent_id = os.environ.get('FORTYTWO_AGENT_ID', '')
            secret = os.environ.get('FORTYTWO_SECRET', '')
            self.assertFalse(bool(agent_id and secret))


class TestOpenMindConfig(unittest.TestCase):
    """Test OpenMind agent configuration."""

    def setUp(self):
        """Set up test environment variables."""
        self.env_patcher = patch.dict(os.environ, {
            'OPENMIND_API_KEY': 'test-openmind-key',
        }, clear=False)
        self.env_patcher.start()

    def tearDown(self):
        """Clean up environment."""
        self.env_patcher.stop()

    def test_api_key_loaded(self):
        """Test that API key is accessible from environment."""
        self.assertEqual(os.environ.get('OPENMIND_API_KEY'), 'test-openmind-key')


class TestTokenFile(unittest.TestCase):
    """Test token file handling."""

    def test_token_file_path_from_env(self):
        """Test that token file path can be configured via environment."""
        test_path = '/tmp/test_tokens.json'
        with patch.dict(os.environ, {'FORTYTWO_TOKEN_FILE': test_path}, clear=False):
            token_file = os.environ.get('FORTYTWO_TOKEN_FILE', 'fortytwo_tokens.json')
            self.assertEqual(token_file, test_path)

    def test_default_token_file_path(self):
        """Test default token file path when env not set."""
        with patch.dict(os.environ, {}, clear=False):
            if 'FORTYTWO_TOKEN_FILE' in os.environ:
                del os.environ['FORTYTWO_TOKEN_FILE']
            token_file = os.environ.get('FORTYTWO_TOKEN_FILE', 'fortytwo_tokens.json')
            self.assertEqual(token_file, 'fortytwo_tokens.json')


if __name__ == '__main__':
    unittest.main()
