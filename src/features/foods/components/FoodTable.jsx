const FoodTable = ({ foods = [] }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Calories</th>
        </tr>
      </thead>
      <tbody>
        {foods.map((food) => (
          <tr key={food.id}>
            <td>{food.name}</td>
            <td>{food.calories ?? '-'} kcal</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default FoodTable;
