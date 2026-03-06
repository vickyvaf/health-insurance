export type Step = "selection" | "processing" | "success" | "error";

export type State = {
  step: Step;
  selectedPlan: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  fullName: string;
  email: string;
  transactionId: string;
};

export type Action =
  | { type: "SET_STEP"; payload: Step }
  | { type: "SET_SELECTED_PLAN"; payload: string }
  | { type: "SET_CARD_NUMBER"; payload: string }
  | { type: "SET_EXPIRY_DATE"; payload: string }
  | { type: "SET_CVV"; payload: string }
  | { type: "SET_FULL_NAME"; payload: string }
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_TRANSACTION_ID"; payload: string }
  | { type: "RESET_FORM" };

export const initialState: State = {
  step: "selection",
  selectedPlan: "Family",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  fullName: "",
  email: "",
  transactionId: "",
};

export function paymentReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_SELECTED_PLAN":
      return { ...state, selectedPlan: action.payload };
    case "SET_CARD_NUMBER":
      return { ...state, cardNumber: action.payload };
    case "SET_EXPIRY_DATE":
      return { ...state, expiryDate: action.payload };
    case "SET_CVV":
      return { ...state, cvv: action.payload };
    case "SET_FULL_NAME":
      return { ...state, fullName: action.payload };
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_TRANSACTION_ID":
      return { ...state, transactionId: action.payload };
    case "RESET_FORM":
      return initialState;
    default:
      return state;
  }
}
