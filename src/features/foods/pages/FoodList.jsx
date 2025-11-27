import FoodTable from '../components/FoodTable.jsx';
import { useFoodQuery } from '../hooks/useFoodQuery.js';

const FoodList = () => {
  const foods = useFoodQuery();

  return (
    <section>
      <h2>Foods</h2>
      <FoodTable foods={foods} />
    </section>
  );
};

export default FoodList;
