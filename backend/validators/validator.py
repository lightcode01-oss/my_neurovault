#!/usr/bin/env python3
"""
backend/validators/validator.py

Lightweight validator automation. Polls the backend for candidate memories,
computes a deterministic embedding, applies a simple heuristic, and posts
the validation to the backend. If `VALIDATOR_KEY` is not set, runs in dry-run
mode and prints the intended action instead of submitting on-chain.

This file replaces prior concatenated/duplicated copies and is intentionally
minimal so it can be run in CI or locally. TODO markers are left for
production hardening (signing, auth, retries, ML models).
"""

from __future__ import annotations

import argparse
import hashlib
import logging
import os
import sys
import time
from typing import List, Optional

import requests

LOG = logging.getLogger("nv.validator")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(message)s")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
VALIDATOR_KEY = os.getenv("VALIDATOR_KEY")  # if missing, run in dry-run
POLL_INTERVAL = int(os.getenv("VALIDATOR_POLL_INTERVAL", "30"))
BATCH_SIZE = int(os.getenv("VALIDATOR_BATCH_SIZE", "5"))


def deterministic_embedding(text: str, dim: int = 8) -> List[float]:
	"""Simple deterministic embedding (placeholder for model/API).

	Deterministic so tests are stable when API keys are missing.
	"""
	h = hashlib.sha256(text.encode("utf-8")).digest()
	out: List[float] = []
	for i in range(dim):
		v = int.from_bytes(h[(i * 2) : (i * 2 + 2)], "big")
		out.append((v / 65535.0) * 2 - 1)
	return out


def compute_score_from_embedding(embedding: List[float], title: str, category: Optional[str]) -> int:
	# Simple deterministic scoring: use norm + title length + category boost
	norm = sum(x * x for x in embedding) ** 0.5
	base = int(norm * 100)
	title_bonus = min(200, len(title) * 5)
	cat_bonus = {"science": 50, "history": 30, "art": 20}.get(category or "", 0)
	score = max(0, min(1000, base + title_bonus + cat_bonus))
	return score


class ValidatorClient:
	def __init__(self, backend_url: str, validator_key: Optional[str] = None, dry_run: bool = False):
		self.backend_url = backend_url.rstrip("/")
		self.validator_key = validator_key
		self.dry_run = dry_run or (validator_key is None)
		self.session = requests.Session()
		if self.dry_run:
			LOG.warning("VALIDATOR_KEY not set -> running in dry-run mode (no on-chain submission)")

	def fetch_candidates(self, limit: int = BATCH_SIZE):
		try:
			r = self.session.get(f"{self.backend_url}/memories", params={"limit": limit}, timeout=5)
			r.raise_for_status()
			data = r.json()
			# backend may return schema; we treat items as candidate memories
			return data
		except Exception as e:
			LOG.error("Failed to fetch candidates: %s", e)
			return []

	def validate_and_submit(self, memory: dict) -> bool:
		mid = memory.get("id")
		title = memory.get("title", "")
		category = memory.get("category")
		text = f"{title} {memory.get('summary','')}"

		emb = deterministic_embedding(text)
		score = compute_score_from_embedding(emb, title, category)
		is_valid = score >= 300

		payload = {
			"memory_id": mid,
			"is_valid": bool(is_valid),
			"score": int(score),
			"explanation": f"Auto-decided (dry-run={self.dry_run})",
			"validator": os.getenv("VALIDATOR_ADDRESS", "0x" + "0" * 40),
		}

		if self.dry_run:
			LOG.info("Dry-run: would submit validation: %s", payload)
			return True

		try:
			r = self.session.post(f"{self.backend_url}/validate", json=payload, timeout=5)
			r.raise_for_status()
			LOG.info("Submitted validation for memory %s: score=%s", mid, score)
			return True
		except Exception as e:
			LOG.error("Failed to submit validation for %s: %s", mid, e)
			return False


def run_once(backend_url: str, dry_run: bool = False):
	client = ValidatorClient(backend_url, VALIDATOR_KEY, dry_run=dry_run)
	candidates = client.fetch_candidates(limit=BATCH_SIZE)
	count = 0
	for m in candidates:
		ok = client.validate_and_submit(m)
		if ok:
			count += 1
	LOG.info("Processed %d candidates", count)
	return count


def run_daemon(backend_url: str, interval: int = POLL_INTERVAL, dry_run: bool = False):
	LOG.info("Starting validator daemon (interval=%s)s", interval)
	client = ValidatorClient(backend_url, VALIDATOR_KEY, dry_run=dry_run)
	try:
		while True:
			candidates = client.fetch_candidates(limit=BATCH_SIZE)
			for m in candidates:
				client.validate_and_submit(m)
			time.sleep(interval)
	except KeyboardInterrupt:
		LOG.info("Validator daemon stopped by user")


def main(argv: Optional[List[str]] = None) -> int:
	ap = argparse.ArgumentParser(description="MemoryRegistry Validator Automation")
	ap.add_argument("--backend", default=BACKEND_URL, help="Backend URL")
	ap.add_argument("--once", action="store_true", help="Run once and exit")
	ap.add_argument("--interval", type=int, default=POLL_INTERVAL, help="Daemon poll interval (s)")
	ap.add_argument("--dry", action="store_true", help="Force dry-run mode")
	args = ap.parse_args(argv)

	if args.once:
		run_once(args.backend, dry_run=args.dry)
		return 0

	run_daemon(args.backend, interval=args.interval, dry_run=args.dry)
	return 0


if __name__ == "__main__":
	try:
		sys.exit(main())
	except Exception as e:
		LOG.exception("Unhandled error in validator: %s", e)
		sys.exit(1)

