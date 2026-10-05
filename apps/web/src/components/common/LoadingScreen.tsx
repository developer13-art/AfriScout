import { Loader } from "../ui/Loader";

export interface LoadingScreenProps {
  label?: string;
}

export function LoadingScreen({ label = "Loading" }: LoadingScreenProps) {
  return <Loader size="lg" fullPage label={label} />;
}