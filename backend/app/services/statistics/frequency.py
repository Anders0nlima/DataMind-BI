"""DataMind BI — Sturges Rule Frequency Distribution Engine.

This module implements deterministic algorithms to calculate frequency 
distributions for continuous quantitative variables based on the 
Sturges Rule (K = 1 + 3.322 * log10(N)).
"""

import math
from typing import TypedDict

from app.services.statistics.heuristics import ibge_round


class FrequencyRow(TypedDict):
    """Represents a single row (class) in a frequency distribution table."""
    class_name: str     # e.g., "10 ├─ 20"
    lower_limit: float
    upper_limit: float
    midpoint: float
    absolute_freq: int  # fi
    relative_freq: float # fr (%)
    cumulative_freq: int # Fi
    cumulative_relative_freq: float # Fr (%)


class FrequencyDistribution(TypedDict):
    """The complete frequency distribution dataset."""
    total_elements: int
    amplitude_total: float
    sturges_k: int
    class_amplitude: float
    table: list[FrequencyRow]


def calculate_sturges_distribution(data: list[float], decimal_places: int = 2) -> FrequencyDistribution:
    """Calculates the frequency distribution using Sturges' Rule.
    
    Applies pure statistical formulas:
    - K (Number of classes) = 1 + 3.322 * log10(N)
    - AT (Total Amplitude) = Max - Min
    - h (Class Amplitude) = AT / K
    
    All rounding strictly follows the IBGE standards implemented in the heuristics module.
    
    Args:
        data: The raw numerical dataset (must be continuous quantitative).
        decimal_places: Precision for limits and percentages.
        
    Returns:
        A structured dictionary representing the full statistical table.
    """
    if not data:
        raise ValueError("Cannot calculate frequency distribution on empty data.")
        
    n = len(data)
    
    # 1. Sturges' Rule for Number of Classes (K)
    k_raw = 1 + 3.322 * math.log10(n)
    k = int(ibge_round(k_raw, 0))
    if k < 1:
        k = 1
        
    # 2. Total Amplitude (AT)
    min_val = min(data)
    max_val = max(data)
    a_t = max_val - min_val
    
    # 3. Class Amplitude (h)
    # If the data has no variance (AT=0), default h to 1 to prevent DivisionByZero.
    h_raw = a_t / k if k > 0 else 1
    h = ibge_round(h_raw, decimal_places)
    
    # Enforce a minimal amplitude if rounding reduced it to 0
    if h == 0:
        h = 10 ** -decimal_places
        
    table: list[FrequencyRow] = []
    current_lower = ibge_round(min_val, decimal_places)
    
    cumulative_freq = 0
    cumulative_relative_freq = 0.0
    
    for i in range(k):
        current_upper = ibge_round(current_lower + h, decimal_places)
        
        # Standard Brazilian statistical notation
        # Except the last class which usually includes the upper limit to catch the max value
        if i == k - 1:
            # Last class: [lower, upper]
            freq = sum(1 for x in data if current_lower <= x <= current_upper)
            class_name = f"{current_lower} ├─┤ {current_upper}"
        else:
            # Standard class: [lower, upper)
            freq = sum(1 for x in data if current_lower <= x < current_upper)
            class_name = f"{current_lower} ├─ {current_upper}"
            
        rel_freq = ibge_round((freq / n) * 100, decimal_places)
        
        cumulative_freq += freq
        
        # Avoid accumulation precision bugs on the final percentage row
        if i == k - 1:
            cumulative_relative_freq = 100.0
        else:
            cumulative_relative_freq = ibge_round(cumulative_relative_freq + rel_freq, decimal_places)
            
        midpoint = ibge_round((current_lower + current_upper) / 2, decimal_places)
        
        table.append({
            "class_name": class_name,
            "lower_limit": current_lower,
            "upper_limit": current_upper,
            "midpoint": midpoint,
            "absolute_freq": freq,
            "relative_freq": rel_freq,
            "cumulative_freq": cumulative_freq,
            "cumulative_relative_freq": cumulative_relative_freq
        })
        
        current_lower = current_upper
        
    return {
        "total_elements": n,
        "amplitude_total": ibge_round(a_t, decimal_places),
        "sturges_k": k,
        "class_amplitude": h,
        "table": table
    }
