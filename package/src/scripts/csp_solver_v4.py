# ---
# jupyter:
#   jupytext:
#     text_representation:
#       extension: .py
#       format_name: percent
#       format_version: '1.3'
#       jupytext_version: 1.17.0
#   kernelspec:
#     display_name: .venv
#     language: python
#     name: python3
# ---

# %%
# %pip install ortools

# %%
from ortools.sat.python import cp_model

def optimize_budget_with_weighted_quadratic_loss_custom_units(current_allocations, custom_weights=None, scale=1000):
    """
    Optimize budget allocation while penalizing deviations from current allocations using a weighted quadratic loss.
    In this version, the allocations are constrained to be in fixed steps:
      - 'transport' is allocated in multiples of 10 dollars.
      - All other categories are allocated in multiples of 50 dollars.
    
    The loss for each category is:
      weight[cat] * (effective_allocation[cat] - current_allocations[cat])^2
    where effective_allocation[cat] = factor[cat] * (unit variable for cat).
    
    Arguments:
      current_allocations: dict mapping category names (e.g., 'savings', 'housing', etc.) to their current dollar allocations.
      scale: a constant used to determine the weight for each category.
      
    Returns:
      A tuple (result, total_weighted_quad_loss) where:
        - result is a dict with the effective (dollar) allocation for each category,
        - total_weighted_quad_loss is the sum of the weighted quadratic losses.
    """
    model = cp_model.CpModel()
    
    income = int(current_allocations.get('monthly_take_home', 0))
    if income <= 0:
        return None, None  # Handle zero/negative income case

    # Define budget categories.
    categories = ['transport_expenditure', 'food_expenditure', 'housing_expenditure', 'insurance_expenditure', 'other_needs_expenditure',
                  'investment_expenditure', 'monthly_savings', 'total_needs', 'total_wants']

    # Convert current allocations to integers
    current_allocations = {k: int(v) if isinstance(v, (float, int)) else v 
                         for k, v in current_allocations.items()}
    # Define the step factor for each category:
    # For transport we want increments of 10 dollars and for others increments of 50 dollars.
    factors = {}
    for cat in categories:
        if cat == 'transport_expenditure':
            factors[cat] = 10
        else:
            factors[cat] = 50
    
    # We update current allocations for total_needs and total_wants based on the provided
    # breakdown. For example, we set current total_needs as the sum of transport, food, housing,
    # insurance, and other_needs. Then current_total_wants is derived to ensure total income
    # equals savings + total_needs + total_wants.
    current_total_needs = 0
    for cat in ['transport_expenditure', 'food_expenditure', 'housing_expenditure', 'insurance_expenditure', 'other_needs_expenditure']:
        current_total_needs += current_allocations.get(cat, 0)
    current_total_wants = income - current_total_needs - current_allocations.get('monthly_savings', 0)
    current_allocations['total_needs'] = current_total_needs
    current_allocations['total_wants'] = current_total_wants
    
    # Compute a weight for each category based on its current allocation.
    # A lower current allocation gives a higher weight.
    weights = {}
    for cat in categories:
        if custom_weights and cat in custom_weights:
            weights[cat] = custom_weights[cat]
        else:
            current_val = current_allocations.get(cat, 0)
            weights[cat] = scale / (current_val + 1)
            weights[cat] = max(1, int(round(weights[cat])))
    
    # Dictionaries to hold decision variables.
    unit_vars = {}   # decision variables in units
    alloc_vars = {}  # effective allocations (in dollars)
    quad_vars = {}   # quadratic loss variables (deviation squared)
    weighted_quad_terms = []  # objective terms
    
    # Create decision variables for each category.
    for cat in categories:
        factor = factors[cat]
        max_units = income // factor  # maximum units so that effective allocation <= income.
        unit_vars[cat] = model.NewIntVar(0, max_units, f"{cat}_units")
        
        # Effective dollar allocation for this category.
        alloc_vars[cat] = model.NewIntVar(0, income, f"{cat}_allocation")
        model.Add(alloc_vars[cat] == unit_vars[cat] * factor)
        
        # Compute deviation from the current allocation (in dollars).
        current_val = current_allocations.get(cat, 0)
        dev = model.NewIntVar(-income, income, f"dev_{cat}")
        model.Add(dev == alloc_vars[cat] - current_val)
        
        # Compute quadratic loss for the deviation.
        quad = model.NewIntVar(0, income**2, f"quad_{cat}")
        model.AddMultiplicationEquality(quad, [dev, dev])
        quad_vars[cat] = quad
        
        # Multiply by the weight for this category.
        weighted_term = weights[cat] * quad
        weighted_quad_terms.append(weighted_term)
    
    # --- Budget Constraints ---
    # For example, we enforce that the sum of the effective allocations for the needs categories equals total_needs.
    model.Add(sum(alloc_vars[cat] for cat in ['transport_expenditure', 'food_expenditure', 'housing_expenditure', 'insurance_expenditure', 'other_needs_expenditure'])
              == alloc_vars['total_needs'])
    
    # Total allocation constraint: total_needs + total_wants + savings must equal the total income.
    model.Add(sum(alloc_vars[cat] for cat in ['total_needs', 'total_wants', 'monthly_savings']) == income)
    
    # Hard constraints (adjust these bounds as needed):
    model.Add(alloc_vars['monthly_savings'] >= int(0.2 * income))
    model.Add(alloc_vars['total_needs'] <= int(0.5 * income))
    model.Add(alloc_vars['total_wants'] <= int(0.3 * income))
    
    # --- Objective: minimize total weighted quadratic loss ---
    model.Minimize(sum(weighted_quad_terms))
    
    # Solve the model.
    solver = cp_model.CpSolver()
    status = solver.Solve(model)
    
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        # Extract effective allocations (dollar amounts).
        result = {cat: solver.Value(alloc_vars[cat]) for cat in categories}
        total_weighted_quad_loss = sum(solver.Value(quad_vars[cat]) * weights[cat] for cat in categories)
        return result, total_weighted_quad_loss
    else:
        return None, None

# Example usage:
# if __name__ == "__main__":
#     # current_allocations = {
#     #     'transport_expenditure': 200,
#     #     'food_expenditure': 1000,
#     #     'housing_expenditure': 1200,
#     #     'insurance_expenditure': 50,
#     #     'other_needs_expenditure': 50,
#     #     'investment_expenditure': 300,
#     #     'monthly_savings': 1000,
#     # }
#     current_allocations = {
#         'age': 30,
#         'number_of_kids': 1,
#         'monthly_take_home': 4000,
#         'planning_to_buy_home': True,
#         'repaying_home_loans': False,
#         'supporting_aged_parents': False,
#         'owns_car': True,
#         'transport_expenditure': 100,
#         'food_expenditure': 100,
#         'housing_expenditure': 1000,
#         'insurance_expenditure': 100,
#         'other_needs_expenditure': 700,
#         'emergency_funds': 6000,
#         'investment_expenditure': 300,
#         'monthly_savings': 700
#     }
#     income = 4000
#     solution, loss = optimize_budget_with_weighted_quadratic_loss_custom_units(current_allocations, scale=1000)
#     if solution:
#         print("Optimized Effective Allocation (in dollars):")
#         for k, v in solution.items():
#             print(f"  {k}: {v}")
#         print("Total Weighted Quadratic Loss:", loss)
#     else:
#         print("No feasible solution found.")
