"""
Tests for SQL Sanitizer and Langfuse Telemetry modules.
"""
import pytest

from app.core.sql_sanitizer import sanitize_sql, SQLInjectionBlocked
from app.core.telemetry import LangfuseTelemetry, GenerationTrace


# ═══════════════════════════════════════════════════════════════════════
#  SQL SANITIZER TESTS
# ═══════════════════════════════════════════════════════════════════════

class TestSQLSanitizer:
    """Prove the regex shield blocks every destructive pattern."""

    # ── Safe queries that MUST pass ──────────────────────────────────

    def test_simple_select_passes(self):
        result = sanitize_sql("SELECT AVG(salary) FROM employees")
        assert result == "SELECT AVG(salary) FROM employees"

    def test_select_with_where_passes(self):
        result = sanitize_sql(
            "SELECT name, salary FROM employees WHERE department = 'TI'"
        )
        assert "name" in result

    def test_cte_with_clause_passes(self):
        result = sanitize_sql(
            "WITH totals AS (SELECT dept, SUM(salary) as total "
            "FROM emp GROUP BY dept) SELECT * FROM totals"
        )
        assert result.startswith("WITH")

    def test_strips_whitespace(self):
        result = sanitize_sql("   SELECT 1   ")
        assert result == "SELECT 1"

    def test_column_named_updated_at_passes(self):
        """Columns like 'updated_at' must NOT trigger the UPDATE blocker."""
        # The word boundary \bUPDATE\b should NOT match inside 'updated_at'
        result = sanitize_sql(
            "SELECT updated_at, deleted_at FROM logs"
        )
        assert "updated_at" in result

    # ── Destructive queries that MUST be blocked ─────────────────────

    @pytest.mark.parametrize("dangerous_sql,keyword", [
        ("DROP TABLE employees", "DROP"),
        ("DELETE FROM employees WHERE id = 1", "DELETE"),
        ("ALTER TABLE employees ADD COLUMN age INT", "ALTER"),
        ("INSERT INTO employees VALUES (1, 'hack')", "INSERT"),
        ("UPDATE employees SET salary = 0", "UPDATE"),
        ("CREATE TABLE hacked (id INT)", "CREATE"),
        ("TRUNCATE TABLE employees", "TRUNCATE"),
        ("ATTACH DATABASE 'evil.db' AS evil", "ATTACH"),
        ("PRAGMA enable_progress_bar", "PRAGMA"),
        ("INSTALL httpfs", "INSTALL"),
        ("LOAD httpfs", "LOAD"),
    ])
    def test_blocks_destructive_keywords(self, dangerous_sql: str, keyword: str):
        with pytest.raises(SQLInjectionBlocked) as exc_info:
            sanitize_sql(dangerous_sql)
        assert keyword.upper() in str(exc_info.value).upper()

    def test_blocks_multi_statement_injection(self):
        with pytest.raises(SQLInjectionBlocked) as exc_info:
            sanitize_sql("SELECT 1; DROP TABLE users")
        assert "MULTI_STATEMENT" in str(exc_info.value)

    def test_blocks_empty_query(self):
        with pytest.raises(SQLInjectionBlocked):
            sanitize_sql("")

    def test_blocks_non_select_query(self):
        with pytest.raises(SQLInjectionBlocked):
            sanitize_sql("EXPLAIN SELECT 1")

    def test_case_insensitive_blocking(self):
        with pytest.raises(SQLInjectionBlocked):
            sanitize_sql("drop table employees")


# ═══════════════════════════════════════════════════════════════════════
#  TELEMETRY TESTS
# ═══════════════════════════════════════════════════════════════════════

class TestLangfuseTelemetry:
    """Prove telemetry works in noop mode without cloud credentials."""

    def test_noop_mode_initializes(self):
        """Without env vars, telemetry must not crash."""
        telemetry = LangfuseTelemetry(client=None)
        assert telemetry._enabled is False

    def test_trace_context_manager_noop(self):
        """The context manager must work even without Langfuse."""
        telemetry = LangfuseTelemetry(client=None)
        with telemetry.trace("test_trace", user_id="test") as t:
            record = t.log_generation(
                model="gemini-2.5-flash",
                input_tokens=100,
                output_tokens=50,
                prompt_preview="What is the average?",
                output_preview="The average is 42.",
            )

        assert isinstance(record, GenerationTrace)
        assert record.model == "gemini-2.5-flash"
        assert record.input_tokens == 100
        assert record.output_tokens == 50
        assert record.total_tokens == 150
        assert record.latency_ms >= 0

    def test_from_env_without_keys(self, monkeypatch):
        """from_env() must gracefully degrade when keys are absent."""
        monkeypatch.delenv("LANGFUSE_PUBLIC_KEY", raising=False)
        monkeypatch.delenv("LANGFUSE_SECRET_KEY", raising=False)

        telemetry = LangfuseTelemetry.from_env()
        assert telemetry._enabled is False

    def test_multiple_generations_in_trace(self):
        """Multiple generations within a single trace must all be recorded."""
        telemetry = LangfuseTelemetry(client=None)
        with telemetry.trace("multi_gen") as t:
            t.log_generation(model="m1", input_tokens=10, output_tokens=5)
            t.log_generation(model="m2", input_tokens=20, output_tokens=10)

        assert len(t._generations) == 2
        assert t._generations[0].model == "m1"
        assert t._generations[1].model == "m2"
