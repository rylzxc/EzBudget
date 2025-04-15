from typing import Union

from prediction_engine import PredictionEngine

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# initialize the prediction engine
state = {
  "food": 500,
  "transport": 100,
  "use_public_transport": True,
  "utilities": 0,
  "discretionary": 500,
  "housing": 1200,
  "invest": 0,
  "take_home": 2500,
}
engine = PredictionEngine(**state)




# api endpoints

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/predict/set_state")
def set_state(
    food: Union[float, None] = 0,
    transport: Union[float, None] = 0,
    use_public_transport: bool = True,
    utilities: Union[float, None] = 0,
    discretionary: Union[float, None] = 0,
    housing: Union[float, None] = 0,
    invest: Union[float, None] = 0,
    take_home: Union[float, None] = 0,
):
    """
    Set the state of the prediction engine.
    """
    state = {
        "food": food,
        "transport": transport,
        "use_public_transport": use_public_transport,
        "utilities": utilities,
        "discretionary": discretionary,
        "housing": housing,
        "invest": invest,
        "take_home": take_home
    }

    engine.set_new_values(**state)
    
    return {"message": "State updated successfully"}

@app.get("/predict/predict_exp/{category}/{num_mths}")
def read_item(category: str, num_mths: int):
    """
    Predict the expenditure for a specific category and number of months from now.
    """
    if category not in state:
        return {"error": "Invalid category"}
    if num_mths < 1:
        return {"error": "num_mths must be greater than 0"}
    
    lower, pred, upper = engine.predict_expenditure(category, num_mths)
    return {
        "lower": lower,
        "pred": pred,
        "upper": upper
    }

@app.get("/predict/predict_total_expenditure/{num_mths}")
def read_total_expenditure(num_mths: int):
    """
    Predict the total expenditure for a specific number of months from now.
    """
    if num_mths < 1:
        return {"error": "num_mths must be greater than 0"}
    
    result = engine.predict_total_expenditure(num_mths)
    return result

@app.get("/predict/predict_cumulative_savings/{num_mths}")
def read_cumulative_savings(num_mths: int):
    """
    Predict the cumulative savings for a specific number of months from now.
    """
    if num_mths < 1:
        return {"error": "num_mths must be greater than 0"}
    
    lower, pred, upper = engine.predict_cumulative_savings(num_mths)
    return {
        "lower": lower,
        "pred": pred,
        "upper": upper
    }





# run some tests

# print("food expenditure on 6th month from now:")
# print(engine.predict_expenditure("food", 6)) # predict the monthly food expenditure in 6 months
# print("cumulative savings in 6 months:")
# print(engine.predict_cumulative_savings(6)) # predict the cumulative savings in 6 months

# # simulate different discretionary spending
# s1 = state.copy()
# s1["discretionary"] = 100
# s2 = state.copy()
# s2["discretionary"] = 300
# s3 = state.copy()
# s3["discretionary"] = 500
# engine.set_new_values(**s1)
# print("cumulative savings in 6 months with discretionary spending of 100:")
# print(engine.predict_cumulative_savings(6))
# engine.set_new_values(**s2)
# print("cumulative savings in 6 months with discretionary spending of 300:")
# print(engine.predict_cumulative_savings(6))
# engine.set_new_values(**s3)
# print("cumulative savings in 6 months with discretionary spending of 500:")
# print(engine.predict_cumulative_savings(6))