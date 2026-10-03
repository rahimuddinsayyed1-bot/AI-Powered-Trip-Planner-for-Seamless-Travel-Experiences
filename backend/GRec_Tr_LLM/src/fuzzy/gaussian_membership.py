import numpy as np

def gaussian_membership(x: float, c: float, sigma: float) -> float:
    """
    Standard symmetric Gaussian membership function.
    Returns 1.0 if x == c, and drops symmetrically as x deviates from c.
    Formula: exp(-(x - c)^2 / (2 * sigma^2))
    """
    if sigma == 0:
        return 1.0 if x == c else 0.0
    return float(np.exp(-((x - c) ** 2) / (2 * (sigma ** 2))))

def gaussian_less_than_or_equal(x: float, c: float, sigma: float) -> float:
    """
    Asymmetric Gaussian for 'smaller is better' constraints (e.g., max_budget).
    - If x <= c (under budget), satisfaction is 1.0 (perfect).
    - If x > c (over budget), satisfaction decays using the Gaussian curve.
    """
    if x <= c:
        return 1.0
    if sigma == 0:
        return 0.0
    return float(np.exp(-((x - c) ** 2) / (2 * (sigma ** 2))))

def gaussian_greater_than_or_equal(x: float, c: float, sigma: float) -> float:
    """
    Asymmetric Gaussian for 'larger is better' constraints (e.g., min_hotel_rating).
    - If x >= c (above minimum rating), satisfaction is 1.0 (perfect).
    - If x < c (below minimum rating), satisfaction decays using the Gaussian curve.
    """
    if x >= c:
        return 1.0
    if sigma == 0:
        return 0.0
    return float(np.exp(-((x - c) ** 2) / (2 * (sigma ** 2))))
