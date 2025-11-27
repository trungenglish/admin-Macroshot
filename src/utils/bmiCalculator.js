export const calculateBMI = ({ heightInCm, weightInKg }) => {
  if (!heightInCm || !weightInKg) {
    return null;
  }
  const heightInM = heightInCm / 100;
  return Number((weightInKg / (heightInM * heightInM)).toFixed(2));
};
