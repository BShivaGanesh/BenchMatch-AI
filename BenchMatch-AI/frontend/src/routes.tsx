import React from "react";
import type { RouteObject } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import NewRequirementPage from "./pages/NewRequirementPage";
import CandidateShortlistPage from "./pages/CandidateShortlistPage";

export const routes: RouteObject[] = [
  { path: "/", element: <DashboardPage /> },
  { path: "/requirements/new", element: <NewRequirementPage /> },
  { path: "/shortlist", element: <CandidateShortlistPage /> },
];
