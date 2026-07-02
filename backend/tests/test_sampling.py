"""Tests for the Academic Sample Size and Selection Engine."""

import pytest

from app.services.statistics.sampling import (
    calculate_sample_size,
    generate_simple_random_sample,
    generate_systematic_sample
)


def test_calculate_sample_size_basic():
    """Validates the sample size formula on a known dataset.
    
    Example: 
    N = 100,000, E0 = 0.05 (5%)
    n0 = 1 / (0.05)^2 = 1 / 0.0025 = 400
    n = (100,000 * 400) / (100,000 + 400) = 40,000,000 / 100,400 = 398.406...
    IBGE rounded to 0 decimals: 398.
    """
    res = calculate_sample_size(100000, 0.05)
    
    assert res["population_size"] == 100000
    assert res["tolerable_error"] == 0.05
    assert res["first_approximation_n0"] == 400.0
    assert res["final_sample_size_n"] == 398


def test_calculate_sample_size_small_population():
    """Validates that for small populations, n is heavily adjusted by N."""
    # N = 500, E0 = 0.05
    # n0 = 400
    # n = (500 * 400) / 900 = 200,000 / 900 = 222.22... -> 222
    res = calculate_sample_size(500, 0.05)
    
    assert res["first_approximation_n0"] == 400.0
    assert res["final_sample_size_n"] == 222


def test_calculate_sample_size_invalid_inputs():
    """Ensures mathematical validation traps bad inputs."""
    with pytest.raises(ValueError, match="strictly positive"):
        calculate_sample_size(0, 0.05)
        
    with pytest.raises(ValueError, match="between 0 and 1"):
        calculate_sample_size(1000, 5)  # E0 should be 0.05, not 5


def test_generate_simple_random_sample():
    """Validates Simple Random Sampling (AAS)."""
    # N = 100, n = 10, seed for determinism
    sample = generate_simple_random_sample(100, 10, seed=42)
    
    assert len(sample) == 10
    assert len(set(sample)) == 10  # Must be unique (without replacement)
    assert all(0 <= x < 100 for x in sample)
    assert sorted(sample) == sample  # Function promises sorted output


def test_generate_systematic_sample():
    """Validates Systematic Sampling (AS)."""
    # N = 100, n = 20
    # k = 100 // 20 = 5
    # Let's use a seed that produces r = 2
    # Elements should be 2, 7, 12, 17...
    import random
    random.seed(42)
    # the first call to randint(0, 4) with seed 42 in python 3.x usually gives 0, let's just check the spacing
    
    sample = generate_systematic_sample(100, 20)
    
    assert len(sample) == 20
    
    # Check that the distance between consecutive elements is exactly k
    k = 100 // 20
    for i in range(1, len(sample)):
        assert sample[i] - sample[i-1] == k
        
    assert all(0 <= x < 100 for x in sample)
