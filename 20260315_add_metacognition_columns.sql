-- Migration: Add metacognition columns to agent_cycles
-- Purpose: Enable Safe Mode win-rate tracking, Adaptive Mood, and Dynamic Conviction logging
-- Run this in Supabase SQL Editor when the project is active

ALTER TABLE agent_cycles
  ADD COLUMN IF NOT EXISTS trades_successful integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mood text DEFAULT 'confident',
  ADD COLUMN IF NOT EXISTS dynamic_conviction numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS safe_mode_active boolean DEFAULT false;

COMMENT ON COLUMN agent_cycles.trades_successful IS 'Number of profitable trades in this cycle (for win rate / Safe Mode)';
COMMENT ON COLUMN agent_cycles.mood IS 'Agent mood: confident (>70% win), cautious (50-70%), defensive (<50%)';
COMMENT ON COLUMN agent_cycles.dynamic_conviction IS 'Average dynamic conviction score for this cycle';
COMMENT ON COLUMN agent_cycles.safe_mode_active IS 'Whether Safe Mode was active during this cycle';
