import pandas as pd
from prophet import Prophet

class PredictionEngine():
    interval_width = 0.8 # make predictions with 80% confidence interval
    current_expenditure = {}
    m_food = Prophet(yearly_seasonality=True, interval_width=interval_width)
    m_util = Prophet(yearly_seasonality=True, interval_width=0.6)
    m_tran = Prophet(yearly_seasonality=False, interval_width=0.6) # yearly seasonality is not relevant for transport
    m_petr = Prophet(yearly_seasonality=True, interval_width=0.6)
    m_recr = Prophet(yearly_seasonality=True, interval_width=0.6)

    def __init__(self, food, transport, use_public_transport, utilities, discretionary, housing, invest, take_home):
        self.current_expenditure["food"] = food
        self.current_expenditure["transport"] = transport
        self.current_expenditure["utilities"] = utilities
        self.current_expenditure["discretionary"] = discretionary
        self.current_expenditure["housing"] = housing
        self.current_expenditure["invest"] = invest
        self.use_public_transport = use_public_transport
        self.take_home = take_home
        # read and process external data
        self.initialise_data()
        # fit models
        self.m_food.fit(self.cpi_food)
        self.m_util.fit(self.cpi_utilities)
        self.m_tran.fit(self.cpi_public_transport)
        self.m_petr.fit(self.cpi_petrol)
        self.m_recr.fit(self.cpi_recreation)        

    def initialise_data(self):
        # define helper functions
        mth2num = {
            "Jan": "01",
            "Feb": "02",
            "Mar": "03",
            "Apr": "04",
            "May": "05",
            "Jun": "06",
            "Jul": "07",
            "Aug": "08",
            "Sep": "09",
            "Oct": "10",
            "Nov": "11",
            "Dec": "12"
        }

        def rename_month(x):
            if x == "Data Series":
                return x
            year, mth = x.strip().split(" ")
            return f"{year}-{mth2num[mth]}-01"
        
        # read data
        df = pd.read_csv("data/cpi_data.csv")
        df["Data Series"] = df["Data Series"].str.strip()
        df = df.rename(mapper=rename_month, axis='columns')
        df = df.replace(to_replace="na", value=None)

        def get_ds(series_name):
            return df[df["Data Series"] == series_name].reset_index(drop=True) \
                .drop(columns=["Data Series"]) \
                .T.reset_index().rename(columns={"index": "ds", 0: "y"}) \
                .dropna()

        self.cpi_food = get_ds("Food")
        self.cpi_utilities = get_ds("Utilities & Other Fuels")
        self.cpi_recreation = get_ds("Recreation, Sport & Culture")
        # maybe need to handle transport separately because it may not follow the cpi exactly
        # (some ppl take public transport, some ppl take a lot of private hire, some ppl drive, soooo ??)
        self.cpi_petrol = get_ds("Petrol")
        self.cpi_public_transport = get_ds("Land Transport Services")

    # helper function, computes the gap in months between today and the date given
    def calculate_gap_in_months(self, date_str):
        year, month, day = date_str.split("-")
        today_year, today_month = self.get_today_month_year()
        # compute gap in months
        gap = (today_year - int(year)) * 12 + abs(int(month) - today_month)
        return gap
    
    # helper function, computes today's year and month
    def get_today_month_year(self):
        today = pd.to_datetime("today")
        today_year = today.year
        today_month = today.month
        return today_year, today_month

    # takes in 2 input: category and number of months from now, returns: probability and prediction of price
    def predict_expenditure(self, category, num_mths):
        match category:
            case "food":
                m = self.m_food
                last_recorded_month = self.cpi_food["ds"].iloc[0]
            case "transport":
                m = self.m_tran if self.use_public_transport else self.m_petr
                last_recorded_month = self.cpi_public_transport["ds"].iloc[0] if self.use_public_transport else cpi_petrol["ds"].iloc[0]
            case "utilities":
                m = self.m_util
                last_recorded_month = self.cpi_utilities["ds"].iloc[0]
            case "discretionary":
                m = self.m_recr
                last_recorded_month = self.cpi_recreation["ds"].iloc[0]
        # compute how much to add to the last recorded month, to get prediction for the nth month
        gap = self.calculate_gap_in_months(last_recorded_month)
        num_mths += gap
        
        future = m.make_future_dataframe(periods=num_mths, freq='MS')
        forecast = m.predict(future)

        # compute change in price for each month compared to the current month
        today_year, today_month = self.get_today_month_year()
        today = f"{today_year}-{str(today_month).zfill(2)}-01"
        cpi_base = forecast["yhat"].loc[forecast["ds"] == today].values[0]
        forecast["cpi_change"] = forecast["yhat"] - cpi_base
        forecast["cpi_lower"] = forecast["yhat_lower"] - cpi_base
        forecast["cpi_upper"] = forecast["yhat_upper"] - cpi_base
        # compute the predicted expenditure for each month
        forecast["pred"] = self.current_expenditure[category] + (forecast["cpi_change"] / cpi_base) * self.current_expenditure[category]
        forecast["pred_lower"] = self.current_expenditure[category] + (forecast["cpi_lower"] / cpi_base) * self.current_expenditure[category]
        forecast["pred_upper"] = self.current_expenditure[category] + (forecast["cpi_upper"] / cpi_base) * self.current_expenditure[category]

        # return the predicted price for the next num_mths months
        return forecast.iloc[-(num_mths - gap):].reset_index(drop=True)
    
    # predict total expenditure for a specific month, num_mths from now
    def predict_total_expenditure(self, num_mths):
        # compute for each category the predicted expenditure for the next num_mths months
        pred = {}
        for category in ["food", "transport", "utilities", "discretionary"]:
            pred[category] = self.predict_expenditure(category, num_mths)["pred"].iloc[-1]
        pred["housing"] = self.current_expenditure["housing"]
        pred["invest"] = self.current_expenditure["invest"]
        # output
        return pred

    # predicts cumulative savings in num_mths months
    def predict_cumulative_savings(self, num_mths):
        # compute the predicted expenditure for each category
        food_pred = self.predict_expenditure("food", num_mths)
        transport_pred = self.predict_expenditure("transport", num_mths)
        utilities_pred = self.predict_expenditure("utilities", num_mths)
        discretionary_pred = self.predict_expenditure("discretionary", num_mths)

        # compute fixed expenditures, not affected by prices
        fixed = self.current_expenditure["housing"] + self.current_expenditure["invest"]

        # compute the total predicted expenditure for each month
        total_pred = food_pred["pred"] + transport_pred["pred"] + utilities_pred["pred"] + discretionary_pred["pred"] + fixed
        total_pred_lower = food_pred["pred_lower"] + transport_pred["pred_lower"] + utilities_pred["pred_lower"] + discretionary_pred["pred_lower"] + fixed
        total_pred_upper = food_pred["pred_upper"] + transport_pred["pred_upper"] + utilities_pred["pred_upper"] + discretionary_pred["pred_upper"] + fixed

        # compute the savings for each month
        savings = self.take_home - total_pred
        savings_upper = self.take_home - total_pred_lower # upper bound of savings = monthly income - lower bound of expenditure
        savings_lower = self.take_home - total_pred_upper # lower bound of savings = monthly income - upper bound of expenditure

        # compute the cumulative savings in total
        savings = savings.cumsum()
        savings_upper = savings_upper.cumsum()
        savings_lower = savings_lower.cumsum()
        
        print(savings)

        # return cumulative savings for the last num_mths and the next num_mths
        return savings_lower.iloc[-(2*num_mths):], savings.iloc[-(2*num_mths):], savings_upper.iloc[-(2*num_mths):]

        # return savings_lower.iloc[-1], savings.iloc[-1], savings_upper.iloc[-1]
    
    # set new values
    def set_new_values(self, food, transport, use_public_transport, utilities, discretionary, housing, invest, take_home):
        self.current_expenditure["food"] = food
        self.current_expenditure["transport"] = transport
        self.current_expenditure["utilities"] = utilities
        self.current_expenditure["discretionary"] = discretionary
        self.current_expenditure["housing"] = housing
        self.current_expenditure["invest"] = invest
        self.use_public_transport = use_public_transport
        self.take_home = take_home

