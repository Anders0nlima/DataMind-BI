"""Tests for the Sturges Frequency Distribution Engine."""

import pytest

from app.services.statistics.frequency import calculate_sturges_distribution


def test_sturges_distribution_basic():
    """Validates the math of Sturges distribution (K, AT, h) on a fixed dataset.
    
    Using N = 20 elements.
    Sturges Formula: K = 1 + 3.322 * log10(20) = 1 + 4.3219 = 5.3219 -> Rounded to 5 classes.
    """
    data = [
        12.5, 13.0, 14.2, 15.1, 15.5, 
        16.0, 16.2, 16.5, 17.0, 17.1, 
        17.8, 18.0, 18.5, 19.0, 19.2, 
        20.5, 21.0, 22.0, 23.5, 24.0
    ]
    
    dist = calculate_sturges_distribution(data, decimal_places=1)
    
    # Check general properties
    assert dist["total_elements"] == 20
    assert dist["sturges_k"] == 5
    
    # AT = Max (24.0) - Min (12.5) = 11.5
    assert dist["amplitude_total"] == 11.5
    
    # h = AT / K = 11.5 / 5 = 2.3
    assert dist["class_amplitude"] == 2.3
    
    # Verify table structure
    table = dist["table"]
    assert len(table) == 5
    
    # First class: 12.5 |- 14.8
    assert table[0]["lower_limit"] == 12.5
    assert table[0]["upper_limit"] == 14.8
    assert table[0]["class_name"] == "12.5 ├─ 14.8"
    
    # Midpoint of first class: (12.5 + 14.8) / 2 = 13.65 
    # IBGE rounding to 1 decimal place: digit is 5 -> adds 1 to 6 -> 13.7
    assert table[0]["midpoint"] == 13.7
    
    # Last class cumulative properties
    assert table[-1]["cumulative_freq"] == 20
    assert table[-1]["cumulative_relative_freq"] == 100.0


def test_sturges_zero_variance():
    """Ensures the engine doesn't crash on datasets with AT=0 (all elements identical)."""
    data = [5.0, 5.0, 5.0, 5.0]
    # N=4, K = 1 + 3.322*log10(4) = 1 + 2 = 3
    # AT = 0
    dist = calculate_sturges_distribution(data, decimal_places=2)
    
    assert dist["total_elements"] == 4
    assert dist["amplitude_total"] == 0.0
    assert dist["class_amplitude"] > 0 # h should fallback to >0 to prevent infinite loops/zero division


def test_sturges_empty_data():
    """Ensures empty data raises the proper validation error."""
    with pytest.raises(ValueError, match="empty data"):
        calculate_sturges_distribution([])
