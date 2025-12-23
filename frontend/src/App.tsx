import React from "react";
import { useRoutes } from "react-router-dom";
import { routes } from "./routes";
import AppLayout from "./components/layout/AppLayout";

const App: React.FC = () => {
  const element = useRoutes(routes);

  return <AppLayout>{element}</AppLayout>;
};

export default App;
