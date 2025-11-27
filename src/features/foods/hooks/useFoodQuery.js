import { useEffect, useState } from 'react';
import { foodsService } from '../services';

export const useFoodQuery = () => {
  const [foods, setFoods] = useState([]);

  useEffect(() => {
    foodsService.list().then(setFoods);
  }, []);

  return foods;
};
