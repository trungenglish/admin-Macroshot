const ControlledForm = ({ children, onSubmit }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return <form onSubmit={handleSubmit}>{children}</form>;
};

export default ControlledForm;
