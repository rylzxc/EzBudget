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
# %pip install experta

# %%
# %pip install --upgrade frozendict

# %% [markdown]
# #### Decision Tree Modelling (Working adults)
#
# ##### Inputs:
#
# - Age
# - Have a car?
# - Planning to buy a home?
# - Still repaying home loans?
# - Have kids?
# - Supporting aged parents?
# - Monthly take-home pay
#   - IF don't know THEN ask for gross salary AND whether there is CPF contribution
# - Estimated current expenses on needs / wants / insurance / investment
# - Estimated current emergency funds
#
# ##### Recommended Actions:
#
# - Needs Analysis:
#   - Transportation
#   - Food
#   - Home loan payment / Rent expense
#   - Insurance expense
#   - Medical expense
#   - Others
#   - IF no car AND transport expenditure > $150: RECOMMEND taking public transport instead
#   - IF utility bill > 300: RECOMMEND electricity/water saving methods or switching utilities provider 
#   - IF insurance expenditure > 15% of take-home salary: REDUCE insurance expenditure
#   - IF needs expenditure > 50% of take-home salary: REDUCE spending on needs
#     - IF food expense > 15% of take-home salary: REDUCE spending on food
#     - IF housing expense > 35% of take-home salary: RECOMMEND finding alternatives
# - Wants Analysis:
#   - IF wants expenditure > 30% of take-home salary: REDUCE spending on wants
# - Savings Analysis:
#   - Investments
#   - Savings in bank
#   - IF investment expenditure < 10% of take-home salary: 
#     - IF age < 65: INVEST in long-term investment plans such as ETFs for retirement
#     - IF have kids: INVEST in short-term investment plans for kids' tertiary education
#     - IF planning to buy a home: INVEST in short-term investment plans for home loan repayment
#   - IF monthly savings < 20% of take-home salary: INCREASE savings by REDUCING spending on wants or needs
# - Emergency Funds Analysis:
#   - IF emergency funds < 3 months of current expenses: INCREASE savings
#   - ELSE IF emergency funds < 6 months of current expenses (needs + wants): RECOMMENDED to increase savings
#

# %%
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from experta import KnowledgeEngine, Fact, Rule, MATCH, TEST
from csp_solver_v4 import optimize_budget_with_weighted_quadratic_loss_custom_units

app = FastAPI()

# Allow CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend url
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BudgetInput(BaseModel):
    age: int
    number_of_kids: int
    monthly_take_home: float
    planning_to_buy_home: bool
    repaying_home_loans: bool
    supporting_aged_parents: bool
    owns_car: bool
    transport_expenditure: float
    food_expenditure: float
    housing_expenditure: float
    insurance_expenditure: float
    other_needs_expenditure: float
    emergency_funds: float
    investment_expenditure: float
    monthly_savings: float

class BudgetInfo(Fact):
    """Holds the user's budget-related information."""
    # Basic personal details
    age = int
    number_of_kids = int
    monthly_take_home = float
    planning_to_buy_home = bool
    repaying_home_loans = bool
    supporting_aged_parents = bool
    owns_car = bool

    # Expenses and savings details
    transport_expenditure = float
    food_expenditure = float
    housing_expenditure = float
    insurance_expenditure = float
    other_needs_expenditure = float
    emergency_funds = float
    investment_expenditure = float
    monthly_savings = float


