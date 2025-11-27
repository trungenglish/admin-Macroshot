import FoodCard from '../components/FoodCard.jsx';

const FoodDetail = ({ food }) => {
  return (
    <section>
      <h2>Food detail</h2>
      <FoodCard food={food} />
    </section>
  );
};

export default FoodDetail;
