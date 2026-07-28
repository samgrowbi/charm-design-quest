import { createContext, useContext } from "react";
import { TreatmentConfig, INSTANT_LIFT_TREATMENT } from "@/config/treatments";

const TreatmentContext = createContext<TreatmentConfig>(INSTANT_LIFT_TREATMENT);

export const TreatmentProvider = ({
  treatment,
  children,
}: {
  treatment: TreatmentConfig;
  children: React.ReactNode;
}) => (
  <TreatmentContext.Provider value={treatment}>
    {children}
  </TreatmentContext.Provider>
);

export const useTreatment = () => useContext(TreatmentContext);
