const FoodCard = ({ food }) => {
  if (!food) {
    return null;
  }

  return (
    <article className="food-card">
      <h3>{food.name}</h3>
      <p>{food.calories ?? 'N/A'} kcal</p>
    </article>
  );
};

export default FoodCard;