class BudgetAdvisor(KnowledgeEngine):
    def __init__(self):
        super().__init__()
        self.recommendations = []

    # ---------------- Needs Analysis Rules ----------------
    @Rule(BudgetInfo(owns_car=MATCH.owns_car,
                     transport_expenditure=MATCH.transport),
          TEST(lambda owns_car, transport: 
               (not owns_car) and (transport > 150)),
          salience=9)
    def rule_public_transport(self, owns_car, transport):
        self.recommendations.append("Your transport spendings are above average. Consider taking public transport instead of using private options.")

    @Rule(BudgetInfo(insurance_expenditure=MATCH.insurance, monthly_take_home=MATCH.take_home),
          TEST(lambda insurance, take_home: insurance > 0.15 * take_home),
          salience=9)
    def rule_reduce_insurance(self, insurance, take_home):
        self.recommendations.append("Your spending on insurance is too high! " \
        "The recommended spending on insurance is maximum 15% of your take home-salary.")

    @Rule(BudgetInfo(transport_expenditure=MATCH.transport,
                     food_expenditure=MATCH.food,
                     housing_expenditure=MATCH.housing,
                     insurance_expenditure=MATCH.insurance,
                     other_needs_expenditure=MATCH.others, 
                     monthly_take_home=MATCH.take_home),
          TEST(lambda transport, food, housing, insurance, others, take_home: 
               (transport + food + housing + insurance + others) > 0.5 * take_home),
          salience=10)
    def rule_reduce_needs(self, transport, food, housing, insurance, others, take_home):
        self.recommendations.append("Your spending on necessities are too high! " \
        "The recommended spending on needs is maximum 50% of your take-home salary.")

    @Rule(BudgetInfo(food_expenditure=MATCH.food, monthly_take_home=MATCH.take_home),
          TEST(lambda food, take_home: food > 0.15 * take_home),
          salience=9)
    def rule_reduce_food(self, food, take_home):
        self.recommendations.append("Your spending on food are too high! " \
        "The recommended spending on food is maximum 15% of your take-home salary.")

    @Rule(BudgetInfo(housing_expenditure=MATCH.housing, monthly_take_home=MATCH.take_home),
          TEST(lambda housing, take_home: housing > 0.35 * take_home),
          salience=9)
    def rule_housing_alternatives(self, housing, take_home):
        self.recommendations.append("You may want to consider looking for alternative housing options " \
        "as housing costs are over 35% of your take-home salary.")

    # ---------------- Wants Analysis Rule ----------------
    @Rule(BudgetInfo(transport_expenditure=MATCH.transport,
                     food_expenditure=MATCH.food,
                     housing_expenditure=MATCH.housing,
                     insurance_expenditure=MATCH.insurance,
                     other_needs_expenditure=MATCH.others,
                     monthly_savings=MATCH.savings,
                     monthly_take_home=MATCH.take_home),
          TEST(lambda transport, food, housing, insurance, others, savings, take_home: 
               (take_home - savings - transport - food - housing - insurance - others) > 0.3 * take_home),
          salience=8)
    def rule_reduce_wants(self, transport, food, housing, insurance, others, savings, take_home):
        self.recommendations.append("Your spending on wants are too high! " \
        "The recommended spending on wants is maximum 30% of your take-home salary.")

    # ---------------- Savings Analysis Rules ----------------
    @Rule(BudgetInfo(investment_expenditure=MATCH.invest,
                     monthly_take_home=MATCH.take_home,
                     age=MATCH.age,
                     number_of_kids=MATCH.number_of_kids,
                     planning_to_buy_home=MATCH.buy_home),
          TEST(lambda invest, take_home: invest < 0.1 * take_home),
          salience=6)
    def rule_investment_recommendations(self, age, number_of_kids, buy_home):
        if age < 65:
            self.recommendations.append("Consider investing in long-term plans (e.g. ETFs) for retirement.")
        if number_of_kids > 0:
            self.recommendations.append("Consider short-term investment plans for your kids' tertiary education.")
        if buy_home:
            self.recommendations.append("Consider short-term investment plans to help with home loan repayment.")

    @Rule(BudgetInfo(monthly_savings=MATCH.savings, monthly_take_home=MATCH.take_home),
          TEST(lambda savings, take_home: savings < 0.2 * take_home),
          salience=7)
    def rule_increase_savings(self, savings, take_home):
        self.recommendations.append("Your savings are too low! You are recommended to save 20% of your take-home salary. " \
        "You can increase your monthly savings by reducing spending on needs or wants.")

    # ---------------- Emergency Funds Analysis Rules ----------------
    @Rule(BudgetInfo(emergency_funds=MATCH.funds, monthly_take_home=MATCH.take_home, monthly_savings=MATCH.savings),
          TEST(lambda funds, take_home, savings: funds < 3 * (take_home - savings)),
          salience=5)
    def rule_emergency_funds_low(self, funds, take_home, savings):
        self.recommendations.append("Financial experts recommend maintaining an emergency fund covering 3-6 months of your monthly expenses. " \
        "Currently, your savings fall short of the 3-month minimum. " \
        "To avoid financial stress during unexpected events, please consider increasing your savings as soon as possible.")

    @Rule(BudgetInfo(emergency_funds=MATCH.funds, monthly_take_home=MATCH.take_home, monthly_savings=MATCH.savings),
          TEST(lambda funds, take_home, savings: funds > 3 * (take_home - savings) and funds < 6 * (take_home - savings)),
          salience=5)
    def rule_emergency_funds_medium(self, funds, take_home, savings):
        self.recommendations.append("Financial experts recommend maintaining an emergency fund covering 3-6 months of your monthly expenses. " \
        "Build up your emergency funds to cover at least 6 months of your current expenses.")

@app.post("/analyze-budget")
async def analyze_budget(budget_data: BudgetInput):
    engine = BudgetAdvisor()
    engine.reset()
    engine.declare(BudgetInfo(**budget_data.dict()))
    engine.run()
    
    return {
        "recommendations": engine.recommendations,
        "status": "success"
    }

@app.post("/optimize-budget")
async def optimize_budget(budget_data: BudgetInput, weights: dict = None):
    # Convert all float fields to integers
    budget_dict = budget_data.dict()
    for key, value in budget_dict.items():
        if isinstance(value, float):
            budget_dict[key] = int(value)
    
    # Default weights if none provided
    if weights is None:
        weights = {
            'transport': 1,
            'food': 1,
            'housing': 1,
            'insurance': 1,
            'other_needs': 1,
            'savings': 1,
            'investments': 1
        }
    
    # Convert weights to integers if needed
    weight_mapping = {
        'transport_expenditure': int(weights['transport']),
        'food_expenditure': int(weights['food']),
        'housing_expenditure': int(weights['housing']),
        'insurance_expenditure': int(weights['insurance']),
        'other_needs_expenditure': int(weights['other_needs']),
        'monthly_savings': int(weights['savings']),
        'investment_expenditure': int(weights['investments'])
    }
    
    # Run optimization with custom weights
    optimization_result, _ = optimize_budget_with_weighted_quadratic_loss_custom_units(
        budget_dict,
        custom_weights=weight_mapping
    )
    
    return {
        "optimization": optimization_result,
        "status": "success"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

