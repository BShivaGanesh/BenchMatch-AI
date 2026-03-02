import React from "react";
import { Navigate } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import NewRequirementPage from "../pages/NewRequirementPage";
import CandidateShortlistPage from "../pages/CandidateShortlistPage";

export const routes = [
  { path: "/", element: <DashboardPage /> },
  { path: "/dashboard", element: <Navigate to="/" replace /> },
  { path: "/requirements/new", element: <NewRequirementPage /> },
  { path: "/shortlist/:requirementId", element: <CandidateShortlistPage /> },
  { path: "/shortlist", element: <CandidateShortlistPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
];

