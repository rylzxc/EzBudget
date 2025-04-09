"use server"
import { prisma } from "@/database/src/client";

export interface RegisterUserParams {
    email: string;
    password: string;
    name?: string;
}

export interface UserOnboardingDetails {
    age: number;
    number_of_kids: number;
    monthly_take_home: number;
    planning_to_buy_home: boolean;
    repaying_home_loans: boolean;
    supporting_aged_parents: boolean;
    transport_expenditure: number;
    food_expenditure: number;
    housing_expenditure: number;
    emergency_funds: number;
    main_financial_goal: string;
    budget_flexibility: string;
    financial_struggle: string;
  }
  

export async function registerUser(userData: RegisterUserParams) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
  
      if (existingUser) {
        throw new Error("User already exists with this email");
      }
  
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: userData.password,
        },
      });

      console.log("New user created:", newUser);
  
      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create user",
      };
    }
  }
  
  export async function updateUser(userId: number, onboardingDetails: UserOnboardingDetails) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          age: onboardingDetails.age,
          number_of_kids: onboardingDetails.number_of_kids,
          monthly_take_home: onboardingDetails.monthly_take_home,
          planning_to_buy_home: onboardingDetails.planning_to_buy_home,
          repaying_home_loans: onboardingDetails.repaying_home_loans,
          supporting_aged_parents: onboardingDetails.supporting_aged_parents,
          transport_expenditure: onboardingDetails.transport_expenditure,
          food_expenditure: onboardingDetails.food_expenditure,
          housing_expenditure: onboardingDetails.housing_expenditure,
          emergency_funds: onboardingDetails.emergency_funds,
          main_financial_goal: onboardingDetails.main_financial_goal,
          budget_flexibility: onboardingDetails.budget_flexibility,
          financial_struggle: onboardingDetails.financial_struggle,
        },
      });
  
      return {
        success: true,
        user: updatedUser,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to update user",
      };
    }
  }