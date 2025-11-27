const PieChart = ({ data = [] }) => {
  // Placeholder component until we pick a charting library
  return (
    <div>
      <h4>Pie chart</h4>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default PieChart;
