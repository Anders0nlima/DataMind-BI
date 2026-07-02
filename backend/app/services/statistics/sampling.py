"""DataMind BI — Academic Sample Size and Selection Engine.

Implements the UFPA/IBGE formulas for calculating statistically significant 
sample sizes and generating unbiased randomized sample indices.
"""

import random
from typing import TypedDict

from app.services.statistics.heuristics import ibge_round


class SampleSizeResult(TypedDict):
    """Result of the sample size calculation."""
    population_size: int
    tolerable_error: float
    first_approximation_n0: float
    final_sample_size_n: int


def calculate_sample_size(population_size: int, error_margin: float) -> SampleSizeResult:
    """Calculates the ideal sample size (n) for a finite population (N).
    
    Academic Formulas applied:
    1. n0 (First Approximation) = 1 / (E0)^2
    2. n (Final Size) = (N * n0) / (N + n0)
    
    Args:
        population_size: Total number of elements in the dataset (N).
        error_margin: Tolerable sampling error (E0) expressed as a decimal (e.g., 0.05 for 5%).
        
    Returns:
        SampleSizeResult with intermediate and final calculations.
    """
    if population_size <= 0:
        raise ValueError("Population size must be strictly positive.")
    if error_margin <= 0 or error_margin >= 1:
        raise ValueError("Error margin must be between 0 and 1 (exclusive).")
        
    # n0 = 1 / (E0)^2
    n0 = 1 / (error_margin ** 2)
    
    # n = (N * n0) / (N + n0)
    n_raw = (population_size * n0) / (population_size + n0)
    
    # Apply IBGE rounding to get the final discrete integer sample size
    n = int(ibge_round(n_raw, 0))
    
    return {
        "population_size": population_size,
        "tolerable_error": error_margin,
        "first_approximation_n0": ibge_round(n0, 4),
        "final_sample_size_n": n
    }


def generate_simple_random_sample(population_size: int, sample_size: int, seed: int = None) -> list[int]:
    """Generates indices for a Simple Random Sample (AAS).
    
    Uses sampling without replacement.
    Returns 0-indexed values for array compatibility.
    """
    if sample_size > population_size:
        raise ValueError("Sample size cannot exceed population size.")
    if sample_size <= 0:
        return []
        
    if seed is not None:
        random.seed(seed)
        
    return sorted(random.sample(range(population_size), sample_size))


def generate_systematic_sample(population_size: int, sample_size: int, seed: int = None) -> list[int]:
    """Generates indices for a Systematic Sample (AS).
    
    Academic algorithm:
    1. Calculate step (k) = N / n (integer division)
    2. Randomly select a starting point (r) between 0 and k-1
    3. Select elements: r, r + k, r + 2k, ...
    """
    if sample_size > population_size:
        raise ValueError("Sample size cannot exceed population size.")
    if sample_size <= 0:
        return []
        
    k = population_size // sample_size
    if k == 0:
        k = 1
        
    if seed is not None:
        random.seed(seed)
        
    r = random.randint(0, k - 1)
    
    # Generate exactly `sample_size` elements.
    # Mathematically safe from out-of-bounds because max index is (k-1) + (n-1)*k = n*k - 1
    # Since k = N//n, n*k <= N, so n*k - 1 < N.
    return [r + i * k for i in range(sample_size)]
